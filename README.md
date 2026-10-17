# CareerPilot AI - Technical Planning Documentation Package

> **Platform:** CareerPilot AI  
> **Role:** Full-Stack AI-Powered Career Development & Job Alignment Platform  
> **Target Stack:** Next.js, Express.js, TypeScript, PostgreSQL, Prisma ORM, Google Gemini API  
> **Package Status:** Complete Technical Blueprint (Assessment Planning Phase)  
> **Author:** Senior Software Architect, Product Analyst & Database Designer  
> **Date:** October 2026  

---

## 1. Assessment Rubric Mapping (100 Marks Breakdown)

This documentation package has been architected to achieve maximum scoring across all 8 evaluation pillars defined in the Full-Stack Developer Assessment:

| Evaluation Pillar | Marks | Implementation & Architectural Evidence in CareerPilot AI | Reference Document |
| :--- | :---: | :--- | :--- |
| **Problem Solving & Planning** | **10** | Comprehensive domain analysis, clear user personas (Alex, Priya), explicit MVP scope boundaries, non-goals, and edge-case planning. | [PROJECT_PLAN.md](file:///d:/AI%20Projects/NT-Assessment/CareerPilot-AI/docs/PROJECT_PLAN.md) |
| **Frontend & User Experience** | **15** | Next.js App Router, Tailwind CSS design system, responsive layouts, explicit loading skeletons, empty states, optimistic UI updates, and error toast boundaries. | [REQUIREMENTS.md](file:///d:/AI%20Projects/NT-Assessment/CareerPilot-AI/docs/REQUIREMENTS.md) |
| **Backend, APIs & Business Logic** | **20** | Modular Express REST API (`/api/v1`), layered service architecture, multi-factor scoring calculation formula, and status progression lifecycle. | [ARCHITECTURE.md](file:///d:/AI%20Projects/NT-Assessment/CareerPilot-AI/docs/ARCHITECTURE.md), [API_SPECIFICATION.md](file:///d:/AI%20Projects/NT-Assessment/CareerPilot-AI/docs/API_SPECIFICATION.md) |
| **Database & Data Handling** | **15** | Normalized PostgreSQL relational model, Prisma ORM, UUIDs, foreign key referential integrity, indexes, and atomic `$transaction` blocks. | [DATABASE_DESIGN.md](file:///d:/AI%20Projects/NT-Assessment/CareerPilot-AI/docs/DATABASE_DESIGN.md) |
| **Security & Validation** | **10** | HttpOnly signed cookie authentication, refresh token rotation, strict Zod validation schemas, CSRF/CORS defenses, and multi-tenant resource ownership. | [ARCHITECTURE.md](file:///d:/AI%20Projects/NT-Assessment/CareerPilot-AI/docs/ARCHITECTURE.md), [API_SPECIFICATION.md](file:///d:/AI%20Projects/NT-Assessment/CareerPilot-AI/docs/API_SPECIFICATION.md) |
| **AI / ML Feature & Explanation** | **10** | Server-side Gemini 2.5 Flash integration, hybrid deterministic + LLM matching, structured JSON schema enforcement, cost/latency controls, and empirical evaluation dataset. | [AI_FEATURE.md](file:///d:/AI%20Projects/NT-Assessment/CareerPilot-AI/docs/AI_FEATURE.md) |
| **Code Quality, Testing & Git** | **10** | Strict TypeScript throughout, atomic conventional Git commit milestones, Vitest unit testing for matching algorithms, and Supertest API integration tests. | [IMPLEMENTATION_PLAN.md](file:///d:/AI%20Projects/NT-Assessment/CareerPilot-AI/docs/IMPLEMENTATION_PLAN.md) |
| **Live Demonstration & Review** | **10** | Structured walkthrough script, live demonstration cheat sheet, database query explanations, and defense preparation for live code changes & debugging. | [README.md #5](file:///d:/AI%20Projects/NT-Assessment/CareerPilot-AI/docs/README.md#5-live-demonstration--technical-review-playbook) |
| **TOTAL** | **100** | **Complete Full-Stack Engineering Blueprint** | All Documentation Files |

---

## 2. Documentation Index & Sitemap

```
CareerPilot-AI/docs/
├── README.md                      # Navigation index, rubric mapping, and live review defense guide
├── PROJECT_PLAN.md                # Problem statement, personas, MVP boundaries, non-goals, user journeys
├── REQUIREMENTS.md                # Functional, non-functional, security specs & Gherkin user stories
├── ARCHITECTURE.md                # System topology, modular Express structure, Mermaid diagrams, transactions
├── DATABASE_DESIGN.md             # Normalized PostgreSQL models, Prisma schema design, constraints, indexes
├── API_SPECIFICATION.md           # REST conventions (/api/v1), Zod schemas, responses, error codes, test cases
├── AI_FEATURE.md                  # Flagship AI matching engine, hybrid scoring formula, evaluation rubric
└── IMPLEMENTATION_PLAN.md         # Phased execution checklist, dependencies, DoD, Git commit guidelines
```

---

## 3. Technology Stack Summary

| Layer | Selected Technology | Architectural Capabilities & Assessment Rationale |
| :--- | :--- | :--- |
| **Frontend** | **Next.js (App Router), React, TypeScript, Tailwind CSS** | Server-side rendering capability, strict typing, responsive design, zero client-side AI key exposure. |
| **Backend** | **Node.js, Express.js, TypeScript** | Layered modular architecture (Routes $\rightarrow$ Middlewares $\rightarrow$ Controllers $\rightarrow$ Services $\rightarrow$ Data Access Layer). |
| **Database & ORM** | **PostgreSQL + Prisma ORM** | ACID compliance, foreign keys, unique & check constraints, relational integrity, migrations, and connection pooling. |
| **Authentication** | **HttpOnly, Secure, SameSite=Lax Cookies + JWT with Refresh Token Rotation** | Complete protection against XSS token exfiltration; instant revocation via database refresh token tracking. |
| **AI Integration** | **Google Gemini API (`gemini-2.5-flash`)** | Server-side execution only; enforced JSON schema (`responseSchema`); fallback retries; structured Zod validation before DB persistence. |
| **Testing** | **Vitest / Jest + Supertest + Prisma Test DB** | Automated unit testing for matching algorithms and integration testing for all HTTP endpoints. |
| **Deployment** | **Vercel (Frontend), Render/Railway (Backend), Neon/Supabase (PostgreSQL)** | High availability, scalable connection pooling, isolated managed environments. |

---

## 4. Document Guide & Recommended Reading Sequence

1. [PROJECT_PLAN.md](file:///d:/AI%20Projects/NT-Assessment/CareerPilot-AI/docs/PROJECT_PLAN.md) — Product vision, target personas, problem statement, value proposition, and non-goals.
2. [REQUIREMENTS.md](file:///d:/AI%20Projects/NT-Assessment/CareerPilot-AI/docs/REQUIREMENTS.md) — Formal functional requirements (FR), non-functional requirements (NFR), and user stories.
3. [ARCHITECTURE.md](file:///d:/AI%20Projects/NT-Assessment/CareerPilot-AI/docs/ARCHITECTURE.md) — Decoupled multi-tier topology, modular Express backend, cookie auth, and transactions.
4. [DATABASE_DESIGN.md](file:///d:/AI%20Projects/NT-Assessment/CareerPilot-AI/docs/DATABASE_DESIGN.md) — Relational PostgreSQL schema, normalized skill taxonomy, UUIDs, foreign keys, and indexes.
5. [API_SPECIFICATION.md](file:///d:/AI%20Projects/NT-Assessment/CareerPilot-AI/docs/API_SPECIFICATION.md) — REST interface contract, base path `/api/v1`, Zod validation schemas, and test cases.
6. [AI_FEATURE.md](file:///d:/AI%20Projects/NT-Assessment/CareerPilot-AI/docs/AI_FEATURE.md) — Flagship Resume–Job Matching engine, hybrid scoring formula, structured schema, and evaluation plan.
7. [IMPLEMENTATION_PLAN.md](file:///d:/AI%20Projects/NT-Assessment/CareerPilot-AI/docs/IMPLEMENTATION_PLAN.md) — Phased development sequence, task checklists, Definition of Done, and Git commit conventions.

---

## 5. Live Demonstration & Technical Review Playbook

The assessment includes a **10-mark Live Demonstration & Technical Review**. Use this structured playbook to ace the live review:

### 5.1 Main User Flow Demonstration (3 to 5 minutes)
1. **One-Click Demo Login:** Log in via `POST /api/v1/auth/demo` to immediately demonstrate an authenticated dashboard without manual typing.
2. **Resume Management:** Show an existing stored resume or create a new one, highlighting validation limits (100–20,000 characters).
3. **Target Job Posting Ingestion:** Input a real-world Job Posting (e.g., Junior Full-Stack Developer).
4. **Trigger Gap Analysis:** Click "Analyze Match". Show the loading skeleton.
5. **Interactive Results:**
   - Walk through the **Overall Score (0–100)** and sub-scores (Technical Skill Alignment vs. Experience Depth).
   - Show color-coded skill badges: **Green** (Matched), **Red** (Missing Required), **Yellow** (Missing Preferred/Bonus).
   - Highlight actionable bullet-point rewrites based on the Google XYZ formula.
6. **Career Roadmap & Task Progress:** Transition to the generated roadmap, check off a task, and demonstrate the dynamic progress percentage update.

### 5.2 Technical Architecture Explanation
* **Explain the Database:** Explain why PostgreSQL was chosen over NoSQL: relational ACID guarantees, foreign keys to enforce multi-tenant isolation, and normalized `Skill` / `AnalysisSkill` join entities for cross-analysis aggregation.
* **Explain Authentication:** Explain why `httpOnly` cookies with refresh token rotation were chosen over `localStorage` JWTs (immunity to XSS token theft).
* **Explain the AI Integration:** Highlight the **Hybrid Matching Architecture**—deterministic regex matching on canonical skills for 100% precision combined with Gemini 2.5 Flash for semantic qualification reasoning and structured JSON output.

### 5.3 Preparation for Live Code Changes & Debugging Tasks
Assessors often ask for a quick live modification during technical reviews. Here is how CareerPilot AI's modular architecture makes these trivial:
* **Scenario A: "Change the scoring weight of Technical Skills from 55% to 60%"**
  $\rightarrow$ Open `src/services/matching.service.ts`, adjust the scoring constants, and rerun `npm test tests/unit/matching.test.ts`.
* **Scenario B: "Add a new validation rule to reject job descriptions with fewer than 50 characters"**
  $\rightarrow$ Open `src/schemas/job.schema.ts`, update `z.string().min(50)`, and show the automatic `400 Bad Request` response.
* **Scenario C: "Add an endpoint to filter roadmaps by completed status"**
  $\rightarrow$ Add `isCompleted?: boolean` to `roadmaps.controller.ts`, pass filter into Prisma `findMany({ where: { isCompleted } })`.
* **Scenario D: "Live Debugging Scenario"**
  $\rightarrow$ Check `errorHandler.ts` logging output; trace through `req.user.id` injection to verify ownership filters.
