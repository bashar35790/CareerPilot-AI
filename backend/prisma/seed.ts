import { disconnectDatabase, prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/lib/password';
import { DEMO_EMAIL, DEMO_PASSWORD } from '../src/services/auth.service';
import { syncCanonicalSkills } from '../src/services/matching.deterministic';

const DEMO_RESUME_TITLE = 'Full-Stack Developer Resume';
const DEMO_RESUME_TARGET_ROLE = 'Junior Full-Stack Developer';
const DEMO_RESUME_CONTENT = `ALEX DEVELOPER
Full-Stack Software Engineer
Email: alex@example.com | GitHub: github.com/alexdev | Portfolio: alexdev.io

PROFESSIONAL SUMMARY
Results-driven Full-Stack Software Engineer with 2+ years of hands-on experience building scalable web applications. Proficient in TypeScript, React, Next.js, Node.js, Express, PostgreSQL, and Prisma ORM. Passionate about clean architecture, relational database design, and automated testing.

TECHNICAL SKILLS
- Languages: TypeScript, JavaScript, SQL, HTML5, CSS3
- Frontend: React, Next.js, Tailwind CSS, Redux
- Backend: Node.js, Express.js, REST APIs, JWT, Authentication
- Databases & ORM: PostgreSQL, Prisma, Redis
- DevOps & Tools: Docker, Git, GitHub Actions, Vitest, Postman

WORK EXPERIENCE
Junior Full-Stack Engineer | TechVentures Inc. (2023 - Present)
- Architected and maintained 15+ secure REST API endpoints handling 20,000+ daily requests using Express.js and PostgreSQL.
- Implemented HttpOnly cookie-based session authentication with JWT refresh token rotation, reducing XSS risk.
- Optimized relational database queries and indexed Prisma foreign keys, reducing P95 query latency by 35%.
- Built responsive UI dashboards with Next.js and Tailwind CSS, increasing mobile user engagement by 28%.

PROJECTS
Career Alignment & ATS Match Engine
- Built a decoupled full-stack platform using Next.js, Express, Prisma, and PostgreSQL.
- Integrated Google Gemini for semantic qualification extraction and ATS keyword scoring.
- Implemented an automated Vitest test suite achieving 92% coverage across business logic services.`;

const DEMO_JOB_TITLE = 'Junior Full-Stack Developer';
const DEMO_JOB_COMPANY = 'FinTech Innovators Inc.';
const DEMO_JOB_TEXT = `FinTech Innovators Inc. - Junior Full-Stack Developer
Location: Remote (US / EMEA) | Full-time | Experience: 1-3 years

ABOUT THE ROLE
We are seeking an energetic Junior Full-Stack Software Engineer to join our core banking integrations team. You will design, develop, and maintain high-performance web applications and backend APIs.

KEY RESPONSIBILITIES
- Build resilient, scalable REST API endpoints using Node.js, Express.js, and TypeScript.
- Design normalized relational database schemas with PostgreSQL and execute migrations via Prisma ORM.
- Develop interactive, responsive frontend user interfaces using React, Next.js, and Tailwind CSS.
- Implement secure authentication mechanisms, including HttpOnly cookie-based JWT sessions.
- Write unit and integration test suites using Vitest to ensure reliability.
- Containerize application services using Docker for local development and CI/CD pipelines.

MANDATORY REQUIREMENTS
- 1-3 years of production experience in Full-Stack web development.
- Strong proficiency in TypeScript, React, Node.js, and Express.
- Hands-on experience with relational databases (PostgreSQL preferred) and Prisma ORM.
- Solid understanding of REST architectural principles and web security best practices.
- Familiarity with version control using Git and GitHub workflows.

PREFERRED QUALIFICATIONS (BONUS)
- Experience with Docker containerization and CI/CD automation.
- Exposure to AWS or Google Cloud hosting.
- Experience with Redis caching.`;

async function seed(): Promise<void> {
  console.log('[seed] Syncing canonical skill taxonomy...');
  const skillCount = await syncCanonicalSkills();
  console.log(`[seed] Upserted ${skillCount} canonical skills.`);

  console.log('[seed] Provisioning demo reviewer account...');
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const demoUser = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {
      fullName: 'Demo Reviewer',
      targetRole: DEMO_RESUME_TARGET_ROLE,
      careerLevel: 'JUNIOR',
    },
    create: {
      email: DEMO_EMAIL,
      passwordHash,
      fullName: 'Demo Reviewer',
      targetRole: DEMO_RESUME_TARGET_ROLE,
      careerLevel: 'JUNIOR',
    },
  });

  const existingResume = await prisma.resume.findFirst({
    where: { userId: demoUser.id, title: DEMO_RESUME_TITLE },
    select: { id: true },
  });
  if (!existingResume) {
    await prisma.resume.create({
      data: {
        userId: demoUser.id,
        title: DEMO_RESUME_TITLE,
        targetRole: DEMO_RESUME_TARGET_ROLE,
        content: DEMO_RESUME_CONTENT,
        isPrimary: true,
      },
    });
    console.log('[seed] Created demo resume.');
  }

  const existingJob = await prisma.jobDescription.findFirst({
    where: { userId: demoUser.id, title: DEMO_JOB_TITLE },
    select: { id: true },
  });
  if (!existingJob) {
    await prisma.jobDescription.create({
      data: {
        userId: demoUser.id,
        title: DEMO_JOB_TITLE,
        company: DEMO_JOB_COMPANY,
        experienceLevel: 'JUNIOR',
        rawText: DEMO_JOB_TEXT,
      },
    });
    console.log('[seed] Created demo job posting.');
  }

  console.log('[seed] Done. Demo credentials:');
  console.log(`       email:    ${DEMO_EMAIL}`);
  console.log(`       password: ${DEMO_PASSWORD}`);
}

seed()
  .catch((error) => {
    console.error('[seed] Failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
