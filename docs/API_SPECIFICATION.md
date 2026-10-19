# REST API Specification: CareerPilot AI

**Base path:** `/api/v1`
**Data format:** JSON (`application/json`)
**Authentication:** signed `httpOnly` cookie (`access_token`)

---

## 1. Conventions

### 1.1 Response envelope

Every response uses the same envelope.

**Success (200, 201):**
```json
{
  "success": true,
  "data": {
    "id": "c3e98b4b-326e-4c12-a7d1-9257e8fa10b9",
    "name": "Jane Developer"
  },
  "meta": {
    "timestamp": "2026-10-17T21:30:00.000Z"
  }
}
```

**Error (4xx, 5xx):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      { "field": "email", "issue": "Invalid email address format" }
    ]
  },
  "meta": {
    "timestamp": "2026-10-17T21:30:00.000Z"
  }
}
```

### 1.2 Status codes

| Status | Meaning |
| :--- | :--- |
| `200 OK` | Successful query or update. |
| `201 Created` | Resource created (resume, job, analysis, roadmap). |
| `400 Bad Request` | Malformed JSON or Zod validation failure. |
| `401 Unauthorized` | Missing, expired, or invalid authentication cookie. |
| `403 Forbidden` | Authenticated but not permitted to access the resource. |
| `404 Not Found` | Resource does not exist or does not belong to the user. |
| `409 Conflict` | Unique constraint violation (e.g. email already registered). |
| `500 Internal Server Error` | Unexpected fault; internal details redacted. |
| `503 Service Unavailable` | Upstream AI engine failure or quota exhaustion. |

---

## 2. Endpoint Catalogue

```
/api/v1/
├── auth/
│   ├── POST   /register             # Register a new account
│   ├── POST   /login                # Authenticate and receive session cookies
│   ├── POST   /demo                 # One-click demo login
│   ├── POST   /refresh              # Rotate refresh token and refresh access token
│   ├── POST   /logout               # Clear cookies and revoke refresh token
│   └── GET    /me                   # Current session user
├── users/
│   ├── GET    /profile              # Profile and summary stats
│   └── PUT    /profile              # Update profile details
├── resumes/
│   ├── POST   /                     # Create a resume
│   ├── GET    /                     # List the user's resumes
│   ├── GET    /:id                  # Fetch a resume by ID
│   ├── PUT    /:id                  # Update a resume
│   └── DELETE /:id                  # Delete a resume
├── jobs/
│   ├── POST   /                     # Save a job description
│   ├── GET    /                     # List saved job descriptions
│   ├── GET    /:id                  # Fetch a job description by ID
│   └── DELETE /:id                  # Delete a job description
├── analyses/
│   ├── POST   /                     # Run a resume-job gap analysis
│   ├── GET    /                     # List analysis history (paginated)
│   ├── GET    /:id                  # Fetch a full analysis breakdown
│   └── DELETE /:id                  # Delete an analysis
└── roadmaps/
    ├── POST   /                     # Generate a roadmap from an analysis
    ├── GET    /                     # List the user's roadmaps
    ├── GET    /:id                  # Fetch a roadmap with phased tasks
    └── PATCH  /tasks/:taskId        # Toggle a task's completion status
```

---

## 3. Endpoint Details

### 3.1 Authentication

#### `POST /api/v1/auth/register`
- **Auth:** public.
- **Validation (Zod):**
  ```typescript
  z.object({
    fullName: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8).max(100).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    targetRole: z.string().trim().min(2).max(100).optional(),
  })
  ```
- **Success (201):** sets `access_token` and `refresh_token` cookies and returns the user.
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "email": "jane@example.com",
        "fullName": "Jane Developer",
        "role": "USER",
        "targetRole": "Junior Full-Stack Developer",
        "careerLevel": "ENTRY",
        "createdAt": "2026-10-17T21:30:00.000Z"
      }
    },
    "meta": { "timestamp": "2026-10-17T21:30:00.000Z" }
  }
  ```
- **Errors:** `400` (validation), `409` ("Email already registered").

#### `POST /api/v1/auth/login`
- **Auth:** public.
- **Body:** `{ "email": "...", "password": "..." }`.
- **Success (200):** sets cookies and returns the user.
- **Errors:** `401` ("Invalid email or password").

#### `POST /api/v1/auth/demo`
- **Auth:** public.
- **Behavior:** finds or provisions `demo@careerpilot.internal`, issues session cookies, and returns the demo user.

#### `POST /api/v1/auth/refresh`
- **Auth:** public (reads the `refresh_token` cookie).
- **Behavior:** validates the stored refresh token, revokes it, issues a new token pair, and sets cookies.

#### `POST /api/v1/auth/logout`
- **Auth:** public (reads the `refresh_token` cookie if present).
- **Behavior:** revokes the refresh token and clears cookies. Returns `{ "data": { "message": "Successfully logged out" } }`.

#### `GET /api/v1/auth/me`
- **Auth:** required.
- **Success (200):** returns the current user.

### 3.2 Resumes

#### `POST /api/v1/resumes`
- **Auth:** required.
- **Validation (Zod):**
  ```typescript
  z.object({
    title: z.string().trim().min(3).max(150),
    targetRole: z.string().trim().min(2).max(100).optional(),
    content: z.string().min(100).max(20000),
    isPrimary: z.boolean().optional(),
  })
  ```
- **Success (201):** returns the created resume. If `isPrimary: true`, other resumes are unset in the same transaction.
- **Errors:** `400` (validation).

#### `GET /api/v1/resumes`
- **Auth:** required.
- **Behavior:** returns list summaries (id, title, targetRole, isPrimary, timestamps), ordered by `isPrimary` then `createdAt`. The large `content` field is omitted.

#### `GET /api/v1/resumes/:id`, `PUT /api/v1/resumes/:id`, `DELETE /api/v1/resumes/:id`
- **Auth:** required; ownership enforced (`userId = req.user.id`).
- **Errors:** `404` if the resume does not exist or belongs to another user.

### 3.3 Job descriptions

#### `POST /api/v1/jobs`
- **Auth:** required.
- **Validation (Zod):**
  ```typescript
  z.object({
    title: z.string().trim().min(2).max(150),
    company: z.string().trim().min(2).max(150),
    experienceLevel: z.enum(['ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD']).optional(),
    rawText: z.string().min(100).max(20000),
  })
  ```

#### `GET /api/v1/jobs`, `GET /api/v1/jobs/:id`, `DELETE /api/v1/jobs/:id`
- **Auth:** required; ownership enforced.

### 3.4 Gap analysis

#### `POST /api/v1/analyses`
- **Auth:** required.
- **Validation (Zod):**
  ```typescript
  z.object({
    resumeId: z.string().uuid().optional(),
    resumeContent: z.string().min(100).max(20000).optional(),
    jobTitle: z.string().trim().min(2).max(150),
    company: z.string().trim().min(2).max(150),
    jobDescriptionText: z.string().min(100).max(20000),
    experienceLevel: z.enum(['ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD']).optional(),
  }).refine((data) => data.resumeId || data.resumeContent, {
    message: 'Either resumeId or resumeContent must be provided',
  })
  ```
- **Request example:**
  ```json
  {
    "resumeId": "e4f5a6b7-c8d9-0123-ef45-6789abcdef01",
    "jobTitle": "Junior Backend Developer",
    "company": "FinTech Innovators Inc.",
    "experienceLevel": "JUNIOR",
    "jobDescriptionText": "Looking for a Junior Backend Developer proficient in Node.js, Express, PostgreSQL, Prisma, and REST APIs. Experience with Docker and Redis is a plus."
  }
  ```
- **Success (201):**
  ```json
  {
    "success": true,
    "data": {
      "id": "f7a8b9c0-1234-5678-90ab-cdef12345678",
      "resumeId": "e4f5a6b7-c8d9-0123-ef45-6789abcdef01",
      "jobDescriptionId": "d2c1b0a9-...",
      "overallScore": 78,
      "skillScore": 82,
      "experienceScore": 70,
      "summary": "Strong alignment with core backend technologies (Node.js, Express, PostgreSQL). Gaps identified in containerization (Docker) and caching mechanisms.",
      "matchedSkills": [
        { "name": "Node.js", "category": "FRAMEWORK", "relevance": "HIGH" },
        { "name": "PostgreSQL", "category": "DATABASE", "relevance": "HIGH" }
      ],
      "missingRequiredSkills": [
        { "name": "Prisma", "category": "TOOL", "relevance": "HIGH", "contextualNote": "Required for the ORM data layer." }
      ],
      "missingPreferredSkills": [
        { "name": "Docker", "category": "DEVOPS", "relevance": "MEDIUM", "contextualNote": "Bonus qualification in posting." }
      ],
      "recommendations": [
        {
          "category": "SKILL_INTEGRATION",
          "priority": "HIGH",
          "improved": "Highlight Prisma ORM experience in the projects section to address the explicit requirement.",
          "rationale": "The posting lists Prisma as a mandatory data-layer requirement."
        },
        {
          "category": "BULLET_POINT_REWRITE",
          "priority": "HIGH",
          "original": "Built backend APIs for a web application using Express and a SQL database.",
          "improved": "Architected resilient REST API endpoints using Express and PostgreSQL, handling relational transactions and reducing query latency by 25%.",
          "rationale": "Incorporates exact job keywords and quantifies engineering impact."
        }
      ],
      "modelVersion": "hybrid-v1:gemini-2.5-flash",
      "createdAt": "2026-10-17T21:30:00.000Z"
    },
    "meta": { "timestamp": "2026-10-17T21:30:00.000Z" }
  }
  ```
- **Behavior:**
  1. Verify resume ownership (or use inline `resumeContent`).
  2. Run deterministic exact matching against the canonical skill catalog.
  3. Call Gemini with the structured JSON schema.
  4. Validate the AI response with Zod and reconcile it with deterministic results.
  5. Persist `JobDescription`, `ResumeAnalysis`, and `AnalysisSkill` rows in one `prisma.$transaction`.
- **Errors:** `400`, `404` (resume not found/not owned), `503` (AI error).

#### `GET /api/v1/analyses` (paginated), `GET /api/v1/analyses/:id`, `DELETE /api/v1/analyses/:id`
- **Auth:** required; ownership enforced.

### 3.5 Roadmaps

#### `POST /api/v1/roadmaps`
- **Auth:** required.
- **Validation (Zod):**
  ```typescript
  z.object({
    analysisId: z.string().uuid(),
    targetRole: z.string().trim().min(2).max(100),
    timeframe: z.enum(['3_MONTHS', '6_MONTHS', '12_MONTHS']).default('6_MONTHS'),
  })
  ```
  `analysisId` is required: the roadmap is generated from the skill gaps recorded in that analysis.
- **Success (201):** returns the `CareerRoadmap` with nested, phase-grouped `RoadmapTask` records.
- **Behavior:** validates the analysis belongs to the user, generates phases with Gemini, then creates the roadmap and tasks in a transaction.

#### `PATCH /api/v1/roadmaps/tasks/:taskId`
- **Auth:** required; verifies the task belongs to a roadmap owned by the user.
- **Validation (Zod):** `z.object({ isCompleted: z.boolean() })`.
- **Success (200):**
  ```json
  {
    "success": true,
    "data": {
      "taskId": "7b8c9d0e-1f2a-3b4c-5d6e-7f8a9b0c1d2e",
      "isCompleted": true,
      "roadmapProgress": {
        "completedTasks": 5,
        "totalTasks": 12,
        "completionPercentage": 41.7
      }
    },
    "meta": { "timestamp": "2026-10-17T21:30:00.000Z" }
  }
  ```

---

## 4. Key API Test Scenarios

These map to the actual integration tests in `backend/tests/`.

| ID | Endpoint | Input | Expected | Checks |
| :--- | :--- | :--- | :---: | :--- |
| **AUTH-01** | `POST /auth/register` | Valid unique email, strong password | `201` | User creation, bcrypt hash, cookies set. |
| **AUTH-02** | `POST /auth/register` | Duplicate email | `409` | Unique constraint handled cleanly. |
| **AUTH-03** | `POST /auth/login` | Incorrect password | `401` | Credential rejection with a generic message. |
| **AUTH-04** | `GET /resumes` | No cookie | `401` | Auth middleware blocks the request. |
| **AUTH-05** | `GET /analyses/:id` | User A requests User B's analysis | `404` | Cross-tenant authorization. |
| **VAL-01** | `POST /analyses` | `resumeContent` < 100 chars | `400` | Zod validation and error format. |
| **AI-01** | `POST /analyses` | Valid resume and job text | `201` | End-to-end AI integration, schema validation, transaction. |
| **AI-02** | `POST /analyses` | Gemini quota/outage | `503` | Clean error envelope, no mock data. |
| **TASK-01** | `PATCH /roadmaps/tasks/:id` | Valid toggle | `200` | Task update and recalculated progress. |
