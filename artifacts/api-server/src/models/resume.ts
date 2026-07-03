import mongoose, { Schema, Document, Model } from "mongoose";

export interface IExtractedInfo {
  name?: string;
  email?: string;
  phone?: string;
  skills: string[];
  education: string[];
  experience: string[];
  projects: string[];
  certifications: string[];
}

export interface IAiAnalysis {
  atsScore: number;
  missingKeywords: string[];
  strongSections: string[];
  weakSections: string[];
  professionalSummary: string;
  technicalSkillSuggestions: string[];
  softSkillSuggestions: string[];
  jobRoles: string[];
  interviewQuestions: string[];
  improvementSuggestions: string[];
  salaryEstimate?: string;
  careerSuggestions: string[];
  grammarSuggestions: string[];
  actionVerbSuggestions: string[];
  keywordOptimizationTips: string[];
  formattingSuggestions: string[];
}

export interface IResume extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  filename: string;
  filePath: string;
  jobDescription?: string;
  resumeText: string;
  atsScore: number;
  extractedInfo: IExtractedInfo;
  aiAnalysis: IAiAnalysis;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const extractedInfoSchema = new Schema<IExtractedInfo>(
  {
    name: String,
    email: String,
    phone: String,
    skills: [String],
    education: [String],
    experience: [String],
    projects: [String],
    certifications: [String],
  },
  { _id: false },
);

const aiAnalysisSchema = new Schema<IAiAnalysis>(
  {
    atsScore: { type: Number, default: 0 },
    missingKeywords: { type: [String], default: [] },
    strongSections: { type: [String], default: [] },
    weakSections: { type: [String], default: [] },
    professionalSummary: { type: String, default: "" },
    technicalSkillSuggestions: { type: [String], default: [] },
    softSkillSuggestions: { type: [String], default: [] },
    jobRoles: { type: [String], default: [] },
    interviewQuestions: { type: [String], default: [] },
    improvementSuggestions: { type: [String], default: [] },
    salaryEstimate: String,
    careerSuggestions: { type: [String], default: [] },
    grammarSuggestions: { type: [String], default: [] },
    actionVerbSuggestions: { type: [String], default: [] },
    keywordOptimizationTips: { type: [String], default: [] },
    formattingSuggestions: { type: [String], default: [] },
  },
  { _id: false },
);

const resumeSchema = new Schema<IResume>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    filename: { type: String, required: true },
    filePath: { type: String, required: true },
    jobDescription: String,
    resumeText: { type: String, default: "" },
    atsScore: { type: Number, default: 0 },
    extractedInfo: {
      type: extractedInfoSchema,
      default: () => ({
        skills: [],
        education: [],
        experience: [],
        projects: [],
        certifications: [],
      }),
    },
    aiAnalysis: {
      type: aiAnalysisSchema,
      default: () => ({}),
    },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const Resume: Model<IResume> = mongoose.model<IResume>(
  "Resume",
  resumeSchema,
);
