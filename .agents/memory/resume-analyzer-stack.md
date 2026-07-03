---
name: AI Resume Analyzer stack decisions
description: Key architecture and gotchas for the resume analyzer app built in this project.
---

## Stack
- Frontend: `artifacts/resume-analyzer` — React + Vite, Tailwind, Framer Motion, Recharts, wouter routing
- Backend: `artifacts/api-server` — Express 5, TypeScript, esbuild, pino logging
- DB: MongoDB + Mongoose (user chose this over built-in Drizzle/PostgreSQL)
- Auth: JWT (jsonwebtoken) + bcryptjs, `requireAuth` middleware attaches `req.userId`
- File parsing: pdf-parse 2.x (ESM — use `(await import('pdf-parse')).default ?? module`), mammoth
- AI: OpenAI GPT-4o-mini with `response_format: { type: 'json_object' }`

## Upload endpoint
`POST /api/resumes/upload` is multipart/form-data with multer. It was intentionally excluded from the OpenAPI spec (caused TS collisions). Frontend calls it via native `fetch` with `FormData` directly — token from `localStorage.getItem('token')`.

## Auth pattern
`setAuthTokenGetter(() => localStorage.getItem('token'))` called in `main.tsx`. AuthContext stores `user` + `token` in localStorage under keys `'user'` and `'token'`.

## MongoDB Atlas + Replit
Atlas requires IP whitelist → user must add `0.0.0.0/0` in Atlas Network Access for Replit's dynamic IPs to connect.

**Why:** Replit container IPs are dynamic and not predictable.

## pdf-parse ESM import fix
`pdf-parse` v2.x is ESM and doesn't expose `.default` via TS types. Use:
```ts
const pdfParseModule = (await import("pdf-parse")) as any;
const pdfParse = pdfParseModule.default ?? pdfParseModule;
```

## Mongoose 8+ async pre hook
Don't call `next()` in async pre hooks — just `return`:
```ts
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});
```

## File lifecycle
Uploaded files are deleted from disk immediately after text is stored in MongoDB (both on success and on failure) to avoid PII retention. Account deletion also cleans up all resume files.
