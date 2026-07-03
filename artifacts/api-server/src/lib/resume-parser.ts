import { readFileSync } from "fs";
import { logger } from "./logger";

export interface ParsedResume {
  text: string;
  name?: string;
  email?: string;
  phone?: string;
  skills: string[];
  education: string[];
  experience: string[];
  projects: string[];
  certifications: string[];
}

export async function parseResume(
  filePath: string,
  mimetype: string,
): Promise<ParsedResume> {
  let text = "";

  try {
    if (
      mimetype === "application/pdf" ||
      filePath.toLowerCase().endsWith(".pdf")
    ) {
      // pdf-parse v1.x — CJS module, exports a function directly
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParse = (await import("pdf-parse")).default as any;
      const buffer = readFileSync(filePath);
      const result = await pdfParse(buffer);
      text = result.text as string;
    } else if (
      mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      filePath.toLowerCase().endsWith(".docx")
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mammoth = (await import("mammoth")) as any;
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value as string;
    } else {
      throw new Error("Unsupported file type. Please upload a PDF or DOCX.");
    }
  } catch (err) {
    logger.error({ err }, "Resume parsing error");
    throw err;
  }

  return extractResumeData(text);
}

function extractResumeData(text: string): ParsedResume {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Extract email
  const emailMatch = text.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch?.[0];

  // Extract phone number
  const phoneMatch = text.match(
    /(\+?[\d][\d\s\-().]{7,}[\d])/,
  );
  const phone = phoneMatch?.[0]?.trim();

  // First non-email, non-phone line is likely the name
  const name =
    lines.find(
      (l) =>
        l.length > 2 &&
        l.length < 60 &&
        !l.includes("@") &&
        !l.match(/\d{3}/) &&
        l === l.replace(/[^a-zA-Z\s'-]/g, "").trim(),
    ) || undefined;

  const skills = extractSection(text, [
    "skills",
    "technical skills",
    "core competencies",
    "technologies",
    "tools",
  ]);
  const education = extractSection(text, [
    "education",
    "academic background",
    "qualifications",
    "degree",
  ]);
  const experience = extractSection(text, [
    "experience",
    "work experience",
    "employment history",
    "professional experience",
    "career history",
  ]);
  const projects = extractSection(text, [
    "projects",
    "personal projects",
    "key projects",
    "portfolio",
  ]);
  const certifications = extractSection(text, [
    "certifications",
    "certificates",
    "licenses",
    "achievements",
    "awards",
  ]);

  return {
    text,
    name,
    email,
    phone,
    skills: skills.slice(0, 25),
    education: education.slice(0, 10),
    experience: experience.slice(0, 15),
    projects: projects.slice(0, 10),
    certifications: certifications.slice(0, 10),
  };
}

function extractSection(text: string, sectionNames: string[]): string[] {
  const lines = text.split("\n");
  const results: string[] = [];
  let inSection = false;
  let emptyCount = 0;

  const allHeaders = [
    "education",
    "experience",
    "skills",
    "projects",
    "certifications",
    "references",
    "achievements",
    "summary",
    "objective",
    "profile",
    "awards",
    "publications",
    "languages",
    "interests",
    "volunteer",
    "contact",
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();

    if (!inSection) {
      if (
        sectionNames.some((n) => lower.includes(n)) &&
        trimmed.length < 60
      ) {
        inSection = true;
        emptyCount = 0;
      }
    } else {
      // Stop at next section header
      const isNewSection =
        allHeaders.some(
          (h) =>
            lower.includes(h) &&
            trimmed.length < 60 &&
            !sectionNames.some((n) => lower.includes(n)),
        );
      if (isNewSection) break;

      if (trimmed && trimmed.length > 2 && trimmed.length < 300) {
        results.push(trimmed);
        emptyCount = 0;
      } else if (!trimmed) {
        emptyCount++;
        if (emptyCount > 4) break;
      }
    }
  }

  // Fallback for skills: detect common tech keywords in full text
  if (results.length === 0 && sectionNames.includes("skills")) {
    const techKeywords = [
      "JavaScript",
      "TypeScript",
      "Python",
      "Java",
      "C++",
      "C#",
      "Ruby",
      "Go",
      "Rust",
      "Swift",
      "Kotlin",
      "React",
      "Angular",
      "Vue.js",
      "Next.js",
      "Node.js",
      "Express",
      "Django",
      "Spring",
      "Laravel",
      "SQL",
      "MongoDB",
      "PostgreSQL",
      "MySQL",
      "Redis",
      "AWS",
      "Azure",
      "GCP",
      "Docker",
      "Kubernetes",
      "Git",
      "CI/CD",
      "REST",
      "GraphQL",
      "Linux",
      "Agile",
      "Scrum",
      "HTML",
      "CSS",
      "Tailwind",
      "Machine Learning",
      "AI",
      "TensorFlow",
      "PyTorch",
    ];
    return techKeywords
      .filter((kw) => text.toLowerCase().includes(kw.toLowerCase()))
      .slice(0, 20);
  }

  return results;
}
