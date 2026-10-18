import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { generateCareerRoadmap } from '../../src/lib/gemini';
import { prisma } from '../../src/lib/prisma';
import { generateRoadmap, getRoadmapDetail } from '../../src/services/roadmap.service';
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
        phaseNumber: 3,
        phaseTitle: 'Phase 3: Portfolio & Interview Readiness',
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

describe('Roadmap generation service', () => {
  let owner: TestUser;
  let other: TestUser;
  let analysisId: string;

  beforeAll(async () => {
    owner = await registerTestUser('roadmap-owner');
    other = await registerTestUser('roadmap-other');

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

  it('generates a normalized, phase-ordered roadmap persisted in a transaction', async () => {
    const roadmap = await generateRoadmap(owner.id, {
      analysisId,
      targetRole: 'Backend Engineer',
      timeframe: '6_MONTHS',
    });

    expect(roadmap.analysisId).toBe(analysisId);
    expect(roadmap.targetRole).toBe('Backend Engineer');
    expect(roadmap.timeframe).toBe('6 Months');
    expect(roadmap.totalTasks).toBe(3);
    expect(roadmap.completedTasks).toBe(0);
    expect(roadmap.completionPercentage).toBe(0);

    // Phases are sorted by phaseNumber and renumbered sequentially by the server.
    expect(roadmap.phases.map((phase) => phase.phaseNumber)).toEqual([1, 2]);
    expect(roadmap.phases[0].phaseTitle).toBe('Phase 1: Database Foundations');
    expect(roadmap.phases[0].tasks).toHaveLength(1);
    expect(roadmap.phases[1].tasks.map((task) => task.orderIndex)).toEqual([1, 2]);

    const [roadmapRows, taskRows] = await Promise.all([
      prisma.careerRoadmap.count({ where: { userId: owner.id } }),
      prisma.roadmapTask.count({ where: { roadmapId: roadmap.id } }),
    ]);
    expect(roadmapRows).toBe(1);
    expect(taskRows).toBe(3);

    // The identified gaps were forwarded to the AI generation layer.
    const generationArgs = vi.mocked(generateCareerRoadmap).mock.calls[0][0];
    expect(generationArgs.targetRole).toBe('Backend Engineer');
    expect(generationArgs.timeframe).toBe('6 Months');
    expect(generationArgs.missingRequiredSkills.map((skill) => skill.name)).toContain('Prisma');
    expect(generationArgs.missingPreferredSkills.map((skill) => skill.name)).toContain('AWS');
  });

  it('fetches a roadmap owned by the user with its nested tasks', async () => {
    const created = await generateRoadmap(owner.id, {
      analysisId,
      targetRole: 'Backend Engineer',
      timeframe: '3_MONTHS',
    });

    const detail = await getRoadmapDetail(owner.id, created.id);
    expect(detail.id).toBe(created.id);
    expect(detail.timeframe).toBe('3 Months');
    expect(detail.phases).toHaveLength(2);
  });

  it('prevents cross-tenant roadmap generation and reads', async () => {
    await expect(
      generateRoadmap(other.id, {
        analysisId,
        targetRole: 'Backend Engineer',
        timeframe: '6_MONTHS',
      })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });

    const owned = await generateRoadmap(owner.id, {
      analysisId,
      targetRole: 'Backend Engineer',
      timeframe: '6_MONTHS',
    });

    await expect(getRoadmapDetail(other.id, owned.id)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});
