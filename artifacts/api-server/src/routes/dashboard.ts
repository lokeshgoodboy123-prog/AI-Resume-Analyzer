import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth";
import { Resume } from "../models/resume";
import { isDBConnected } from "../lib/mongodb";

const router: IRouter = Router();

function dbCheck(res: import("express").Response): boolean {
  if (!isDBConnected()) {
    res
      .status(503)
      .json({ error: "Database not connected. Please configure MONGODB_URI." });
    return false;
  }
  return true;
}

// GET /dashboard/stats
router.get("/stats", requireAuth, async (req, res): Promise<void> => {
  if (!dbCheck(res)) return;

  const resumes = await Resume.find({ userId: req.userId })
    .sort({ uploadedAt: -1 })
    .select("filename uploadedAt atsScore jobDescription");

  const totalAnalyses = resumes.length;

  if (totalAnalyses === 0) {
    res.json({
      totalAnalyses: 0,
      averageAtsScore: 0,
      highestAtsScore: 0,
      recentAnalyses: [],
      scoreDistribution: [
        { range: "0-20", count: 0 },
        { range: "21-40", count: 0 },
        { range: "41-60", count: 0 },
        { range: "61-80", count: 0 },
        { range: "81-100", count: 0 },
      ],
    });
    return;
  }

  const scores = resumes.map((r) => r.atsScore);
  const averageAtsScore = Math.round(
    scores.reduce((sum, s) => sum + s, 0) / totalAnalyses,
  );
  const highestAtsScore = Math.max(...scores);

  // Score distribution
  const distribution = [
    { range: "0-20", count: 0 },
    { range: "21-40", count: 0 },
    { range: "41-60", count: 0 },
    { range: "61-80", count: 0 },
    { range: "81-100", count: 0 },
  ];
  for (const score of scores) {
    if (score <= 20) distribution[0].count++;
    else if (score <= 40) distribution[1].count++;
    else if (score <= 60) distribution[2].count++;
    else if (score <= 80) distribution[3].count++;
    else distribution[4].count++;
  }

  const recentAnalyses = resumes.slice(0, 5).map((r) => ({
    id: r._id.toString(),
    filename: r.filename,
    uploadedAt: (r.uploadedAt || r.createdAt).toISOString(),
    atsScore: r.atsScore,
    jobDescription: r.jobDescription ?? null,
  }));

  res.json({
    totalAnalyses,
    averageAtsScore,
    highestAtsScore,
    recentAnalyses,
    scoreDistribution: distribution,
  });
});

export default router;
