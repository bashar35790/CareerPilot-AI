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
    recommendations: [],
  })),
  generateCareerRoadmap: vi.fn(async () => ({
    phases: [
      {
        phaseNumber: 2,
        phaseTitle: 'Phase 2: Portfolio & Interview Readiness',
        tasks: [
          {
            title: 'Ship a portfolio project',
            description: 'Build and deploy a full-stack app that exercises the missing required skills.',
          },
          {
            title: 'Practice system design',
            description: 'Walk through two backend design interview scenarios end to end.',
          },
        ],
      },
      {
        phaseNumber: 1,
        phaseTitle: 'Phase 1: Database Foundations',
        tasks: [
          {
            title: 'Master Prisma ORM',
            description: 'Build a CRUD service with Prisma and PostgreSQL to practice schema design.',
          },
        ],
      },
    ],
  })),
}));

const RESUME_CONTENT =
  'Junior full-stack developer with two years of experience. Built REST APIs using Node.js, Express and PostgreSQL, and shipped responsive dashboards with React and TypeScript. Comfortable collaborating with cross-functional teams and writing automated tests.';

const JOB_TEXT =
  'We are hiring a Junior Backend Developer proficient in Node.js, Express, PostgreSQL, Prisma and Redis. Experience containerizing services with Docker is required, and familiarity with a monitoring stack is a plus for the platform team.';

interface RoadmapTaskResponse {
  id: string;
  phaseNumber: number;
  isCompleted: boolean;
  orderIndex: number;
}

interface RoadmapResponse {
  id: string;
  analysisId: string;
  targetRole: string;
  timeframe: string;
  totalTasks: number;
  completedTasks: number;
  completionPercentage: number;
  phases: Array<{ phaseNumber: number; phaseTitle: string; tasks: RoadmapTaskResponse[] }>;
}

describe('Roadmaps API (/api/v1/roadmaps)', () => {
  let owner: TestUser;
  let other: TestUser;
  let analysisId: string;
  let roadmapId: string;
  let firstTaskId: string;

  beforeAll(async () => {
    owner = await registerTestUser('roadmap-api-owner');
    other = await registerTestUser('roadmap-api-other');

    const resumeResponse = await owner.agent.post('/api/v1/resumes').send({
      title: 'Backend Engineer Resume',
      content: RESUME_CONTENT,
    });
    expect(resumeResponse.status).toBe(201);
    const resumeId = resumeResponse.body.data.resume.id;

    const analysisResponse = await owner.agent.post('/api/v1/analyses').send({
      resumeId,
      jobTitle: 'Junior Backend Developer',
      company: 'FinTech Innovators Inc.',
      experienceLevel: 'JUNIOR',
      jobDescriptionText: JOB_TEXT,
    });
    expect(analysisResponse.status).toBe(201);
    analysisId = analysisResponse.body.data.id;
  });

  afterAll(async () => {
    await deleteUsers([owner.id, other.id]);
    await disconnectDatabase();
  });

  it('rejects unauthenticated access with 401', async () => {
    const response = await request(app).get('/api/v1/roadmaps');
    expect(response.status).toBe(401);
  });

  it('requires a valid analysisId and timeframe when generating a roadmap', async () => {
    const missingAnalysis = await owner.agent.post('/api/v1/roadmaps').send({
      targetRole: 'Backend Engineer',
    });
    expect(missingAnalysis.status).toBe(400);
    expect(missingAnalysis.body.error.code).toBe('VALIDATION_ERROR');

    const badTimeframe = await owner.agent.post('/api/v1/roadmaps').send({
      analysisId,
      targetRole: 'Backend Engineer',
      timeframe: '24_MONTHS',
    });
    expect(badTimeframe.status).toBe(400);
  });

  it('generates a roadmap with normalized, phase-ordered tasks', async () => {
    const response = await owner.agent.post('/api/v1/roadmaps').send({
      analysisId,
      targetRole: 'Backend Engineer',
      timeframe: '6_MONTHS',
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);

    const roadmap = response.body.data as RoadmapResponse;
    roadmapId = roadmap.id;
    firstTaskId = roadmap.phases[0].tasks[0].id;

    expect(roadmap.analysisId).toBe(analysisId);
    expect(roadmap.timeframe).toBe('6 Months');
    expect(roadmap.totalTasks).toBe(3);
    expect(roadmap.completedTasks).toBe(0);
    expect(roadmap.completionPercentage).toBe(0);
    expect(roadmap.phases.map((phase) => phase.phaseNumber)).toEqual([1, 2]);
    expect(roadmap.phases[1].tasks.map((task) => task.orderIndex)).toEqual([1, 2]);
  });

  it('lists roadmaps owned by the authenticated user with pagination metadata', async () => {
    const response = await owner.agent.get('/api/v1/roadmaps');

    expect(response.status).toBe(200);
    const ids = (response.body.data.roadmaps as RoadmapResponse[]).map((item) => item.id);
    expect(ids).toContain(roadmapId);
    expect(response.body.data.pagination).toMatchObject({ page: 1, limit: 10, total: 1 });
  });

  it('fetches a roadmap with its phased tasks', async () => {
    const response = await owner.agent.get(`/api/v1/roadmaps/${roadmapId}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ id: roadmapId, totalTasks: 3 });
    expect(response.body.data.phases).toHaveLength(2);
  });

  it('rejects a malformed roadmap id with 400', async () => {
    const response = await owner.agent.get('/api/v1/roadmaps/not-a-uuid');
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('toggles a task and recalculates roadmap progress', async () => {
    const response = await owner.agent
      .patch(`/api/v1/roadmaps/tasks/${firstTaskId}`)
      .send({ isCompleted: true });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      taskId: firstTaskId,
      isCompleted: true,
      roadmapProgress: { completedTasks: 1, totalTasks: 3, completionPercentage: 33.3 },
    });

    const persisted = await prisma.roadmapTask.findUniqueOrThrow({ where: { id: firstTaskId } });
    expect(persisted.isCompleted).toBe(true);

    const roadmap = await owner.agent.get(`/api/v1/roadmaps/${roadmapId}`);
    expect(roadmap.body.data.completionPercentage).toBe(33.3);

    const revert = await owner.agent
      .patch(`/api/v1/roadmaps/tasks/${firstTaskId}`)
      .send({ isCompleted: false });
    expect(revert.body.data.roadmapProgress.completedTasks).toBe(0);
  });

  it('requires a boolean completion flag and valid task id', async () => {
    const badBody = await owner.agent
      .patch(`/api/v1/roadmaps/tasks/${firstTaskId}`)
      .send({ isCompleted: 'yes' });
    expect(badBody.status).toBe(400);

    const badParam = await owner.agent
      .patch('/api/v1/roadmaps/tasks/not-a-uuid')
      .send({ isCompleted: true });
    expect(badParam.status).toBe(400);
  });

  it('prevents cross-tenant roadmap reads and task updates with 404', async () => {
    const read = await other.agent.get(`/api/v1/roadmaps/${roadmapId}`);
    const toggle = await other.agent
      .patch(`/api/v1/roadmaps/tasks/${firstTaskId}`)
      .send({ isCompleted: true });

    expect(read.status).toBe(404);
    expect(toggle.status).toBe(404);
  });
});
