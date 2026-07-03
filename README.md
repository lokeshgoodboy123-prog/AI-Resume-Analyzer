# AI Resume Analyzer

A full-stack AI-powered resume analysis platform built with React, Express, MongoDB, and OpenAI. Upload your resume and get an ATS score, skill gap analysis, job role recommendations, interview questions, and a detailed improvement roadmap — all powered by GPT-4o-mini.

## Features

- **Resume Upload** — Drag & drop PDF or DOCX support
- **ATS Scoring** — 0-100 compatibility score with explanation
- **AI Analysis** — Skills extraction, missing keywords, career suggestions
- **Dashboard** — History, stats charts, delete past analyses
- **JWT Auth** — Secure register/login/profile management
- **Dark/Light Mode** — Full theme support
- **Download Report** — Print-friendly analysis report

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Tailwind CSS, Framer Motion, Recharts |
| Backend | Node.js, Express 5, TypeScript |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| AI | OpenAI GPT-4o-mini |
| File Parsing | pdf-parse (PDF), mammoth (DOCX) |

## Setup

### 1. Environment Variables

Copy `.env.example` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `MONGODB_URI` — MongoDB connection string (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/resume-analyzer`)
- `OPENAI_API_KEY` — Your OpenAI API key from https://platform.openai.com
- `JWT_SECRET` — A long random string for signing JWT tokens

### 2. MongoDB Setup

You can use:
- **MongoDB Atlas** (recommended for Replit): https://www.mongodb.com/atlas/database — free tier available
- **Local MongoDB**: Install MongoDB Community and use `mongodb://localhost:27017/resume-analyzer`

### 3. Running Locally

```bash
# Install dependencies
pnpm install

# Start the API server
pnpm --filter @workspace/api-server run dev

# Start the frontend (in another terminal)
pnpm --filter @workspace/resume-analyzer run dev
```

### 4. Replit Deployment

1. Set secrets in the Replit Secrets panel:
   - `MONGODB_URI`
   - `OPENAI_API_KEY`
   - `JWT_SECRET`

2. Click **Publish** in the Replit editor

## API Reference

| Method | Endpoint | Description |
|--------|---------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/profile` | Get user profile |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/password` | Change password |
| DELETE | `/api/auth/account` | Delete account |
| POST | `/api/resumes/upload` | Upload + analyze resume |
| GET | `/api/resumes` | Resume history |
| GET | `/api/resumes/:id` | Get analysis |
| DELETE | `/api/resumes/:id` | Delete analysis |
| GET | `/api/dashboard/stats` | Dashboard statistics |

## File Size Limits

- Maximum upload size: **10 MB**
- Supported formats: **PDF**, **DOCX**

## Security

- Passwords hashed with bcryptjs (12 rounds)
- JWT tokens expire after 7 days
- Auth token required for all resume/dashboard endpoints
- Input validation on all endpoints via Zod
