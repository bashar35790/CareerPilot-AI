# REST API Specification: CareerPilot AI

> **Protocol:** HTTP/1.1 over TLS (HTTPS)  
> **Base Path:** `/api/v1`  
> **Data Format:** JSON (`application/json`)  
> **Authentication:** Signed `httpOnly` Cookie (`access_token`)  
> **Version:** 1.0.0 (Proposed Specification)  
> **Author:** Senior Software Architect  

---

## 1. Global REST API Conventions

### 1.1 Response Envelope Structure
All API responses use a predictable, standardized envelope containing a boolean `success` flag, a `data` payload (or `null`), a descriptive `error` payload on failure, and a `meta` block.

#### Success Envelope (HTTP 200, 201)
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

#### Error Envelope (HTTP 4xx, 5xx)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "email",
        "issue": "Invalid email address format"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-10-17T21:30:00.000Z"
  }
}
```

### 1.2 Standard HTTP Status Codes

| Status Code | Semantics in CareerPilot AI |
| :--- | :--- |
| `200 OK` | Successful query or idempotent update. |
| `201 Created` | Resource successfully created (Resume, Job, Analysis, Roadmap). |
| `400 Bad Request` | Malformed JSON or Zod schema validation failure. |
| `401 Unauthorized` | Missing, expired, or invalid authentication cookie. |
| `403 Forbidden` | Authenticated user lacks permission to access target resource (cross-tenant violation). |
| `404 Not Found` | Requested resource does not exist. |
| `409 Conflict` | Unique constraint violation (e.g., email already registered). |
| `429 Too Many Requests`| Rate limit exceeded (user or IP level). |
| `500 Internal Server Error` | Unexpected server fault; internal stack redacted. |
| `503 Service Unavailable` | Upstream AI engine (Gemini) failure or quota exhaustion. |

---

## 2. API Endpoint Catalogue

```
/api/v1/
├── auth/
│   ├── POST   /register             # Register new user account
│   ├── POST   /login                # Authenticate and receive session cookies
│   ├── POST   /demo                 # One-click demo login for evaluation
│   ├── POST   /refresh              # Rotate refresh token and refresh access token
│   ├── POST   /logout               # Clear cookies and revoke refresh token
│   └── GET    /me                   # Retrieve authenticated user session details
├── users/
│   ├── GET    /profile              # Fetch user profile and summary stats
│   └── PUT    /profile              # Update profile details
├── resumes/
│   ├── POST   /                     # Save a new resume
│   ├── GET    /                     # List authenticated user's resumes
│   ├── GET    /:id                  # Retrieve specific resume by ID
│   ├── PUT    /:id                  # Update resume title or content
│   └── DELETE /:id                  # Delete resume
├── jobs/
│   ├── POST   /                     # Save target job description
│   ├── GET    /                     # List saved job descriptions
│   ├── GET    /:id                  # Retrieve job description by ID
│   └── DELETE /:id                  # Delete job description
├── analyses/
│   ├── POST   /                     # Execute Resume–Job gap analysis (Flagship AI)
│   ├── GET    /                     # List user analysis history (paginated)
│   ├── GET    /:id                  # Fetch full analysis breakdown & recommendations
│   └── DELETE /:id                  # Delete analysis record
└── roadmaps/
    ├── POST   /                     # Generate AI Career Roadmap from analysis or role
    ├── GET    /                     # List user roadmaps
    ├── GET    /:id                  # Retrieve roadmap with phased tasks
    └── PATCH  /tasks/:taskId        # Toggle completion status of a roadmap task
```

---

## 3. Detailed Endpoint Specifications

### 3.1 Authentication Group

#### `POST /api/v1/auth/register`
- **Purpose:** Create a new user account and establish session.
- **Auth:** Public.
- **Validation Schema (Zod):**
  ```typescript
  z.object({
    fullName: z.string().min(2).max(100),
    email: z.string().email().toLowerCase().trim(),
    password: z.string().min(8).max(100).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must include upper, lower, and numeric characters"),
    targetRole: z.string().max(100).optional(),
  })
  ```
- **Request Body Example:**
  ```json
  {
    "fullName": "Jane Developer",
    "email": "jane@example.com",
    "password": "SecurePassword123",
    "targetRole": "Junior Full-Stack Developer"
  }
  ```
- **Success Response (201 Created):**
  - Sets `httpOnly` `access_token` and `refresh_token` cookies.
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "email": "jane@example.com",
        "fullName": "Jane Developer",
        "role": "USER",
        "targetRole": "Junior Full-Stack Developer"
      }
    },
    "meta": { "timestamp": "2026-10-17T21:30:00.000Z" }
  }
  ```
- **Error Responses:** `400 Bad Request` (validation issue), `409 Conflict` ("Email already registered").
- **Database Operations:** `prisma.user.create()`, `prisma.refreshToken.create()`.

---

#### `POST /api/v1/auth/login`
- **Purpose:** Authenticate an existing user with email and password.
- **Auth:** Public.
- **Request Body Example:**
  ```json
  {
    "email": "jane@example.com",
    "password": "SecurePassword123"
  }
  ```
- **Success Response (200 OK):** Sets cookies; returns user profile object.
- **Error Responses:** `401 Unauthorized` ("Invalid email or password").
- **Database Operations:** `prisma.user.findUnique()`, `prisma.refreshToken.create()`.

---

#### `POST /api/v1/auth/demo`
- **Purpose:** Provide one-click demo login for assessment review.
- **Auth:** Public.
- **Business Logic:** Finds or provisions `demo@careerpilot.internal` with a pre-hashed password, issues valid session cookies, and returns the demo user.

---

#### `POST /api/v1/auth/logout`
- **Purpose:** Invalidate session and revoke refresh token.
- **Auth:** Authenticated (`access_token` or `refresh_token` cookie required).
- **Success Response (200 OK):** Clears cookies; returns `{ "message": "Successfully logged out" }`.
- **Database Operations:** `prisma.refreshToken.updateMany({ where: { tokenHash }, data: { isRevoked: true } })`.

---

### 3.2 Resume Management Group

#### `POST /api/v1/resumes`
- **Purpose:** Create and store a new resume.
- **Auth:** Authenticated.
- **Validation Schema (Zod):**
  ```typescript
  z.object({
    title: z.string().min(3).max(150),
    targetRole: z.string().max(100).optional(),
    content: z.string().min(100, "Resume must contain at least 100 characters").max(20000),
    isPrimary: z.boolean().optional(),
  })
  ```
- **Request Body Example:**
  ```json
  {
    "title": "Full-Stack Web Dev Resume",
    "targetRole": "Full-Stack Engineer",
    "content": "JANE DEVELOPER\nFull-Stack Engineer with experience in React, Node.js, TypeScript...",
    "isPrimary": true
  }
  ```
- **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "e4f5a6b7-c8d9-0123-ef45-6789abcdef01",
      "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "title": "Full-Stack Web Dev Resume",
      "targetRole": "Full-Stack Engineer",
      "isPrimary": true,
      "createdAt": "2026-10-17T21:30:00.000Z"
    },
    "meta": { "timestamp": "2026-10-17T21:30:00.000Z" }
  }
  ```
- **Database Operations:** `prisma.resume.create()`. If `isPrimary: true`, updates other user resumes in transaction setting `isPrimary: false`.

---

#### `GET /api/v1/resumes`
- **Purpose:** Retrieve all resumes owned by the authenticated user.
- **Auth:** Authenticated.
- **Authorization Rule:** `WHERE userId = req.user.id`.
- **Success Response (200 OK):** Array of resume summaries (excluding large `content` text if querying list).

---

### 3.3 Flagship AI Feature: Resume–Job Gap Analysis Group

#### `POST /api/v1/analyses`
- **Purpose:** Perform comprehensive AI-powered qualification matching and skill gap analysis.
- **Auth:** Authenticated.
- **Validation Schema (Zod):**
  ```typescript
  z.object({
    resumeId: z.string().uuid().optional(),
    resumeContent: z.string().min(100).max(20000).optional(),
    jobTitle: z.string().min(2).max(150),
    company: z.string().min(2).max(150),
    jobDescriptionText: z.string().min(100).max(20000),
  }).refine((data) => data.resumeId || data.resumeContent, {
    message: "Either resumeId or resumeContent must be provided",
  })
  ```
- **Request Body Example:**
  ```json
  {
    "resumeId": "e4f5a6b7-c8d9-0123-ef45-6789abcdef01",
    "jobTitle": "Junior Backend Developer",
    "company": "FinTech Innovators Inc.",
    "jobDescriptionText": "Looking for a Junior Backend Developer proficient in Node.js, Express, PostgreSQL, Prisma, and REST APIs. Experience with Docker and Redis is a plus."
  }
  ```
- **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "f7a8b9c0-1234-5678-90ab-cdef12345678",
      "overallScore": 78,
      "skillScore": 82,
      "experienceScore": 70,
      "summary": "Strong alignment with core backend technologies (Node.js, Express, PostgreSQL). Gaps identified in containerization (Docker) and caching mechanisms.",
      "matchedSkills": [
        { "name": "Node.js", "category": "FRAMEWORK", "relevance": "HIGH" },
        { "name": "PostgreSQL", "category": "DATABASE", "relevance": "HIGH" },
        { "name": "REST APIs", "category": "CONCEPT", "relevance": "HIGH" }
      ],
      "missingRequiredSkills": [
        { "name": "Prisma", "category": "TOOL", "relevance": "HIGH", "contextualNote": "Required for ORM data layer" }
      ],
      "missingPreferredSkills": [
        { "name": "Docker", "category": "DEVOPS", "relevance": "MEDIUM", "contextualNote": "Bonus qualification in posting" }
      ],
      "recommendations": [
        {
          "category": "SKILL_INTEGRATION",
          "action": "Highlight Prisma ORM experience in projects section to address explicit requirement.",
          "priority": "HIGH"
        },
        {
          "category": "BULLET_POINT_REWRITE",
          "original": "Built backend APIs for web application using Express and SQL database.",
          "improved": "Architected resilient REST API endpoints using Express and PostgreSQL, handling relational transactions and reducing query latency by 25%.",
          "rationale": "Incorporates exact job keywords and quantifies engineering impact."
        }
      ]
    },
    "meta": { "timestamp": "2026-10-17T21:30:00.000Z" }
  }
  ```
- **Business Logic & Persistence:**
  1. Authenticates user and verifies resume ownership (`resume.userId === req.user.id`).
  2. Runs deterministic exact match against canonical skills dictionary.
  3. Sends sanitized payload to Gemini API with strict JSON schema.
  4. Validates returned AI response via Zod.
  5. Commits `JobDescription`, `ResumeAnalysis`, and `AnalysisSkill` rows in a single atomic `prisma.$transaction`.
- **Error Responses:** `400 Bad Request`, `403 Forbidden` (not resume owner), `429 Too Many Requests`, `503 Service Unavailable` (AI API error).

---

#### `GET /api/v1/analyses/:id`
- **Purpose:** Retrieve full analysis record with skill breakdown and recommendations.
- **Auth:** Authenticated.
- **Authorization Rule:** `WHERE id = req.params.id AND userId = req.user.id`.
- **Success Response (200 OK):** Returns complete analysis details including joined `AnalysisSkill` and `JobDescription` models.

---

### 3.4 Career Roadmap Group

#### `POST /api/v1/roadmaps`
- **Purpose:** Generate a customized career roadmap and phased milestone tasks.
- **Auth:** Authenticated.
- **Validation Schema (Zod):**
  ```typescript
  z.object({
    analysisId: z.string().uuid().optional(),
    targetRole: z.string().min(2).max(100),
    timeframe: z.enum(["3_MONTHS", "6_MONTHS", "12_MONTHS"]).default("6_MONTHS"),
  })
  ```
- **Success Response (201 Created):** Returns generated `CareerRoadmap` containing nested `RoadmapTask` records grouped into phases.
- **Database Operations:** Atomic transaction creating `CareerRoadmap` and all `RoadmapTask` rows.

---

#### `PATCH /api/v1/roadmaps/tasks/:taskId`
- **Purpose:** Toggle the completion status of a roadmap task.
- **Auth:** Authenticated.
- **Authorization Rule:** Verifies task belongs to a roadmap owned by `req.user.id`.
- **Validation Schema (Zod):**
  ```typescript
  z.object({
    isCompleted: z.boolean(),
  })
  ```
- **Success Response (200 OK):**
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

## 4. Critical API Test Cases & Scenarios

| Test Case Identifier | Method & Path | Input Condition | Expected Status | Verification Objective |
| :--- | :--- | :--- | :---: | :--- |
| **TC-API-AUTH-01** | `POST /auth/register` | Valid unique email, strong password | `201 Created` | Verifies user creation, bcrypt hash, and cookie header generation. |
| **TC-API-AUTH-02** | `POST /auth/register` | Duplicate email address | `409 Conflict` | Verifies unique constraint handling without crashing. |
| **TC-API-AUTH-03** | `POST /auth/login` | Incorrect password | `401 Unauthorized` | Verifies credential rejection and generic security message. |
| **TC-API-AUTH-04** | `GET /resumes` | Request without cookie | `401 Unauthorized` | Verifies authentication middleware gatekeeper. |
| **TC-API-AUTH-05** | `GET /analyses/:id` | Valid token from User A, requesting User B's analysis | `403 Forbidden` / `404 Not Found` | Verifies multi-tenant cross-user authorization protection. |
| **TC-API-VAL-01** | `POST /analyses` | `resumeContent` < 100 characters | `400 Bad Request` | Verifies Zod field validation and error format. |
| **TC-API-AI-01** | `POST /analyses` | Valid resume and job text | `201 Created` | Verifies end-to-end Gemini integration, schema validation, and DB transaction. |
| **TC-API-AI-02** | `POST /analyses` | Gemini API simulated quota exhaustion (`429`) | `503 Service Unavailable` | Verifies clean failure envelope instead of uncaught crash or fake mock response. |
| **TC-API-TASK-01** | `PATCH /roadmaps/tasks/:id` | Valid task toggle | `200 OK` | Verifies atomic task status update and recalculated progress percentage. |
