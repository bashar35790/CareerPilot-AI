# CareerPilot AI

An AI-powered career development and job-alignment platform.
Score your resume against real job postings, uncover missing skills, get actionable
bullet-point rewrites, and generate a phased learning roadmap that closes the gaps.

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Express, PostgreSQL, Prisma ORM, Google Gemini (`gemini-2.5-flash`)

---

## 1. Overview

Early-career developers rarely learn why an application was rejected. CareerPilot AI makes that transparent:

1. **Ingest a resume** and **a target job posting**.
2. Run a **hybrid Resume-Job gap analysis** (deterministic taxonomy matching plus Gemini semantic reasoning).
3. Review an explainable **match score**, color-coded **skill badges** (matched / missing required / missing preferred), and **rewrites** of weak bullet points.
4. Generate a **phased career roadmap** from the identified gaps and track task completion with live progress.

The flagship feature is the **Resume-Job Matching & Skill Gap Engine**. See [docs/AI_FEATURE.md](docs/AI_FEATURE.md) for inputs, outputs, limitations, and the benchmark results.

---

## 2. Tech Stack

| Layer | Technology |
| :--- | :--- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Recharts, Motion |
| Backend | Node.js, Express 4, TypeScript, Zod |
| Database & ORM | PostgreSQL 16, Prisma ORM |
| Auth | HttpOnly / SameSite cookies, JWT access tokens + refresh-token rotation (bcrypt, SHA-256 token hashing) |
| AI | Google Gemini `gemini-2.5-flash` (fallback `gemini-3-flash-preview`), enforced JSON schema |
| Testing | Vitest, Supertest, isolated PostgreSQL test schema |
| Container | Docker / Docker Compose |

---

## 3. Features

- **Authentication** - register, login, one-click demo login, silent token refresh, logout, protected routes.
- **Resume management** - full CRUD with character validation (100-20,000 chars) and a primary resume concept.
- **Job posting ingestion** - store target postings with experience-level classification.
- **Gap analysis** - hybrid scoring (Skills 55% / Experience 35% / Completeness 10%), skill-gap badges, AI summary, Google-XYZ bullet rewrites, paginated report history.
- **Career roadmaps** - AI-generated phased plans with toggleable tasks and live progress recalculation.
- **Dashboard** - quick access to resumes, jobs, and analysis.

---

## 4. Getting Started (Local)

### 4.1 Prerequisites
- **Node.js v20+** and npm
- **Docker** (recommended, for PostgreSQL) **or** a local PostgreSQL 16 instance
- A **Google Gemini API key** (optional for browsing; required to run live analyses/roadmaps)

### 4.2 Clone
```bash
git clone <your-repository-url>
cd CareerPilot-AI
```

### 4.3 Start PostgreSQL
```bash
docker compose up -d postgres
```
This starts Postgres on `localhost:5432` with database `careerpilot_db` (user `careerpilot_user` / password `careerpilot_password`), matching `backend/.env.example`.

### 4.4 Backend
```bash
cd backend
cp .env.example .env          # then edit values (see §5)
npm install
npx prisma migrate deploy     # apply migrations (use `prisma migrate dev` while developing)
npm run db:seed               # seed canonical skills + demo user + sample resume/job
npm run dev                   # http://localhost:5000
```

### 4.5 Frontend
```bash
cd ../frontend
cp .env.example .env          # NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
npm install
npm run dev                   # http://localhost:3000
```

Open **http://localhost:3000** and click **"Try the demo"** (or use the credentials in §6).

> **Alternative:** run the whole stack in Docker with `docker compose up --build`.

---

## 5. Environment Variables

### Backend (`backend/.env`) - see [`backend/.env.example`](backend/.env.example)
```env
PORT=5000
NODE_ENV=development

# PostgreSQL connection
DATABASE_URL=postgresql://careerpilot_user:careerpilot_password@localhost:5432/careerpilot_db?schema=public

# Integration-test database (isolated schema; migrations applied by the test runner)
TEST_DATABASE_URL=postgresql://careerpilot_user:careerpilot_password@localhost:5432/careerpilot_db?schema=careerpilot_test

# Auth secrets (>= 16 chars; change in production)
JWT_SECRET=super_secret_jwt_access_key_change_in_production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=super_secret_jwt_refresh_key_change_in_production
JWT_REFRESH_EXPIRES_IN=7d

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key_here

# CORS origin
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env`) - see [`frontend/.env.example`](frontend/.env.example)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

---

## 6. Demo Credentials

| Field | Value |
| :--- | :--- |
| Email | `demo@careerpilot.internal` |
| Password | `DemoPassword123!` |

The **"Try the demo"** button performs a one-click login through `POST /api/v1/auth/demo` and auto-provisions the reviewer account. Running `npm run db:seed` also pre-loads a sample resume and job posting for the demo user.

---

## 7. AI Feature - Resume-Job Matching Engine

**Inputs:** resume text (100-20,000 chars), job description text, and the canonical skill taxonomy (73 technologies).
**Outputs:** `overallScore`, `skillScore`, `experienceScore` (0-100), categorized skill badges (`MATCHED`, `MISSING_REQUIRED`, `MISSING_PREFERRED`), an AI summary, and prioritized bullet-point rewrites.
**Approach:** a **deterministic exact-match layer** over a canonical taxonomy (grounds hard skills) combined with **Gemini semantic reasoning** (seniority, nuance, recommendations), reconciled before persistence.
**Known limitations:** LLM scores can vary slightly between runs (mitigated by schema validation, `temperature 0.2`, and deterministic grounding); image-only PDFs must be text-extracted before ingestion; soft skills cannot be verified without explicit textual evidence.

**Benchmark results** (10 annotated pairs, `npm run eval:matching`):

| Metric | Target | Measured |
| :--- | :---: | :---: |
| Skill extraction precision | >= 90% | **100.0%** |
| Skill extraction recall | >= 85% | **100.0%** |
| Missing-skill accuracy | >= 90% | **100.0%** |
| Deterministic latency / pair | < 4.5 s | ~0.6 ms |

Full specification: [docs/AI_FEATURE.md](docs/AI_FEATURE.md).

---

## 8. Testing & Evaluation

Run from `backend/` (requires a reachable PostgreSQL; the test schema is migrated automatically):

```bash
npm test              # Vitest unit + Supertest integration suites
npm run typecheck     # tsc --noEmit
npm run lint          # ESLint
npm run eval:matching # AI deterministic-matching evaluation harness (no DB required)
```

Frontend:
```bash
cd frontend
npm run typecheck
npm run lint
```

The suites cover authentication and token rotation, cross-tenant ownership isolation, resume/job/analysis CRUD, the end-to-end journey (register -> resume -> job -> analysis -> roadmap), security checks, log redaction, the matching algorithm, Gemini wrapper retries/fallback, and roadmap progress.

---

## 9. API Overview

Base path: `/api/v1` (all non-auth routes require an authenticated cookie session).

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/health` | Service health probe |
| POST | `/auth/register`, `/auth/login`, `/auth/demo`, `/auth/refresh`, `/auth/logout` | Authentication lifecycle |
| GET | `/auth/me` | Current session user |
| GET/POST | `/resumes`; `/resumes/:id` (GET/PUT/DELETE) | Resume CRUD |
| GET/POST | `/jobs`; `/jobs/:id` (GET/DELETE) | Job posting CRUD |
| GET/PUT | `/users/profile` | Profile + dashboard statistics |
| GET/POST | `/analyses`; `/analyses/:id` (GET/DELETE) | Run / list / fetch gap analyses |
| GET/POST | `/roadmaps`; `/roadmaps/:id` (GET) | Generate / list / fetch roadmaps |
| PATCH | `/roadmaps/tasks/:taskId` | Toggle task completion and recompute progress |

Full contract: [docs/API_SPECIFICATION.md](docs/API_SPECIFICATION.md).

---

## 10. Project Structure

```
CareerPilot-AI/
├── backend/
│   ├── prisma/            # schema.prisma, migrations, seed.ts
│   ├── src/
│   │   ├── config/        # environment validation
│   │   ├── controllers/   # HTTP layer
│   │   ├── middleware/    # auth, validation, error handling
│   │   ├── routes/        # /api/v1 route mounts
│   │   ├── schemas/       # Zod validation schemas
│   │   ├── services/      # business logic (matching, analysis, roadmap, auth...)
│   │   └── lib/           # prisma, gemini, tokens, password, logger, errors
│   └── tests/             # unit, integration, evaluation harness
├── frontend/
│   └── src/
│       ├── app/           # App Router pages (home, auth, dashboard, resumes, jobs, analysis, roadmaps)
│       ├── components/    # ui primitives, layout, home, analysis charts
│       ├── schemas/       # client-side validation
│       ├── proxy.ts       # route protection (Next.js proxy)
│       └── lib/ · store/  # API client, auth context
├── docs/                  # planning & design documentation
└── docker-compose.yml
```

---

## 11. Documentation Index

| Document | Contents |
| :--- | :--- |
| [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) | Problem statement, personas, MVP scope, non-goals |
| [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) | Functional / non-functional requirements & user stories |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System topology, layered backend, cookie auth, transactions |
| [docs/DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md) | Relational model, Prisma schema, constraints, indexes, seeding |
| [docs/API_SPECIFICATION.md](docs/API_SPECIFICATION.md) | REST contract, Zod schemas, error codes, test cases |
| [docs/AI_FEATURE.md](docs/AI_FEATURE.md) | Hybrid matching engine, scoring formula, evaluation results |
| [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) | Phased execution checklist & Git conventions |

---

## 12. Live Demonstration & Technical Review Playbook

### 12.1 Main user flow (3-5 minutes)
1. **Demo login** -> authenticated dashboard.
2. **Resume** - show the seeded resume or create one (validation 100-20,000 chars).
3. **Job posting** - ingest a real posting.
4. **Run analysis** - show the loading state, then the overall score, sub-scores, skill badges, and rewrites.
5. **Roadmap** - check off a task and show the live progress update.

### 12.2 Architecture defense
- **Database:** PostgreSQL over NoSQL for ACID guarantees, foreign keys enforcing multi-tenant isolation, and normalized `Skill` / `AnalysisSkill` join tables for cross-analysis aggregation.
- **Auth:** HttpOnly signed cookies with refresh-token rotation over `localStorage` JWTs (immune to XSS token theft; server-side revocability).
- **AI:** hybrid architecture - deterministic taxonomy matching for hard-skill precision plus Gemini for semantic reasoning and structured JSON output.

### 12.3 Likely live changes
- **Scoring weights** -> edit `SCORE_WEIGHTS` in [`backend/src/services/matching.reconciliation.ts`](backend/src/services/matching.reconciliation.ts) and rerun `npm test` (`tests/unit/matching.reconciliation.test.ts`).
- **New validation rule** -> edit the relevant Zod schema in `backend/src/schemas/` (e.g. `resume.schema.ts`) and observe the `400` response.
- **Roadmap endpoint change** -> extend `backend/src/controllers/roadmap.controller.ts` and its Prisma query.
- **Debugging** -> inspect `errorHandler.ts` logs and verify ownership filters (`userId: req.user.id`).

---

## 13. Known Limitations

- Image-based PDFs must be converted to plain text; no OCR/DOCX parsing in the MVP.
- Analysis scores are a **heuristic alignment index**, not a hiring guarantee.
- LLM responses are non-deterministic; the deterministic layer grounds hard-skill scoring.
- No live public deployment is included by default; the project runs locally via Docker Compose.

---

## 14. Author

**Abul Bashar** - Full-Stack Developer Assessment (NT Tech Innovation), October 2026.
