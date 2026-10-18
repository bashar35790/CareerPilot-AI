import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import app from '../../src/index';
import { deleteUsers, disconnectDatabase } from '../helpers/db';
import { TestUser, registerTestUser } from '../helpers/session';

const JOB_RAW_TEXT =
  'We are hiring a Junior Full-Stack Developer to design and build REST APIs with Node.js, Express, and PostgreSQL. You will work with React and TypeScript, containerize services with Docker, and collaborate with a cross-functional team to ship features. Experience with Prisma and continuous integration is a plus.';

const SHORT_RAW_TEXT = 'Too short to be a real job description.';

interface JobSummary {
  id: string;
  title: string;
  rawText?: string;
}

describe('Jobs API (/api/v1/jobs)', () => {
  let owner: TestUser;
  let other: TestUser;
  let ownerJobId: string;

  beforeAll(async () => {
    owner = await registerTestUser('job-owner');
    other = await registerTestUser('job-other');

    const response = await owner.agent.post('/api/v1/jobs').send({
      title: 'Junior Full-Stack Developer',
      company: 'FinTech Innovators Inc.',
      experienceLevel: 'JUNIOR',
      rawText: JOB_RAW_TEXT,
    });

    expect(response.status).toBe(201);
    ownerJobId = response.body.data.job.id;
  });

  afterAll(async () => {
    await deleteUsers([owner.id, other.id]);
    await disconnectDatabase();
  });

  it('rejects unauthenticated access with 401', async () => {
    const response = await request(app).get('/api/v1/jobs');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('creates a job description and returns 201', async () => {
    const response = await owner.agent.post('/api/v1/jobs').send({
      title: 'Backend Developer',
      company: 'Data Systems Ltd.',
      rawText: JOB_RAW_TEXT,
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.job).toMatchObject({
      title: 'Backend Developer',
      company: 'Data Systems Ltd.',
      experienceLevel: 'MID',
    });
    expect(response.body.data.job.id).toBeTruthy();
  });

  it('rejects a job description shorter than 100 characters', async () => {
    const response = await owner.agent.post('/api/v1/jobs').send({
      title: 'Too Short',
      company: 'Nowhere Inc.',
      rawText: SHORT_RAW_TEXT,
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(response.body.error.details)).toContain('100');
  });

  it('lists the authenticated user job descriptions', async () => {
    const response = await owner.agent.get('/api/v1/jobs');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data.jobs)).toBe(true);

    const ids = (response.body.data.jobs as JobSummary[]).map((job) => job.id);
    expect(ids).toContain(ownerJobId);
    expect(response.body.data.jobs[0]).not.toHaveProperty('rawText');
  });

  it('retrieves a job description by id', async () => {
    const response = await owner.agent.get(`/api/v1/jobs/${ownerJobId}`);

    expect(response.status).toBe(200);
    expect(response.body.data.job).toMatchObject({
      id: ownerJobId,
      rawText: JOB_RAW_TEXT,
    });
  });

  it('rejects a malformed job id with 400', async () => {
    const response = await owner.agent.get('/api/v1/jobs/not-a-uuid');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('prevents cross-tenant read with 404', async () => {
    const response = await other.agent.get(`/api/v1/jobs/${ownerJobId}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it('prevents cross-tenant delete with 404', async () => {
    const response = await other.agent.delete(`/api/v1/jobs/${ownerJobId}`);

    expect(response.status).toBe(404);

    const stillThere = await owner.agent.get(`/api/v1/jobs/${ownerJobId}`);
    expect(stillThere.status).toBe(200);
  });

  it('deletes a job description owned by the user', async () => {
    const created = await owner.agent.post('/api/v1/jobs').send({
      title: 'Disposable Job',
      company: 'Temp Co.',
      rawText: JOB_RAW_TEXT,
    });
    const disposableId = created.body.data.job.id;

    const deleted = await owner.agent.delete(`/api/v1/jobs/${disposableId}`);
    expect(deleted.status).toBe(200);
    expect(deleted.body.data.message).toBe('Job description deleted');

    const afterDelete = await owner.agent.get(`/api/v1/jobs/${disposableId}`);
    expect(afterDelete.status).toBe(404);
  });
});
