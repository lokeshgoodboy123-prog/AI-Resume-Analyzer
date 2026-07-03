import { Router, type IRouter } from "express";
import {
  RegisterUserBody,
  LoginUserBody,
  UpdateProfileBody,
  ChangePasswordBody,
} from "@workspace/api-zod";
import { User } from "../models/user";
import { requireAuth, generateToken } from "../middlewares/auth";
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

// POST /auth/register
router.post("/register", async (req, res): Promise<void> => {
  if (!dbCheck(res)) return;

  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid input" });
    return;
  }

  const { name, email, password } = parsed.data;

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const user = new User({ name, email, password });
  await user.save();

  const token = generateToken(user._id.toString());

  res.status(201).json({
    token,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    },
  });
});

// POST /auth/login
router.post("/login", async (req, res): Promise<void> => {
  if (!dbCheck(res)) return;

  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const { email, password } = parsed.data;

  const user = await User.findOne({ email });
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const match = await user.comparePassword(password);
  if (!match) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = generateToken(user._id.toString());

  res.json({
    token,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    },
  });
});

// GET /auth/profile
router.get("/profile", requireAuth, async (req, res): Promise<void> => {
  if (!dbCheck(res)) return;

  const user = await User.findById(req.userId).select("-password");
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  });
});

// PUT /auth/profile
router.put("/profile", requireAuth, async (req, res): Promise<void> => {
  if (!dbCheck(res)) return;

  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid input" });
    return;
  }

  const user = await User.findByIdAndUpdate(
    req.userId,
    { name: parsed.data.name },
    { new: true, runValidators: true },
  ).select("-password");

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  });
});

// PUT /auth/password
router.put("/password", requireAuth, async (req, res): Promise<void> => {
  if (!dbCheck(res)) return;

  const parsed = ChangePasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid input" });
    return;
  }

  const { currentPassword, newPassword } = parsed.data;

  const user = await User.findById(req.userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const match = await user.comparePassword(currentPassword);
  if (!match) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }

  user.password = newPassword;
  await user.save();

  res.json({ message: "Password updated successfully" });
});

// DELETE /auth/account
router.delete("/account", requireAuth, async (req, res): Promise<void> => {
  if (!dbCheck(res)) return;

  await User.findByIdAndDelete(req.userId);

  // Also delete all resumes + their files for this user
  const { Resume } = await import("../models/resume");
  const resumes = await Resume.find({ userId: req.userId }).select("filePath");
  for (const r of resumes) {
    if (r.filePath) {
      try { require("fs").unlinkSync(r.filePath); } catch { /* ignore */ }
    }
  }
  await Resume.deleteMany({ userId: req.userId });

  res.json({ message: "Account deleted successfully" });
});

export default router;
