# System Requirements Specification: CareerPilot AI

> **Standard:** IEEE 830-compliant Software Requirements Specification (SRS)  
> **Target Project:** CareerPilot AI  
> **Version:** 1.0.0  
> **Status:** Approved for Implementation Planning  
> **Author:** Senior Software Architect & Technical Planning Agent  

---

## 1. Functional Requirements (FR)

### 1.1 Authentication & User Management (FR-AUTH)

- **FR-AUTH-1 (User Registration):** The system shall allow a new user to create an account by providing a valid name, unique email address, and strong password (minimum 8 characters with at least one number and one uppercase letter). Passwords must be hashed using bcrypt (cost factor >= 12) or Argon2id before storage.
- **FR-AUTH-2 (Secure Login & Session):** The system shall authenticate registered users using their email and password, issuing an `httpOnly`, `Secure`, `SameSite=Lax` cookie containing a signed JWT access token, accompanied by a cryptographically random refresh token persisted in PostgreSQL.
- **FR-AUTH-3 (Session Invalidation & Logout):** The system shall allow authenticated users to terminate their session, revoking the refresh token in PostgreSQL and clearing authentication cookies from the client.
- **FR-AUTH-4 (User Profile Management):** The system shall permit authenticated users to retrieve and update their profile details (name, target job title, career level, and current skills).
- **FR-AUTH-5 (Resource Ownership & Authorization):** The system shall strictly restrict read, update, and delete operations on resumes, job descriptions, analyses, roadmaps, and tasks to the authenticated owner of the resource.

### 1.2 Resume Management (FR-RES)

- **FR-RES-1 (Resume Creation):** The system shall allow an authenticated user to create and store multiple resumes with a title, target role, and text content (minimum 100 characters, maximum 20,000 characters).
- **FR-RES-2 (Resume Retrieval & Versioning):** The system shall allow users to list all their saved resumes with creation timestamps, retrieve a specific resume by ID, and designate a "primary" resume.
- **FR-RES-3 (Resume Updating & Deletion):** The system shall allow users to update the title or content of an existing resume, or delete a resume (with cascading removal or archival of associated transient records).

### 1.3 Job Description Management (FR-JOB)

- **FR-JOB-1 (Job Description Ingestion):** The system shall allow users to save target job descriptions specifying job title, company name, experience level (entry, mid, senior), and raw job posting text.
- **FR-JOB-2 (Job Description Catalog):** The system shall allow users to view, search, and manage previously saved job descriptions for reuse across multiple analyses.

### 1.4 Resume–Job Matching & Skill Gap Analysis (FR-MATCH) — Core AI Workflow

- **FR-MATCH-1 (Analysis Initiation):** The system shall allow users to execute a match analysis between an existing resume (or freshly submitted resume text) and a job description.
- **FR-MATCH-2 (Hybrid Extraction & Alignment):** The backend shall combine deterministic canonical skill matching with Gemini LLM semantic qualification extraction to identify:
  1. **Matched Skills:** Skills present in both resume and job description.
  2. **Missing Required Skills:** Mandatory hard skills required by the job but absent from the resume.
  3. **Missing Preferred Skills:** Bonus or nice-to-have skills absent from the resume.
  4. **Experience Alignment:** Assessment of candidate seniority against job requirements.
- **FR-MATCH-3 (Structured Scoring):** The system shall calculate an overall match score (0–100) along with sub-scores: Technical Skill Alignment, Experience Fit, and ATS Readability.
- **FR-MATCH-4 (Actionable Recommendations):** The analysis shall provide prioritized, concrete recommendations, including specific bullet points rewrites and high-impact keywords to integrate.
- **FR-MATCH-5 (Relational Persistence):** The complete analysis, scores, and categorized skill linkages (`AnalysisSkill`) shall be persisted in PostgreSQL linked via foreign keys to the `Resume` and `JobDescription`.
- **FR-MATCH-6 (Historical Review):** The system shall allow users to review past analyses, observe score changes, and compare different iterations.

### 1.5 Career Roadmap & Milestone Management (FR-ROADMAP)

- **FR-ROADMAP-1 (Roadmap Generation):** The system shall allow users to generate a customized learning roadmap based on identified skill gaps, target role, and target timeframe (e.g., 3 months, 6 months).
- **FR-ROADMAP-2 (Phased Task Hierarchy):** Roadmaps shall be broken into sequential phases (e.g., Foundations, Intermediate Projects, Advanced Topics/Portfolio), each containing specific, actionable tasks.
- **FR-ROADMAP-3 (Task State Persistence):** Users shall be able to toggle the completion state (`isCompleted: boolean`) of individual roadmap tasks. The system shall dynamically compute and display completion percentage.

---

## 2. Non-Functional Requirements (NFR)

### 2.1 Security & Data Privacy (NFR-SEC)
- **NFR-SEC-1 (Token Protection):** No authentication tokens or sensitive credentials shall ever be stored in `localStorage` or `sessionStorage`. All authentication state shall reside in encrypted or signed `httpOnly` cookies.
- **NFR-SEC-2 (CSRF & CORS Defense):** The backend API shall enforce strict CORS restricting requests to the authorized frontend origin with `credentials: true`. State-changing endpoints shall be guarded against CSRF attacks.
- **NFR-SEC-3 (Zero Frontend API Key Exposure):** Third-party AI credentials (`GEMINI_API_KEY`) must never be leaked to or accessible by client-side code. All AI calls must originate from backend services.
- **NFR-SEC-4 (Input Sanitization & Injection Defense):** All incoming HTTP payloads must pass strict Zod validation schemas. Resume text and job descriptions must be sanitized prior to prompt construction to mitigate prompt injection.
- **NFR-SEC-5 (PII Redaction in Logs):** Server logging (e.g., Morgan / Winston) must redact passwords, auth tokens, emails, and resume bodies from standard application logs.

### 2.2 Performance & Scalability (NFR-PERF)
- **NFR-PERF-1 (API Latency):** Core CRUD database queries executed via Prisma shall resolve in under 50ms at P95 under standard load.
- **NFR-PERF-2 (AI Latency & Timeout):** AI analysis calls to Gemini shall complete within 6 seconds at P95. The backend must enforce a strict 15-second client timeout with graceful abort handling.
- **NFR-PERF-3 (Database Indexing):** All foreign keys (`userId`, `resumeId`, `jobDescriptionId`, `analysisId`, `roadmapId`) and unique query columns (`email`, `tokenHash`) shall be indexed in PostgreSQL.

### 2.3 Reliability & Fault Tolerance (NFR-REL)
- **NFR-REL-1 (Structured AI Validation):** The backend shall enforce structured JSON responses from Gemini via SDK configuration (`responseSchema`). Responses that fail Zod schema parsing shall trigger an automatic single retry before surfacing a clean error.
- **NFR-REL-2 (Graceful Degradation):** In the event of total AI service downtime or quota exhaustion (`HTTP 429`), the backend must return a distinct `503 Service Unavailable` with a user-friendly error envelope rather than returning fake mock data as legitimate analysis.

### 2.4 Maintainability & Testability (NFR-MAINT)
- **NFR-MAINT-1 (Automated Testing Suite):** The codebase must support an automated test runner (Vitest or Jest) capable of executing unit and integration tests against an isolated PostgreSQL test database.
- **NFR-MAINT-2 (Strict TypeScript Compliance):** Both frontend and backend packages must compile with strict TypeScript mode (`"strict": true`, no implicit `any`).

---

## 3. User Stories & Acceptance Criteria

### User Story 1: Comprehensive Resume–Job Gap Analysis
> **As an** ambitious job seeker,  
> **I want to** compare my resume against a specific target job posting,  
> **So that I can** identify missing technical skills and tailor my resume to pass hiring screenings.

```gherkin
Scenario: Successful resume and job description gap analysis
  Given the user is authenticated with a valid session
  And the user has saved a resume with valid technical experience
  When the user submits a POST request to "/api/v1/analyses" with the resume ID and target job description text
  Then the Gemini AI engine parses both documents against the structured output schema
  And the system calculates a match score and categorizes matched vs missing skills
  And the complete analysis is persisted in the PostgreSQL database
  And the API returns HTTP status 201 Created with the full analysis payload
  And the frontend displays the match score, missing skills list, and bullet point improvement advice

Scenario: Attempting to analyze another user's resume
  Given User A is authenticated
  And Resume R belongs to User B
  When User A attempts to initiate an analysis using Resume R's ID
  Then the backend authorization middleware intercepts the request
  And the API returns HTTP status 403 Forbidden with message "You do not have access to this resume"
  And no AI query or database write occurs
```

### User Story 2: Actionable Career Roadmap Task Completion
> **As a** junior developer working to bridge my skill gaps,  
> **I want to** generate a step-by-step career roadmap and check off tasks as I complete them,  
> **So that I can** track my tangible progress toward qualifying for my target role.

```gherkin
Scenario: Generating a roadmap and completing a milestone task
  Given an authenticated user with identified skill gaps
  When the user requests a 6-month roadmap for the role of "Backend Engineer"
  Then the backend generates a 3-phase roadmap with actionable milestone tasks
  And the roadmap and all associated tasks are stored in PostgreSQL
  And when the user clicks the checkbox for "Build a REST API with PostgreSQL and Prisma"
  Then the frontend sends a PATCH request to "/api/v1/roadmaps/tasks/{id}" with "{ isCompleted: true }"
  And the database updates the task status
  And the API returns HTTP status 200 OK
  And the overall roadmap progress percentage increments accordingly
```

---

## 4. Assessment 100-Mark Rubric Mapping Matrix

| Rubric Dimension | Marks | System Implementation in CareerPilot AI | Traceable Artifact |
| :--- | :---: | :--- | :--- |
| **Problem Solving & Planning** | **10** | Solves real ATS/screening gap; explicit user personas; clear MVP scope boundaries. | `PROJECT_PLAN.md` |
| **Frontend & User Experience** | **15** | Responsive Next.js App Router UI with dedicated Loading, Empty, Success, and Error states. | `REQUIREMENTS.md #6` |
| **Backend, APIs & Business Logic** | **20** | Layered Express REST API (`/api/v1`), multi-factor match scoring calculation, and status progression workflows. | `ARCHITECTURE.md`, `API_SPECIFICATION.md` |
| **Database & Data Handling** | **15** | PostgreSQL with Prisma ORM; normalized models (`User`, `Resume`, `JobDescription`, `ResumeAnalysis`, `Skill`, `AnalysisSkill`); foreign keys & compound indexes. | `DATABASE_DESIGN.md` |
| **Security & Validation** | **10** | HttpOnly signed cookie sessions; refresh token rotation; Zod input schemas; cross-user authorization filters. | `ARCHITECTURE.md`, `API_SPECIFICATION.md` |
| **AI / ML Feature & Explanation** | **10** | Gemini 2.5 Flash server-side integration; structured JSON schema enforcement; hybrid deterministic + semantic matching; empirical evaluation plan. | `AI_FEATURE.md` |
| **Code Quality, Testing & Git** | **10** | Strict TypeScript; atomic conventional commits; Vitest unit tests for scoring algorithms; Supertest API integration tests. | `IMPLEMENTATION_PLAN.md` |
| **Live Review & Technical Defense**| **10** | Structured live demo walkthrough, architecture defense playbook, and readiness for live code changes & debugging tasks. | `README.md #5` |

---

## 5. Explicit Business Logic & Calculation Specifications

To satisfy the **Backend, APIs & Business Logic (20 Marks)** requirement for a meaningful calculation and status-based workflow:

### 5.1 Business Calculation: Multi-Factor Hybrid Qualification Score
The backend matching engine executes an automated, multi-factor scoring calculation rather than a random or opaque number:
1. **Hard Skill Alignment Ratio ($\text{SkillScore}$):**
   $$\text{SkillScore} = \min\left(100, \frac{|\text{Matched Canonical Skills}|}{|\text{Total Required Skills in Job Posting}|} \times 100\right)$$
2. **Experience & Seniority Fit ($\text{ExperienceScore}$):** Model-evaluated seniority depth index based on verified achievements vs. job requirements (0–100).
3. **Completeness & ATS Formatting Factor ($\text{CompletenessScore}$):** Section completeness and quantified metric presence index (0–100).
4. **Composite Overall Alignment Score:**
   $$\text{Overall Score} = (0.55 \times \text{SkillScore}) + (0.35 \times \text{ExperienceScore}) + (0.10 \times \text{CompletenessScore})$$

### 5.2 Status-Based Workflow: Phased Roadmap Task Progression
1. **Dynamic Task State:** Each task in `RoadmapTask` possesses an `isCompleted` boolean state.
2. **Aggregated Progress Calculation:**
   $$\text{Roadmap Progress \%} = \left(\frac{\sum \text{Completed Tasks}}{\text{Total Phased Tasks}}\right) \times 100$$
3. **State Transition Rule:** When a user checks off the final remaining task in a Phase, the phase state automatically transitions from `IN_PROGRESS` to `COMPLETED`, unlocking celebratory feedback and updating the overall profile readiness index.

---

## 6. Frontend User Experience & State Management Specifications

To satisfy the **Frontend & User Experience (15 Marks)** requirement for responsive interfaces with clear states:

| UI View / Workflow | Loading State | Empty State | Success State | Error State |
| :--- | :--- | :--- | :--- | :--- |
| **Resume Manager** | Skeleton card loaders mimicking resume metadata blocks. | *"No resumes created yet. Click 'Add Resume' to create or paste your first resume."* | Toast alert: *"Resume saved successfully"* + updated resume list. | Inline field-level red error text (Zod validation) or toast on network failure. |
| **Match Analysis Trigger** | Animated progress spinner with contextual text: *"Analyzing resume against job requirements..."* | Prompting user to paste or select a resume and target job posting. | Interactive radial Score Dial + categorized color-coded skill badges + recommendations accordion. | Clear 503/429 error banner with a *"Retry Analysis"* action button. |
| **Roadmap & Tasks** | Shimmering timeline skeleton. | *"No active roadmaps. Run a match analysis to generate a targeted roadmap."* | Real-time progress bar fill + task strike-through with smooth checkmark animation. | Toast alert: *"Failed to update task status. Reverting change."* (Optimistic rollback). |

---

## 7. Scope Prioritization (MoSCoW Method)

| Priority | Features / Capabilities |
| :--- | :--- |
| **Must Have (MVP)** | 1. User registration, login, logout, and profile management (httpOnly cookies).<br>2. Resume creation, editing, and retrieval (text content).<br>3. Job description saving and management.<br>4. Server-side Gemini AI Resume–Job Matching and Skill Gap Analysis.<br>5. PostgreSQL persistence for users, resumes, jobs, analyses, and skills.<br>6. Relational ownership checks on every private endpoint.<br>7. Automated test suite for auth, validation, and matching logic. |
| **Should Have (Phase 2)** | 1. Career Roadmap generation and persistent task completion tracking.<br>2. ATS keyword optimization suggestions.<br>3. Dashboard summary metrics (real calculated data from DB, no hardcoded charts). |
| **Could Have (Phase 3)** | 1. AI Cover Letter generation based on matched resume and job description.<br>2. Direct PDF resume upload and server-side text extraction (`pdf-parse`).<br>3. Export analysis report to PDF or Markdown. |
| **Won't Have (Excluded)** | 1. Course marketplace / generic item e-commerce.<br>2. Insecure unverified OAuth endpoints.<br>3. Unpersisted mock AI responses.<br>4. Client-side API key usage. |
