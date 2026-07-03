import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import { mkdirSync, existsSync, unlinkSync, readFileSync } from "fs";
import { requireAuth } from "../middlewares/auth";
import { parseResume } from "../lib/resume-parser";
import { analyzeResumeWithAI } from "../lib/openai-client";
import { Resume } from "../models/resume";
import { isDBConnected } from "../lib/mongodb";
import { logger } from "../lib/logger";

/**
 * Validate file magic bytes to prevent spoofed MIME/extension attacks.
 * PDF: %PDF- (25 50 44 46 2D)
 * DOCX: ZIP PK signature (50 4B 03 04)
 */
function detectFileType(filePath: string): "pdf" | "docx" | "unknown" {
  const buf = readFileSync(filePath, { flag: "r" });
  const header = buf.slice(0, 8);
  // PDF: starts with %PDF
  if (header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46) {
    return "pdf";
  }
  // DOCX/ZIP: PK\x03\x04
  if (header[0] === 0x50 && header[1] === 0x4b && header[2] === 0x03 && header[3] === 0x04) {
    return "docx";
  }
  return "unknown";
}

/** Silently delete a file if it exists */
function safeUnlink(filePath: string): void {
  try {
    unlinkSync(filePath);
  } catch {
    // Ignore if file doesn't exist or already deleted
  }
}

const router: IRouter = Router();

// Ensure uploads directory exists
const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
if (!existsSync(UPLOADS_DIR)) {
  mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(pdf|docx)$/i)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and DOCX files are allowed"));
    }
  },
});

function dbCheck(res: import("express").Response): boolean {
  if (!isDBConnected()) {
    res.status(503).json({ error: "Database not connected. Please configure MONGODB_URI." });
    return false;
  }
  return true;
}

function resumeToHistoryItem(r: InstanceType<typeof Resume>) {
  return {
    id: r._id.toString(),
    filename: r.filename,
    uploadedAt: (r.uploadedAt || r.createdAt).toISOString(),
    atsScore: r.atsScore,
    jobDescription: r.jobDescription ?? null,
  };
}

function resumeToAnalysis(r: InstanceType<typeof Resume>) {
  return {
    id: r._id.toString(),
    filename: r.filename,
    uploadedAt: (r.uploadedAt || r.createdAt).toISOString(),
    atsScore: r.atsScore,
    jobDescription: r.jobDescription ?? null,
    resumeText: r.resumeText ?? null,
    extractedInfo: r.extractedInfo ?? null,
    aiAnalysis: r.aiAnalysis ?? null,
  };
}

// GET /resumes — resume history
router.get("/", requireAuth, async (req, res): Promise<void> => {
  if (!dbCheck(res)) return;

  const resumes = await Resume.find({ userId: req.userId })
    .sort({ uploadedAt: -1 })
    .select("-resumeText -filePath");

  res.json(resumes.map(resumeToHistoryItem));
});

// POST /resumes/upload — upload + analyze
router.post(
  "/upload",
  requireAuth,
  upload.single("file"),
  async (req, res): Promise<void> => {
    if (!dbCheck(res)) return;

    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const jobDescription = typeof req.body.jobDescription === "string"
      ? req.body.jobDescription.trim()
      : undefined;

    const filePath = req.file.path;
    try {
      // Validate actual file content via magic bytes — MIME and extension are user-controlled
      const detectedType = detectFileType(filePath);
      if (detectedType === "unknown") {
        safeUnlink(filePath);
        res.status(400).json({ error: "Invalid file. Only genuine PDF and DOCX files are accepted." });
        return;
      }

      // Use magic-byte-detected type as the authoritative MIME for parsing
      const safeMime =
        detectedType === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

      // Parse the resume file
      const parsed = await parseResume(filePath, safeMime);

      // Run AI analysis — passes full parsed structure so local fallback
      // can produce content-driven, varied scores when OpenAI is unavailable
      const aiAnalysis = await analyzeResumeWithAI(
        parsed.text,
        jobDescription,
        parsed,
      );

      // Save to database
      const resume = new Resume({
        userId: req.userId,
        filename: req.file.originalname,
        filePath,
        jobDescription: jobDescription || undefined,
        resumeText: parsed.text,
        atsScore: aiAnalysis.atsScore,
        extractedInfo: {
          name: parsed.name,
          email: parsed.email,
          phone: parsed.phone,
          skills: parsed.skills,
          education: parsed.education,
          experience: parsed.experience,
          projects: parsed.projects,
          certifications: parsed.certifications,
        },
        aiAnalysis,
      });

      await resume.save();

      // Clean up disk file — text is stored in DB
      safeUnlink(filePath);

      res.status(201).json(resumeToAnalysis(resume));
    } catch (err) {
      // Clean up on failure to avoid PII retention
      safeUnlink(filePath);
      logger.error({ err }, "Resume upload/analysis failed");
      const message = err instanceof Error ? err.message : "Analysis failed";
      // 400 for client input errors (bad file content), 502 for upstream failures (AI/parser)
      const isClientError =
        message.includes("Unsupported file type") ||
        message.includes("Invalid PDF") ||
        message.includes("bad XRef");
      res.status(isClientError ? 400 : 502).json({ error: message });
    }
  },
);

// GET /resumes/:id — single analysis
router.get("/:id", requireAuth, async (req, res): Promise<void> => {
  if (!dbCheck(res)) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const resume = await Resume.findOne({ _id: raw, userId: req.userId });
  if (!resume) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }

  res.json(resumeToAnalysis(resume));
});

// DELETE /resumes/:id — delete a resume
router.delete("/:id", requireAuth, async (req, res): Promise<void> => {
  if (!dbCheck(res)) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const resume = await Resume.findOneAndDelete({ _id: raw, userId: req.userId });
  if (!resume) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }

  // Clean up any leftover file on disk
  if (resume.filePath) safeUnlink(resume.filePath);

  res.json({ message: "Analysis deleted successfully" });
});

export default router;
