# System Requirements: CareerPilot AI

This document lists the functional and non-functional requirements that the application is built against, plus the main user stories.

---

## 1. Functional Requirements (FR)

### 1.1 Authentication & User Management (FR-AUTH)

- **FR-AUTH-1 (Registration):** A new user can create an account with a valid name, unique email address, and strong password (minimum 8 characters, with upper, lower, and numeric characters). Passwords are hashed with bcrypt (cost factor 12) before storage.
- **FR-AUTH-2 (Login & session):** Registered users authenticate with email and password. The server issues an `httpOnly`, `Secure`, `SameSite=Lax` cookie containing a signed JWT access token, plus a cryptographically random refresh token persisted in PostgreSQL.
- **FR-AUTH-3 (Logout):** Authenticated users can end their session, which revokes the refresh token in PostgreSQL and clears the auth cookies.
- **FR-AUTH-4 (Profile management):** Authenticated users can retrieve and update their profile details (name, target job title, career level).
- **FR-AUTH-5 (Ownership & authorization):** Read, update, and delete operations on resumes, job descriptions, analyses, roadmaps, and tasks are restricted to the authenticated owner of the resource.

### 1.2 Resume Management (FR-RES)

- **FR-RES-1 (Creation):** An authenticated user can create multiple resumes with a title, target role, and text content (minimum 100 characters, maximum 20,000 characters).
- **FR-RES-2 (Retrieval):** Users can list their saved resumes with timestamps, retrieve a specific resume by ID, and designate a primary resume.
- **FR-RES-3 (Update & delete):** Users can update the title, target role, or content of an existing resume, or delete a resume.

### 1.3 Job Description Management (FR-JOB)

- **FR-JOB-1 (Ingestion):** Users can save target job descriptions with job title, company name, experience level (entry, junior, mid, senior, lead), and raw posting text.
- **FR-JOB-2 (Catalog):** Users can view and manage previously saved job descriptions for reuse across analyses.

### 1.4 Resume-Job Matching & Skill Gap Analysis (FR-MATCH)

- **FR-MATCH-1 (Initiation):** Users can run a match analysis between an existing resume (or freshly submitted resume text) and a job description.
- **FR-MATCH-2 (Hybrid extraction & alignment):** The backend combines deterministic canonical skill matching with Gemini semantic extraction to identify:
  1. **Matched skills:** present in both resume and job description.
  2. **Missing required skills:** mandatory hard skills required by the job but absent from the resume.
  3. **Missing preferred skills:** bonus or nice-to-have skills absent from the resume.
  4. **Experience alignment:** an assessment of candidate seniority against job requirements.
- **FR-MATCH-3 (Structured scoring):** The system calculates an overall match score (0-100) along with sub-scores for technical skill alignment, experience fit, and resume completeness.
- **FR-MATCH-4 (Recommendations):** Each analysis provides prioritized, concrete recommendations, including bullet-point rewrites and high-impact keywords to integrate.
- **FR-MATCH-5 (Relational persistence):** The complete analysis, scores, and categorized skill links (`AnalysisSkill`) are persisted in PostgreSQL and linked by foreign keys to the resume and job description.
- **FR-MATCH-6 (History):** Users can review past analyses and compare different iterations.

### 1.5 Career Roadmap & Milestone Management (FR-ROADMAP)

- **FR-ROADMAP-1 (Generation):** Users can generate a customized learning roadmap for a target role and timeframe (3, 6, or 12 months), based on the skill gaps found in an existing analysis.
- **FR-ROADMAP-2 (Phased tasks):** Roadmaps are broken into sequential phases (foundations, intermediate projects, advanced/portfolio), each containing specific, actionable tasks.
- **FR-ROADMAP-3 (Task state):** Users can toggle the completion state (`isCompleted`) of individual tasks. The system computes and returns the completion percentage.

---

## 2. Non-Functional Requirements (NFR)

### 2.1 Security & Privacy (NFR-SEC)

- **NFR-SEC-1 (Token protection):** No authentication tokens are stored in `localStorage` or `sessionStorage`. All auth state lives in signed `httpOnly` cookies.
- **NFR-SEC-2 (CORS & CSRF):** The API restricts CORS to the configured frontend origin with `credentials: true`. Session cookies use `SameSite=Lax`, which limits cross-site request forgery along with the origin restriction.
- **NFR-SEC-3 (No frontend key exposure):** `GEMINI_API_KEY` is never exposed to client code. All AI calls originate from the backend.
- **NFR-SEC-4 (Input validation):** All incoming HTTP payloads pass strict Zod validation. User text is treated as untrusted data and delimited in prompts to reduce prompt-injection risk.
- **NFR-SEC-5 (Log redaction):** The logger redacts sensitive fields before writing, including passwords, tokens, cookies, authorization headers, secrets, API keys, and user email addresses.

### 2.2 Performance & Scalability (NFR-PERF)

- **NFR-PERF-1 (API latency):** Core CRUD queries via Prisma resolve in well under 100ms at P95 under normal load.
- **NFR-PERF-2 (AI latency):** AI analysis calls to Gemini complete within a few seconds at P95, with retry and fallback handling on failure.
- **NFR-PERF-3 (Indexing):** Foreign keys (`userId`, `resumeId`, `jobDescriptionId`, `analysisId`, `roadmapId`) and unique query columns (`email`, `tokenHash`) are indexed in PostgreSQL.

### 2.3 Reliability (NFR-REL)

- **NFR-REL-1 (AI response validation):** The backend enforces structured JSON from Gemini via `responseSchema`. Responses that fail Zod parsing trigger automatic retries before surfacing an error.
- **NFR-REL-2 (Graceful degradation):** On total AI unavailability or quota exhaustion, the backend returns `503 Service Unavailable` with a clean error envelope. It never returns fake data as a real analysis.

### 2.4 Maintainability (NFR-MAINT)

- **NFR-MAINT-1 (Automated tests):** The codebase supports Vitest for unit and integration tests against an isolated PostgreSQL test schema.
- **NFR-MAINT-2 (Strict TypeScript):** Frontend and backend compile with strict TypeScript (`"strict": true`, no implicit `any`).

---

## 3. User Stories

### User Story 1: Resume-Job gap analysis

> **As a** job seeker,
> **I want to** compare my resume against a specific target posting,
> **so that** I can identify missing technical skills and tailor my resume.

```gherkin
Scenario: Successful resume and job description gap analysis
  Given the user is authenticated with a valid session
  And the user has saved a resume with valid technical experience
  When the user submits a POST request to "/api/v1/analyses" with the resume ID and target job description text
  Then the matching engine analyzes both documents
  And the system calculates a match score and categorizes matched vs missing skills
  And the complete analysis is persisted in PostgreSQL
  And the API returns HTTP 201 Created with the analysis payload
  And the frontend displays the score, missing skills, and bullet-point advice

Scenario: Analyzing another user's resume
  Given User A is authenticated
  And Resume R belongs to User B
  When User A attempts to start an analysis using Resume R's ID
  Then the backend rejects the request because the resume does not belong to User A
  And the API returns HTTP 404 Not Found
  And no AI query or database write occurs
```

### User Story 2: Roadmap task completion

> **As a** junior developer working to close my skill gaps,
> **I want to** generate a step-by-step roadmap and check off tasks as I finish them,
> **so that** I can track progress toward my target role.

```gherkin
Scenario: Generating a roadmap and completing a milestone task
  Given an authenticated user with a completed analysis that has identified skill gaps
  When the user requests a 6-month roadmap for the role of "Backend Engineer" using that analysis
  Then the backend generates a phased roadmap with actionable tasks
  And the roadmap and all associated tasks are stored in PostgreSQL
  And when the user checks the box for "Build a REST API with PostgreSQL and Prisma"
  Then the frontend sends a PATCH request to "/api/v1/roadmaps/tasks/{taskId}" with "{ isCompleted: true }"
  And the database updates the task status
  And the API returns HTTP 200 OK
  And the overall roadmap completion percentage increments
```

---

## 4. Business Logic & Calculations

### 4.1 Hybrid qualification score

The matching engine computes scores rather than returning an arbitrary number:

1. **Hard skill alignment (`skillScore`):** the ratio of matched required skills to total required skills, capped at 100.
   `skillScore = min(100, matchedRequired / totalRequired * 100)`
2. **Experience fit (`experienceScore`):** a model-evaluated seniority index (0-100) comparing the candidate's demonstrated experience against job expectations.
3. **Resume completeness (`completenessScore`):** a deterministic 0-100 index based on the presence of key resume sections (contact, summary, experience, projects, education, skills) and quantified metrics.
4. **Overall score:** a weighted combination of the three.
   `overallScore = 0.55 * skillScore + 0.35 * experienceScore + 0.10 * completenessScore`

The weights live in `SCORE_WEIGHTS` in `backend/src/services/matching.reconciliation.ts`.

### 4.2 Roadmap progress

- Each `RoadmapTask` has an `isCompleted` flag.
- Roadmap progress = `completedTasks / totalTasks * 100`, recomputed and stored whenever a task is toggled.

---

## 5. Frontend UX States

Each main view handles loading, empty, success, and error states.

| View | Loading | Empty | Success | Error |
| :--- | :--- | :--- | :--- | :--- |
| **Resume manager** | Skeleton card loaders. | "No resumes created yet. Add your first resume." | Toast confirming the save plus an updated list. | Inline field errors (Zod) or a toast on network failure. |
| **Analysis trigger** | Loading state with contextual text. | Prompt to select or paste a resume and job posting. | Score gauge plus color-coded skill badges and recommendations. | Clear error banner with a retry action. |
| **Roadmap & tasks** | Timeline skeleton. | "No active roadmap. Run a gap analysis to generate one." | Progress bar fill plus task completion toggle. | Toast on failed task update, with the change reverted. |

---

## 6. Scope Prioritization (MoSCoW)

| Priority | Features |
| :--- | :--- |
| **Must have (MVP)** | Registration, login, logout, and profile management (HttpOnly cookies); resume CRUD (text); job description management; server-side Gemini matching and gap analysis; PostgreSQL persistence for users, resumes, jobs, analyses, skills, and roadmaps; relational ownership checks on every private endpoint; automated tests for auth, validation, and matching logic. |
| **Should have** | Career roadmap generation and persistent task tracking; dashboard summary metrics calculated from real data. |
| **Could have** | AI cover letter generation; direct PDF upload and server-side text extraction; export of an analysis report to PDF or Markdown. |
| **Won't have** | Course marketplace or generic e-commerce; insecure unverified OAuth endpoints; unpersisted mock AI responses; client-side API key usage. |
