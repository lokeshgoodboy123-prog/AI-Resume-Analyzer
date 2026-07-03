import OpenAI from "openai";
import { logger } from "./logger";
import type { ParsedResume } from "./resume-parser";

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
  analysisSource: "ai" | "local";
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

// ─── Common word stoplist for keyword filtering ────────────────────────────────
const STOP_WORDS = new Set([
  "the","and","for","with","that","this","have","from","are","was","were",
  "will","your","our","their","they","been","has","had","but","not","also",
  "can","all","each","such","more","than","into","its","some","may","any",
  "about","other","which","when","what","where","who","how","both","under",
  "over","after","before","then","would","could","should","must","shall",
  "very","well","just","like","even","work","make","need","able","come",
]);

// ─── Local rule-based ATS scorer ─────────────────────────────────────────────

const ALL_TECH_KEYWORDS = [
  "JavaScript","TypeScript","Python","Java","C++","C#","Ruby","Go","Rust",
  "Swift","Kotlin","PHP","Scala","R","MATLAB","Shell","Bash","PowerShell",
  "React","Angular","Vue.js","Next.js","Nuxt","Svelte","jQuery","Bootstrap",
  "Node.js","Express","Django","FastAPI","Flask","Spring Boot","Laravel",
  "Rails","ASP.NET","GraphQL","REST","gRPC","WebSocket",
  "SQL","PostgreSQL","MySQL","MongoDB","Redis","Elasticsearch","Cassandra",
  "DynamoDB","SQLite","Oracle","MariaDB","Firebase","Supabase",
  "AWS","Azure","GCP","Docker","Kubernetes","Terraform","Ansible","Jenkins",
  "GitHub Actions","CI/CD","DevOps","Nginx","Linux","Git","Microservices",
  "Machine Learning","Deep Learning","NLP","TensorFlow","PyTorch","scikit-learn",
  "Pandas","NumPy","Spark","Hadoop","Kafka","Airflow","dbt","Power BI","Tableau",
  "React Native","Flutter","Swift","Kotlin","Expo","iOS","Android",
  "HTML","CSS","Sass","Tailwind","Webpack","Vite","Jest","Cypress","Selenium",
  "Agile","Scrum","JIRA","Figma","Sketch","Adobe XD",
];

const ACTION_VERBS = [
  "achieved","accelerated","architected","automated","built","collaborated",
  "created","delivered","designed","developed","drove","engineered","enhanced",
  "established","executed","generated","implemented","improved","increased",
  "launched","led","managed","mentored","migrated","optimized","orchestrated",
  "oversaw","reduced","refactored","resolved","scaled","shipped","spearheaded",
  "streamlined","transformed","deployed","integrated","maintained","operated",
];

const SOFT_SKILLS_POOL = [
  "Leadership","Communication","Problem-solving","Teamwork","Adaptability",
  "Time management","Critical thinking","Collaboration","Creativity",
  "Attention to detail","Project management","Decision-making","Mentoring",
];

function detectJobFamily(skills: string[], text: string): {
  family: string;
  roles: string[];
  salary: string;
  techSuggestions: string[];
} {
  const t = text.toLowerCase();

  const isML = /machine.learning|deep.learning|nlp|tensorflow|pytorch|scikit|data.scien/i.test(t);
  const isData = /data.eng|spark|kafka|airflow|pipeline|etl|warehouse/i.test(t);
  const isFrontend = /react|angular|vue|html|css|frontend|ui.developer/i.test(t);
  const isBackend = /node|express|django|spring|laravel|backend|api/i.test(t);
  const isFullstack = (isFrontend && isBackend) || /fullstack|full.stack/i.test(t);
  const isDevOps = /docker|kubernetes|terraform|jenkins|devops|cloud.engineer/i.test(t);
  const isMobile = /swift|kotlin|flutter|react.native|android|ios/i.test(t);
  const isSecurity = /security|penetration|soc|siem|firewall|vulnerability/i.test(t);

  if (isML) return {
    family: "Machine Learning / AI",
    roles: ["Machine Learning Engineer","Data Scientist","AI Engineer","NLP Engineer","MLOps Engineer","Research Scientist","Computer Vision Engineer"],
    salary: "$110,000 – $160,000",
    techSuggestions: ["MLflow","Kubeflow","Ray","LangChain","Hugging Face Transformers","ONNX","Triton Inference Server","W&B (Weights & Biases)","Feature Store","Vector Databases"],
  };
  if (isData) return {
    family: "Data Engineering",
    roles: ["Data Engineer","Analytics Engineer","Platform Engineer","ETL Developer","Cloud Data Engineer","Big Data Engineer","BI Developer"],
    salary: "$100,000 – $145,000",
    techSuggestions: ["dbt","Apache Iceberg","Delta Lake","Snowflake","BigQuery","Redshift","Trino","Flink","Great Expectations","Data Catalog"],
  };
  if (isDevOps) return {
    family: "DevOps / Cloud",
    roles: ["DevOps Engineer","Site Reliability Engineer","Platform Engineer","Cloud Architect","Infrastructure Engineer","Kubernetes Engineer","Release Engineer"],
    salary: "$105,000 – $155,000",
    techSuggestions: ["ArgoCD","Helm","Prometheus","Grafana","OpenTelemetry","Vault","Pulumi","GitOps","Service Mesh (Istio)","FinOps"],
  };
  if (isMobile) return {
    family: "Mobile Development",
    roles: ["iOS Developer","Android Developer","Mobile Engineer","React Native Developer","Flutter Developer","Cross-Platform Developer","Lead Mobile Engineer"],
    salary: "$95,000 – $140,000",
    techSuggestions: ["SwiftUI","Jetpack Compose","Expo","Firebase","RevenueCat","TestFlight","App Store Connect","Push Notifications","Offline Sync","Accessibility (a11y)"],
  };
  if (isSecurity) return {
    family: "Cybersecurity",
    roles: ["Security Engineer","Penetration Tester","SOC Analyst","Security Architect","Cloud Security Engineer","AppSec Engineer","GRC Analyst"],
    salary: "$95,000 – $145,000",
    techSuggestions: ["SIEM (Splunk/QRadar)","Burp Suite","Nmap","Metasploit","Zero Trust","IAM","OWASP Top 10","Threat Modeling","SOAR","Compliance (SOC2/ISO27001)"],
  };
  if (isFullstack) return {
    family: "Full-Stack Development",
    roles: ["Full-Stack Engineer","Software Engineer","Senior Developer","Tech Lead","Solutions Architect","Product Engineer","Backend Engineer"],
    salary: "$95,000 – $140,000",
    techSuggestions: ["tRPC","Prisma","Redis caching","WebSockets","OpenAPI","Microservices","Event-driven architecture","OAuth2/OIDC","Feature flags","Load testing"],
  };
  if (isFrontend) return {
    family: "Frontend Development",
    roles: ["Frontend Engineer","UI Engineer","React Developer","Web Developer","UI/UX Developer","Component Library Engineer","Staff Frontend Engineer"],
    salary: "$85,000 – $130,000",
    techSuggestions: ["Storybook","Playwright","Lighthouse","Web Vitals","Accessibility (WCAG)","Design tokens","Module federation","Edge rendering","CSS-in-JS","Animation libraries"],
  };
  if (isBackend) return {
    family: "Backend Development",
    roles: ["Backend Engineer","Software Engineer","API Developer","Platform Engineer","Systems Engineer","Senior Backend Developer","Distributed Systems Engineer"],
    salary: "$90,000 – $135,000",
    techSuggestions: ["gRPC","Message queues (RabbitMQ/SQS)","Rate limiting","Caching strategies","Database indexing","API gateway","Service mesh","Background jobs","Observability","Contract testing"],
  };

  // Generic software role
  return {
    family: "Software Engineering",
    roles: ["Software Engineer","Software Developer","Application Developer","Junior Developer","Mid-level Developer","Senior Software Engineer","Engineering Manager"],
    salary: "$75,000 – $120,000",
    techSuggestions: ["Git (advanced workflows)","Docker","REST API design","SQL fundamentals","Cloud basics (AWS/GCP/Azure)","CI/CD pipelines","Unit testing","Code review practices","Design patterns","Agile/Scrum"],
  };
}

function analyzeResumeLocally(
  resumeText: string,
  parsed: ParsedResume,
  jobDescription?: string,
): AIAnalysisResult {
  const text = resumeText;
  const textLower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  let score = 0;
  const strongSections: string[] = [];
  const weakSections: string[] = [];
  const improvementSuggestions: string[] = [];

  // ── Contact info (15 pts) ──────────────────────────────────────────────────
  if (parsed.name) score += 5; else weakSections.push("Name not clearly detected — place it at the very top in a large font");
  if (parsed.email) score += 5; else { weakSections.push("Email address"); improvementSuggestions.push("Add a professional email address prominently in the header."); }
  if (parsed.phone) score += 5; else { weakSections.push("Phone number"); improvementSuggestions.push("Add a phone number to your contact section."); }

  // ── Resume length (15 pts) ────────────────────────────────────────────────
  if (wordCount >= 400 && wordCount <= 900) {
    score += 15;
  } else if (wordCount >= 200) {
    score += 10;
  } else if (wordCount >= 80) {
    score += 5;
    improvementSuggestions.push(`Your resume is short (${wordCount} words). Expand experience, skills, and project descriptions.`);
  } else {
    improvementSuggestions.push(`Your resume has very little content (${wordCount} words). ATS scanners need more text to score your resume accurately.`);
  }

  // ── Summary / Objective (8 pts) ───────────────────────────────────────────
  const hasSummary = /\b(summary|objective|profile|about me|professional background|career overview)\b/i.test(text);
  if (hasSummary) {
    score += 8;
    strongSections.push("Professional Summary");
  } else {
    weakSections.push("Professional Summary (missing)");
    improvementSuggestions.push("Add a 3–4 sentence professional summary at the top tailored to your target role.");
  }

  // ── Skills (15 pts) ───────────────────────────────────────────────────────
  if (parsed.skills.length >= 10) {
    score += 15;
    strongSections.push("Technical Skills");
  } else if (parsed.skills.length >= 5) {
    score += 10;
    strongSections.push("Technical Skills");
    improvementSuggestions.push("Expand your skills section — aim for 10–15 specific technologies and tools.");
  } else if (parsed.skills.length >= 1) {
    score += 5;
    weakSections.push("Technical Skills (underdeveloped)");
    improvementSuggestions.push("Your skills section is thin. List all languages, frameworks, tools, and platforms you know.");
  } else {
    weakSections.push("Technical Skills (missing)");
    improvementSuggestions.push("Add a dedicated Skills section listing your technical and domain-specific competencies.");
  }

  // ── Experience (18 pts) ───────────────────────────────────────────────────
  if (parsed.experience.length >= 5) {
    score += 18;
    strongSections.push("Work Experience");
  } else if (parsed.experience.length >= 3) {
    score += 14;
    strongSections.push("Work Experience");
  } else if (parsed.experience.length >= 1) {
    score += 8;
    weakSections.push("Work Experience (thin)");
    improvementSuggestions.push("Expand each work experience entry with 3–5 bullet points per role describing your impact.");
  } else {
    weakSections.push("Work Experience (not detected)");
    improvementSuggestions.push("Include a Work Experience section with company name, title, dates, and achievement-focused bullets.");
  }

  // ── Education (10 pts) ───────────────────────────────────────────────────
  if (parsed.education.length >= 1) {
    score += 10;
    strongSections.push("Education");
  } else {
    weakSections.push("Education");
    improvementSuggestions.push("Add an Education section with degree, institution, and graduation year.");
  }

  // ── Projects (5 pts) ─────────────────────────────────────────────────────
  if (parsed.projects.length >= 1) {
    score += 5;
    strongSections.push("Projects");
  } else {
    weakSections.push("Projects (none listed)");
    improvementSuggestions.push("Add 2–3 relevant projects with a short description, your role, and tech stack used.");
  }

  // ── Certifications (5 pts) ────────────────────────────────────────────────
  if (parsed.certifications.length >= 1) {
    score += 5;
    strongSections.push("Certifications");
  }

  // ── Action verbs (5 pts) ─────────────────────────────────────────────────
  const foundVerbs = ACTION_VERBS.filter((v) => textLower.includes(v));
  if (foundVerbs.length >= 6) score += 5;
  else if (foundVerbs.length >= 3) score += 3;
  else {
    improvementSuggestions.push("Use strong action verbs (e.g. 'Architected', 'Delivered', 'Optimized') to start each bullet point.");
  }

  // ── Quantifiable achievements (5 pts) ────────────────────────────────────
  const hasMetrics = /\b\d+\s*(%|percent|x\b|users|customers|ms\b|seconds|hours|days|million|k\b|\+)|\$[\d,]+/i.test(text);
  if (hasMetrics) {
    score += 5;
  } else {
    weakSections.push("Quantifiable Achievements");
    improvementSuggestions.push("Add numbers and metrics to your bullets (e.g. 'Reduced load time by 40%', 'Served 50k users').");
  }

  // ── Job description keyword match (up to 10 pts) ─────────────────────────
  let jdMatchedKeywords: string[] = [];
  let jdMissingKeywords: string[] = [];
  if (jobDescription) {
    const jdWords = (jobDescription.match(/\b[a-zA-Z][a-zA-Z0-9.+#-]{2,}\b/g) || [])
      .map((w) => w.toLowerCase())
      .filter((w) => !STOP_WORDS.has(w));
    const jdUnique = [...new Set(jdWords)];
    jdMatchedKeywords = jdUnique.filter((kw) => textLower.includes(kw));
    jdMissingKeywords = jdUnique
      .filter((kw) => !textLower.includes(kw))
      .slice(0, 12);
    const matchRatio = jdUnique.length > 0 ? jdMatchedKeywords.length / jdUnique.length : 0;
    score += Math.round(matchRatio * 10);
    if (matchRatio < 0.3 && jobDescription.length > 50) {
      improvementSuggestions.push("Your resume matches fewer than 30% of keywords from the job description. Mirror its language more closely.");
    }
  }

  score = Math.min(100, Math.max(1, score));

  // ── Derive job family & suggestions ──────────────────────────────────────
  const jobFamily = detectJobFamily(parsed.skills, text);

  // Missing keywords: JD-specific first, then generic tech gaps
  const resumeTechLower = new Set(
    ALL_TECH_KEYWORDS.filter((kw) => textLower.includes(kw.toLowerCase())).map((k) => k.toLowerCase()),
  );
  const genericMissing = ALL_TECH_KEYWORDS
    .filter((kw) => !resumeTechLower.has(kw.toLowerCase()))
    .slice(0, 8);

  const missingKeywords =
    jdMissingKeywords.length > 0
      ? [...new Set([...jdMissingKeywords.slice(0, 6), ...genericMissing.slice(0, 6)])]
      : genericMissing;

  // Verbs to suggest
  const weakVerbs = ["worked","did","helped","made","got","used","was responsible for","assisted"];
  const foundWeakVerbs = weakVerbs.filter((v) => textLower.includes(v));
  const actionVerbSuggestions = foundWeakVerbs.length > 0
    ? [
        ...foundWeakVerbs.map((v) => `Replace "${v}" with a stronger verb like "${ACTION_VERBS[Math.floor(Math.random() * ACTION_VERBS.length)]}"`),
        "Start every bullet point with a past-tense action verb",
        "Use varied verbs to demonstrate breadth of contribution",
      ]
    : [
        "Ensure every bullet starts with an action verb",
        "Use 'Architected' instead of 'Built' for design-heavy work",
        "Use 'Delivered' or 'Shipped' to emphasize results",
        "Use 'Mentored' to highlight leadership",
        "Use 'Reduced' or 'Optimized' to show efficiency gains",
      ];

  // Professional summary
  const name = parsed.name || "The candidate";
  const topSkills = parsed.skills.slice(0, 3).join(", ") || jobFamily.family;
  const professionalSummary = parsed.skills.length > 0
    ? `${name} is a motivated ${jobFamily.family} professional with hands-on experience in ${topSkills}. ` +
      `They have demonstrated ability to ${foundVerbs.slice(0, 2).join(" and ") || "build and deliver"} impactful solutions. ` +
      `Their profile shows strengths in ${strongSections.slice(0, 2).join(" and ") || "technical depth"}, ` +
      `with opportunities to strengthen ${weakSections[0]?.replace(" (missing)", "").replace(" (thin)", "") || "quantifiable achievements"}.`
    : `Based on the extracted content, this candidate is pursuing roles in ${jobFamily.family}. ` +
      `To strengthen this profile, add a professional summary, expand skills, and quantify experience with measurable results. ` +
      `A well-structured resume with clear sections will significantly improve ATS compatibility.`;

  const softSkillSuggestions = SOFT_SKILLS_POOL.filter(
    (s) => !textLower.includes(s.toLowerCase()),
  ).slice(0, 5);

  const interviewQuestions = [
    `Tell me about a project where you used ${parsed.skills[0] || jobFamily.techSuggestions[0]}. What was the outcome?`,
    "Describe a time you had to debug a critical issue under time pressure. How did you handle it?",
    "How do you approach learning a new technology or framework quickly?",
    "Give an example of a technical decision you made that had a measurable impact.",
    "How do you handle disagreements with teammates about technical approaches?",
    `What is your experience with ${parsed.skills[1] || jobFamily.techSuggestions[1] || "system design"}?`,
    "Describe the largest codebase or system you've worked on. How did you manage complexity?",
    "How do you ensure code quality in a fast-paced environment?",
    "Where do you see yourself in 3 years, and how does this role fit that path?",
    "Tell me about a time you improved the performance or reliability of a system.",
  ];

  const formattingSuggestions = [
    "Use consistent date formatting (e.g. 'Jan 2022 – Mar 2024') throughout.",
    "Keep margins at 0.5–1 inch; use a single readable font (Calibri, Garamond, or Arial) at 10–12pt.",
    "Use bullet points, not paragraphs, for experience entries — each bullet on one line.",
    "Stick to a single-column layout for maximum ATS compatibility; avoid tables and text boxes.",
    wordCount > 900
      ? "Your resume may be too long — trim to 1 page for under 10 years of experience."
      : "Ensure all content fits neatly on 1–2 pages with no orphaned lines.",
  ];

  const keywordOptimizationTips = [
    jobDescription
      ? "Mirror exact phrases from the job description — ATS matches literal strings, not synonyms."
      : "Research 3–5 target job descriptions and identify recurring keywords to add.",
    "Include your skills both in a dedicated Skills section and naturally within bullet points.",
    "Spell out acronyms once, then use the abbreviation: e.g. 'Continuous Integration (CI/CD)'.",
    "Avoid using images, headers, or footers for key contact info — ATS often can't read them.",
    "Use industry-standard section headings: 'Work Experience', 'Education', 'Skills'.",
  ];

  const grammarSuggestions = [
    "Use consistent past tense for previous roles and present tense for your current role.",
    "Remove personal pronouns (I, my, we) — resume bullets should be implied first-person.",
    "Check for consistent capitalization of job titles, company names, and technologies.",
    "Avoid ending bullet points with periods for a cleaner, scannable look.",
    "Spell-check all company names and technology names (e.g. 'JavaScript' not 'Javascript').",
  ];

  const careerSuggestions = [
    `Target ${jobFamily.roles[0]} or ${jobFamily.roles[1]} roles — your profile is a strong fit.`,
    `Consider earning a certification in ${jobFamily.techSuggestions[0]} to stand out.`,
    "Build a GitHub portfolio with 3–5 polished repos showcasing your best work.",
    "Contribute to open source projects in your stack to demonstrate initiative.",
    `Network in ${jobFamily.family} communities (meetups, Discord, LinkedIn groups) to find referrals.`,
  ];

  return {
    atsScore: score,
    analysisSource: "local",
    missingKeywords: missingKeywords.slice(0, 12),
    strongSections,
    weakSections,
    professionalSummary,
    technicalSkillSuggestions: jobFamily.techSuggestions,
    softSkillSuggestions,
    jobRoles: jobFamily.roles,
    interviewQuestions,
    improvementSuggestions: improvementSuggestions.slice(0, 10),
    salaryEstimate: jobFamily.salary,
    careerSuggestions,
    grammarSuggestions,
    actionVerbSuggestions,
    keywordOptimizationTips,
    formattingSuggestions,
  };
}

// ─── OpenAI-powered analysis ──────────────────────────────────────────────────

export async function analyzeResumeWithAI(
  resumeText: string,
  jobDescription?: string,
  parsedData?: ParsedResume,
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
  "atsScore": <integer 0-100, realistic ATS compatibility score based on resume quality — do NOT default to 50>,
  "missingKeywords": [<5-12 important missing keywords/skills for this candidate's apparent target role>],
  "strongSections": [<resume sections that are well-written and complete>],
  "weakSections": [<sections missing or needing significant improvement>],
  "professionalSummary": "<improved 3-4 sentence professional summary written for this specific person>",
  "technicalSkillSuggestions": [<6-10 technical skills relevant to their field that they should add/learn>],
  "softSkillSuggestions": [<4-6 soft skills to emphasize>],
  "jobRoles": [<5-8 specific job titles this resume is a strong match for>],
  "interviewQuestions": [<8-10 likely interview questions tailored to THIS resume's content>],
  "improvementSuggestions": [<5-10 specific, actionable improvements with concrete examples>],
  "salaryEstimate": "<realistic market salary range for this candidate's location and experience, e.g. '$85,000 – $120,000'>",
  "careerSuggestions": [<3-5 strategic career path suggestions specific to this person>],
  "grammarSuggestions": [<3-5 grammar, tense, or phrasing improvements>],
  "actionVerbSuggestions": [<5-8 stronger action verbs to replace weak ones found in this resume>],
  "keywordOptimizationTips": [<3-5 keyword optimization tips specific to this resume>],
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
    parsed.atsScore = Math.min(100, Math.max(0, Math.round(parsed.atsScore)));
    parsed.analysisSource = "ai";
    return parsed;
  } catch (err: unknown) {
    const error = err as { status?: number; code?: string; message?: string };
    const isQuotaError =
      error?.status === 429 ||
      error?.code === "insufficient_quota" ||
      error?.code === "rate_limit_exceeded";
    const isAuthError = error?.status === 401 || error?.code === "invalid_api_key";

    if (isQuotaError) {
      logger.warn("OpenAI quota exceeded — using local rule-based analysis");
    } else if (isAuthError) {
      logger.warn("OpenAI auth failed — using local rule-based analysis");
    } else {
      logger.error({ err }, "OpenAI resume analysis failed — using local rule-based analysis");
    }

    // Fall through to local analysis with full parsed data
    if (parsedData) {
      return analyzeResumeLocally(resumeText, parsedData, jobDescription);
    }

    // Minimal fallback if we have no parsed structure (shouldn't happen)
    return analyzeResumeLocally(resumeText, {
      text: resumeText,
      skills: [],
      education: [],
      experience: [],
      projects: [],
      certifications: [],
    }, jobDescription);
  }
}
