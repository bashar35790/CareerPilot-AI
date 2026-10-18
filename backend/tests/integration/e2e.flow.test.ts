import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import app from '../../src/index';
import { prisma } from '../../src/lib/prisma';
import { deleteUsers, disconnectDatabase } from '../helpers/db';
import { TEST_PASSWORD, TestUser, registerTestUser } from '../helpers/session';

vi.mock('../../src/lib/gemini', () => ({
  generateResumeAnalysis: vi.fn(async () => ({
    overallScore: 82,
    skillScore: 80,
    experienceScore: 76,
    summary: 'Strong alignment with the core backend requirements of this role.',
    matchedSkills: [
      {
        name: 'Node.js',
        category: 'FRAMEWORK',
        relevance: 'HIGH',
        evidenceFromResume: 'Built REST APIs with Node.js and Express.',
      },
      {
        name: 'PostgreSQL',
        category: 'DATABASE',
        relevance: 'HIGH',
        evidenceFromResume: 'Modeled relational schemas in PostgreSQL.',
      },
    ],
    missingRequiredSkills: [
      {
        name: 'Prisma',
        category: 'DATABASE',
        relevance: 'HIGH',
        contextualNote: 'Required for the ORM data layer.',
      },
    ],
    missingPreferredSkills: [
      {
        name: 'AWS',
        category: 'DEVOPS',
        relevance: 'MEDIUM',
        contextualNote: 'Preferred cloud provider for the team.',
      },
    ],
    recommendations: [
      {
        category: 'BULLET_POINT_REWRITE',
        priority: 'HIGH',
        original: 'Built backend APIs using Express and SQL.',
        improved: 'Accomplished a 25% query latency reduction by tuning PostgreSQL indexes.',
        rationale: 'Quantifies measurable engineering impact.',
      },
    ],
  })),
  generateCareerRoadmap: vi.fn(),
}));

const RESUME_CONTENT =
  'Junior full-stack developer with two years of experience. Built REST APIs using Node.js, Express and PostgreSQL, and shipped responsive dashboards with React and TypeScript. Comfortable collaborating with cross-functional teams and writing automated tests.';

const JOB_TEXT =
  'We are hiring a Junior Backend Developer proficient in Node.js, Express, PostgreSQL, Prisma and Redis. Experience containerizing services with Docker is required, and familiarity with a monitoring stack is a plus for the platform team.';

interface AnalysisResponse {
  id: string;
  resumeId: string;
  jobDescriptionId: string;
  overallScore: number;
  matchedSkills: Array<{ name: string }>;
  missingRequiredSkills: Array<{ name: string }>;
  missingPreferredSkills: Array<{ name: string }>;
  recommendations: unknown[];
}

describe('End-to-end pipeline (register -> resume -> job -> analysis)', () => {
  let owner: TestUser;
  let resumeId: string;
  let jobId: string;
  let analysisId: string;
  let overallScore: number;
  let analysisJobId: string;

  beforeAll(async () => {
    owner = await registerTestUser('e2e-pipeline');
  });

  afterAll(async () => {
    await deleteUsers([owner.id]);
    await disconnectDatabase();
  });

  it('rejects unauthenticated access to every pipeline endpoint with 401', async () => {
    const [resumes, jobs, analyses] = await Promise.all([
      request(app).get('/api/v1/resumes'),
      request(app).get('/api/v1/jobs'),
      request(app).get('/api/v1/analyses'),
    ]);

    expect(resumes.status).toBe(401);
    expect(jobs.status).toBe(401);
    expect(analyses.status).toBe(401);
  });

  it('registers the account and persists a bcrypt-hashed credential', async () => {
    const persisted = await prisma.user.findUniqueOrThrow({ where: { id: owner.id } });

    expect(persisted.email).toBe(owner.email);
    expect(persisted.passwordHash).not.toBe(TEST_PASSWORD);
    expect(persisted.passwordHash).toMatch(/^\$2[aby]\$/);

    const profile = await owner.agent.get('/api/v1/users/profile');
    expect(profile.status).toBe(200);
    expect(profile.body.data.user).toMatchObject({ id: owner.id, email: owner.email });
    expect(profile.body.data.stats).toMatchObject({
      totalResumes: 0,
      totalAnalyses: 0,
      averageMatchScore: null,
    });
  });

  it('creates a resume and persists it against the owner', async () => {
    const response = await owner.agent.post('/api/v1/resumes').send({
      title: 'Backend Engineer Resume',
      targetRole: 'Junior Backend Engineer',
      content: RESUME_CONTENT,
      isPrimary: true,
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);

    resumeId = response.body.data.resume.id;
    expect(resumeId).toBeTruthy();

    const persisted = await prisma.resume.findUniqueOrThrow({ where: { id: resumeId } });
    expect(persisted.userId).toBe(owner.id);
    expect(persisted.title).toBe('Backend Engineer Resume');
    expect(persisted.targetRole).toBe('Junior Backend Engineer');
    expect(persisted.content).toBe(RESUME_CONTENT);
    expect(persisted.isPrimary).toBe(true);

    const list = await owner.agent.get('/api/v1/resumes');
    expect(list.status).toBe(200);
    expect((list.body.data.resumes as Array<{ id: string }>).map((item) => item.id)).toContain(
      resumeId
    );
  });

  it('creates a job description and persists it against the owner', async () => {
    const response = await owner.agent.post('/api/v1/jobs').send({
      title: 'Junior Backend Developer',
      company: 'FinTech Innovators Inc.',
      experienceLevel: 'JUNIOR',
      rawText: JOB_TEXT,
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);

    jobId = response.body.data.job.id;
    expect(jobId).toBeTruthy();

    const persisted = await prisma.jobDescription.findUniqueOrThrow({ where: { id: jobId } });
    expect(persisted.userId).toBe(owner.id);
    expect(persisted.title).toBe('Junior Backend Developer');
    expect(persisted.company).toBe('FinTech Innovators Inc.');
    expect(persisted.experienceLevel).toBe('JUNIOR');
    expect(persisted.rawText).toBe(JOB_TEXT);
  });

  it('runs the match analysis and persists the linked record set atomically', async () => {
    const response = await owner.agent.post('/api/v1/analyses').send({
      resumeId,
      jobTitle: 'Junior Backend Developer',
      company: 'FinTech Innovators Inc.',
      experienceLevel: 'JUNIOR',
      jobDescriptionText: JOB_TEXT,
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);

    const analysis = response.body.data as AnalysisResponse;
    analysisId = analysis.id;
    overallScore = analysis.overallScore;

    expect(analysis.resumeId).toBe(resumeId);
    expect(analysis.overallScore).toBeGreaterThanOrEqual(0);
    expect(analysis.overallScore).toBeLessThanOrEqual(100);
    expect(analysis.matchedSkills.map((skill) => skill.name)).toContain('Node.js');
    expect(analysis.missingRequiredSkills.map((skill) => skill.name)).toContain('Prisma');
    expect(analysis.missingPreferredSkills.map((skill) => skill.name)).toContain('AWS');
    expect(analysis.recommendations.length).toBeGreaterThanOrEqual(1);

    const persisted = await prisma.resumeAnalysis.findUniqueOrThrow({
      where: { id: analysisId },
      include: {
        jobDescription: true,
        analysisSkills: { include: { skill: true } },
      },
    });

    expect(persisted.userId).toBe(owner.id);
    expect(persisted.resumeId).toBe(resumeId);
    expect(persisted.jobDescription.userId).toBe(owner.id);
    expect(persisted.jobDescription.rawText).toBe(JOB_TEXT);
    expect(persisted.jobDescriptionId).not.toBe(jobId);
    expect(persisted.modelVersion).toBeTruthy();
    expect(Array.isArray(persisted.recommendations)).toBe(true);
    expect(persisted.analysisSkills.length).toBeGreaterThanOrEqual(3);
    expect(persisted.analysisSkills.every((row) => row.skill.name.length > 0)).toBe(true);

    analysisJobId = persisted.jobDescriptionId;
  });

  it('verifies the full pipeline through the read APIs and profile stats', async () => {
    const detail = await owner.agent.get(`/api/v1/analyses/${analysisId}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data).toMatchObject({
      id: analysisId,
      resumeId,
      jobDescriptionId: analysisJobId,
      overallScore,
    });

    const list = await owner.agent.get('/api/v1/analyses');
    expect(list.status).toBe(200);
    expect((list.body.data.analyses as AnalysisResponse[]).map((item) => item.id)).toContain(
      analysisId
    );
    expect(list.body.data.pagination).toMatchObject({ page: 1, limit: 10, total: 1 });

    const profile = await owner.agent.get('/api/v1/users/profile');
    expect(profile.status).toBe(200);
    expect(profile.body.data.stats).toMatchObject({
      totalResumes: 1,
      totalAnalyses: 1,
      averageMatchScore: overallScore,
    });

    const [resumeCount, jobCount, analysisCount, skillCount] = await Promise.all([
      prisma.resume.count({ where: { userId: owner.id } }),
      prisma.jobDescription.count({ where: { userId: owner.id } }),
      prisma.resumeAnalysis.count({ where: { userId: owner.id } }),
      prisma.analysisSkill.count({ where: { analysisId } }),
    ]);

    expect(resumeCount).toBe(1);
    expect(jobCount).toBe(2);
    expect(analysisCount).toBe(1);
    expect(skillCount).toBeGreaterThanOrEqual(3);

    const linkedSkillNames = await prisma.analysisSkill.findMany({
      where: { analysisId },
      select: { skill: { select: { name: true } } },
    });
    expect(linkedSkillNames.every((row) => row.skill.name.length > 0)).toBe(true);
  });
});
