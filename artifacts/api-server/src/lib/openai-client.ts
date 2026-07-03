import OpenAI from "openai";
import { logger } from "./logger";

let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export interface AIAnalysisResult {
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
  salaryEstimate: string;
  careerSuggestions: string[];
  grammarSuggestions: string[];
  actionVerbSuggestions: string[];
  keywordOptimizationTips: string[];
  formattingSuggestions: string[];
}

const FALLBACK_ANALYSIS: AIAnalysisResult = {
  atsScore: 50,
  missingKeywords: ["Unable to complete AI analysis"],
  strongSections: [],
  weakSections: [],
  professionalSummary:
    "AI analysis unavailable. Please check your OpenAI API key configuration.",
  technicalSkillSuggestions: [],
  softSkillSuggestions: [],
  jobRoles: [],
  interviewQuestions: [],
  improvementSuggestions: [
    "Configure OPENAI_API_KEY environment variable to enable AI analysis",
  ],
  salaryEstimate: "Unable to estimate",
  careerSuggestions: [],
  grammarSuggestions: [],
  actionVerbSuggestions: [],
  keywordOptimizationTips: [],
  formattingSuggestions: [],
};

export async function analyzeResumeWithAI(
  resumeText: string,
  jobDescription?: string,
): Promise<AIAnalysisResult> {
  try {
    const client = getOpenAIClient();

    const systemPrompt = `You are an expert resume analyst and ATS specialist with deep knowledge of hiring processes, industry trends, and keyword optimization. Analyze resumes comprehensively and provide detailed, actionable feedback. Always respond with valid JSON only, no markdown.`;

    const jobContext = jobDescription
      ? `\n\nTarget Job Description:\n${jobDescription}`
      : "";

    const userPrompt = `Analyze this resume and provide a comprehensive ATS and career analysis.${jobContext}

Resume Text:
${resumeText.slice(0, 4000)}

Respond with a single valid JSON object with exactly these fields:
{
  "atsScore": <integer 0-100, ATS compatibility score>,
  "missingKeywords": [<5-15 important missing keywords/skills for the industry>],
  "strongSections": [<resume sections that are strong, e.g. "Work Experience", "Technical Skills">],
  "weakSections": [<sections needing improvement, e.g. "Professional Summary", "Certifications">],
  "professionalSummary": "<improved 3-4 sentence professional summary>",
  "technicalSkillSuggestions": [<5-10 technical skills to add/highlight>],
  "softSkillSuggestions": [<4-6 soft skills to emphasize>],
  "jobRoles": [<5-8 recommended job titles matching this resume>],
  "interviewQuestions": [<8-12 likely interview questions based on experience>],
  "improvementSuggestions": [<5-10 specific actionable improvements>],
  "salaryEstimate": "<realistic salary range estimate e.g. $80,000 - $110,000>",
  "careerSuggestions": [<3-5 career path/growth suggestions>],
  "grammarSuggestions": [<3-5 grammar or language improvements>],
  "actionVerbSuggestions": [<5-8 stronger action verbs to replace weak ones>],
  "keywordOptimizationTips": [<3-5 keyword optimization tips>],
  "formattingSuggestions": [<3-5 formatting improvements>]
}`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 2500,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from OpenAI");

    const parsed = JSON.parse(content) as AIAnalysisResult;
    // Ensure atsScore is within range
    parsed.atsScore = Math.min(100, Math.max(0, Math.round(parsed.atsScore)));
    return parsed;
  } catch (err) {
    logger.error({ err }, "OpenAI resume analysis failed");
    return FALLBACK_ANALYSIS;
  }
}
