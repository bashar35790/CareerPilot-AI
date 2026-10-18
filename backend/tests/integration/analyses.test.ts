import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import app from '../../src/index';
import { prisma } from '../../src/lib/prisma';
import { deleteUsers, disconnectDatabase } from '../helpers/db';
import { TestUser, registerTestUser } from '../helpers/session';

vi.mock('../../src/lib/gemini', () => ({
  generateResumeAnalysis: vi.fn(async () => ({
    overallScore: 80,
    skillScore: 78,
    experienceScore: 75,
    summary: 'Strong alignment with the core backend requirements of this role.',
    matchedSkills: [
      {
        name: 'Node.js',
        category: 'FRAMEWORK',
        relevance: 'HIGH',
        evidenceFromResume: 'Built REST APIs with Node.js and Express.',
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
}));

const RESUME_CONTENT =
  'Junior full-stack developer with two years of experience. Built REST APIs using Node.js, Express and PostgreSQL, and shipped responsive dashboards with React and TypeScript. Comfortable collaborating with cross-functional teams and writing automated tests.';

const JOB_TEXT =
  'We are hiring a Junior Backend Developer proficient in Node.js, Express, PostgreSQL, Prisma and Redis. Experience containerizing services with Docker is required, and familiarity with a monitoring stack is a plus for the platform team.';

interface AnalysisResponse {
  id: string;
  overallScore: number;
  matchedSkills: Array<{ name: string }>;
  missingRequiredSkills: Array<{ name: string }>;
  missingPreferredSkills: Array<{ name: string }>;
  recommendations: unknown[];
}

describe('Analyses API (/api/v1/analyses)', () => {
  let owner: TestUser;
  let other: TestUser;
  let resumeId: string;
  let analysisId: string;

  beforeAll(async () => {
    owner = await registerTestUser('analysis-owner');
    other = await registerTestUser('analysis-other');

    const resumeResponse = await owner.agent.post('/api/v1/resumes').send({
      title: 'Backend Engineer Resume',
      content: RESUME_CONTENT,
    });
    expect(resumeResponse.status).toBe(201);
    resumeId = resumeResponse.body.data.resume.id;
  });

  afterAll(async () => {
    await deleteUsers([owner.id, other.id]);
    await disconnectDatabase();
  });

  it('rejects unauthenticated access with 401', async () => {
    const response = await request(app).get('/api/v1/analyses');
    expect(response.status).toBe(401);
  });

  it('requires either resumeId or resumeContent', async () => {
    const response = await owner.agent.post('/api/v1/analyses').send({
      jobTitle: 'Junior Backend Developer',
      company: 'FinTech Innovators Inc.',
      jobDescriptionText: JOB_TEXT,
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects inline resume content shorter than 100 characters', async () => {
    const response = await owner.agent.post('/api/v1/analyses').send({
      resumeContent: 'Too short.',
      jobTitle: 'Junior Backend Developer',
      company: 'FinTech Innovators Inc.',
      jobDescriptionText: JOB_TEXT,
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('runs a match analysis and persists linked rows atomically', async () => {
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

    expect(analysis.id).toBeTruthy();
    expect(analysis.overallScore).toBeGreaterThanOrEqual(0);
    expect(analysis.overallScore).toBeLessThanOrEqual(100);
    expect(analysis.matchedSkills.length).toBeGreaterThanOrEqual(2);
    expect(analysis.missingRequiredSkills.length).toBeGreaterThanOrEqual(1);
    expect(analysis.missingPreferredSkills.map((s) => s.name)).toContain('AWS');
    expect(analysis.recommendations).toHaveLength(1);

    const [jobRows, analysisRows, skillRows] = await Promise.all([
      prisma.jobDescription.count({ where: { userId: owner.id } }),
      prisma.resumeAnalysis.count({ where: { userId: owner.id } }),
      prisma.analysisSkill.count({ where: { analysisId: analysis.id } }),
    ]);

    expect(jobRows).toBe(1);
    expect(analysisRows).toBe(1);
    expect(skillRows).toBeGreaterThanOrEqual(4);
  });

  it('lists the authenticated user analyses with pagination metadata', async () => {
    const response = await owner.agent.get('/api/v1/analyses');

    expect(response.status).toBe(200);
    const ids = (response.body.data.analyses as AnalysisResponse[]).map((item) => item.id);
    expect(ids).toContain(analysisId);
    expect(response.body.data.pagination).toMatchObject({ page: 1, limit: 10, total: 1 });
  });

  it('fetches the full analysis breakdown by id', async () => {
    const response = await owner.agent.get(`/api/v1/analyses/${analysisId}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: analysisId,
      resumeId,
      modelVersion: expect.any(String),
    });
    expect(Array.isArray(response.body.data.matchedSkills)).toBe(true);
    expect(Array.isArray(response.body.data.missingRequiredSkills)).toBe(true);
  });

  it('rejects a malformed analysis id with 400', async () => {
    const response = await owner.agent.get('/api/v1/analyses/not-a-uuid');
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('prevents cross-tenant access with 404', async () => {
    const read = await other.agent.get(`/api/v1/analyses/${analysisId}`);
    const remove = await other.agent.delete(`/api/v1/analyses/${analysisId}`);

    expect(read.status).toBe(404);
    expect(remove.status).toBe(404);
  });

  it('deletes an analysis owned by the user', async () => {
    const deleted = await owner.agent.delete(`/api/v1/analyses/${analysisId}`);
    expect(deleted.status).toBe(200);

    const afterDelete = await owner.agent.get(`/api/v1/analyses/${analysisId}`);
    expect(afterDelete.status).toBe(404);

    const remainingSkills = await prisma.analysisSkill.count({ where: { analysisId } });
    expect(remainingSkills).toBe(0);
  });
});
