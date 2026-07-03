---
name: AI Resume Analyzer stack
description: Key decisions and gotchas for the MERN-stack AI Resume Analyzer app.
---

## Stack
- MongoDB + Mongoose backend, React + Vite frontend (MERN)
- File upload via native `fetch` + `FormData` to `POST /api/resumes/upload` (no generated OpenAPI hook — upload endpoint excluded from spec to avoid TS name collisions)

## pdf-parse fix (v1.x)
- Use `createRequire(import.meta.url)("pdf-parse/lib/pdf-parse.js")` — NOT a dynamic `import()` and NOT the package root index.
- **Why:** `pdf-parse` v1 `index.js` runs a self-test at load time that looks for `./test/data/05-versions-space.pdf` (crashes in prod). esbuild's dynamic `import()` interop wraps CJS in a module object so `.default` or direct call both fail. `createRequire` gives the raw CJS function synchronously.
- **How to apply:** Keep the static `createRequire` call at module top-level in `resume-parser.ts`.

## Upload security: magic-byte validation
- MIME type and file extension are user-controlled — always validate actual file content.
- PDF magic: `25 50 44 46` (`%PDF`); DOCX/ZIP magic: `50 4B 03 04` (`PK\x03\x04`).
- Use magic-byte-detected type as authoritative MIME passed to parser, ignoring user-supplied header.
- Error codes: 400 for bad client input (invalid file), 502 for parser/AI service failures.

## Frontend FormLabel gotcha
- `<FormLabel>` from shadcn/ui calls `useFormField` hook internally — it MUST be inside a `<FormField>` render prop.
- Read-only display fields (e.g. email shown as disabled Input) must use a plain `<label>` tag, not `<FormLabel>`.

## GitHub push
- Remote: `https://github.com/lokeshgoodboy123-prog/AI-Resume-Analyzer.git`
- Push via: `git push https://lokeshgoodboy123-prog:${GITHUB_PAT}@github.com/...` (Replit `gitPush()` callback doesn't pick up OAuth even when connected in UI — use CLI + PAT secret `GITHUB_PAT`).
