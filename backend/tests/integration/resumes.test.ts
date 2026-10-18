import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import app from '../../src/index';
import { deleteUsers, disconnectDatabase } from '../helpers/db';
import { TestUser, registerTestUser } from '../helpers/session';

const RESUME_CONTENT =
  'Seasoned full-stack developer with five years of experience building web applications using TypeScript, React, Node.js, Express, and PostgreSQL. Led the migration to a microservices architecture and reduced API latency by 40 percent across the platform.';

const SHORT_CONTENT = 'This resume text is intentionally far too short.';

interface ResumeSummary {
  id: string;
  title: string;
  content?: string;
}

describe('Resumes API (/api/v1/resumes)', () => {
  let owner: TestUser;
  let other: TestUser;
  let ownerResumeId: string;

  beforeAll(async () => {
    owner = await registerTestUser('resume-owner');
    other = await registerTestUser('resume-other');

    const response = await owner.agent.post('/api/v1/resumes').send({
      title: 'Primary Resume',
      targetRole: 'Full-Stack Engineer',
      content: RESUME_CONTENT,
      isPrimary: true,
    });

    expect(response.status).toBe(201);
    ownerResumeId = response.body.data.resume.id;
  });

  afterAll(async () => {
    await deleteUsers([owner.id, other.id]);
    await disconnectDatabase();
  });

  it('rejects unauthenticated access with 401', async () => {
    const response = await request(app).get('/api/v1/resumes');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('creates a resume and returns 201', async () => {
    const response = await owner.agent.post('/api/v1/resumes').send({
      title: 'Backend Resume',
      targetRole: 'Backend Engineer',
      content: RESUME_CONTENT,
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.resume).toMatchObject({
      title: 'Backend Resume',
      targetRole: 'Backend Engineer',
      isPrimary: false,
    });
    expect(response.body.data.resume.id).toBeTruthy();
  });

  it('promotes a new primary resume and demotes the previous one', async () => {
    const response = await owner.agent.post('/api/v1/resumes').send({
      title: 'Newest Primary Resume',
      content: RESUME_CONTENT,
      isPrimary: true,
    });

    expect(response.status).toBe(201);
    expect(response.body.data.resume.isPrimary).toBe(true);

    const previous = await owner.agent.get(`/api/v1/resumes/${ownerResumeId}`);
    expect(previous.body.data.resume.isPrimary).toBe(false);
  });

  it('rejects resume content shorter than 100 characters', async () => {
    const response = await owner.agent.post('/api/v1/resumes').send({
      title: 'Too Short',
      content: SHORT_CONTENT,
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(response.body.error.details)).toContain('100');
  });

  it('lists the authenticated user resumes without leaking content text', async () => {
    const response = await owner.agent.get('/api/v1/resumes');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data.resumes)).toBe(true);

    const ids = (response.body.data.resumes as ResumeSummary[]).map((resume) => resume.id);
    expect(ids).toContain(ownerResumeId);
    expect(response.body.data.resumes[0]).not.toHaveProperty('content');
  });

  it('retrieves a resume by id', async () => {
    const response = await owner.agent.get(`/api/v1/resumes/${ownerResumeId}`);

    expect(response.status).toBe(200);
    expect(response.body.data.resume).toMatchObject({
      id: ownerResumeId,
      content: RESUME_CONTENT,
    });
  });

  it('rejects a malformed resume id with 400', async () => {
    const response = await owner.agent.get('/api/v1/resumes/not-a-uuid');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('prevents cross-tenant read with 404', async () => {
    const response = await other.agent.get(`/api/v1/resumes/${ownerResumeId}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it('prevents cross-tenant update with 404', async () => {
    const response = await other.agent
      .put(`/api/v1/resumes/${ownerResumeId}`)
      .send({ title: 'Hijacked Resume' });

    expect(response.status).toBe(404);
  });

  it('prevents cross-tenant delete with 404', async () => {
    const response = await other.agent.delete(`/api/v1/resumes/${ownerResumeId}`);

    expect(response.status).toBe(404);
  });

  it('updates a resume owned by the user', async () => {
    const response = await owner.agent
      .put(`/api/v1/resumes/${ownerResumeId}`)
      .send({ title: 'Updated Primary Resume' });

    expect(response.status).toBe(200);
    expect(response.body.data.resume.title).toBe('Updated Primary Resume');
  });

  it('deletes a resume owned by the user', async () => {
    const created = await owner.agent.post('/api/v1/resumes').send({
      title: 'Disposable Resume',
      content: RESUME_CONTENT,
    });
    const disposableId = created.body.data.resume.id;

    const deleted = await owner.agent.delete(`/api/v1/resumes/${disposableId}`);
    expect(deleted.status).toBe(200);
    expect(deleted.body.data.message).toBe('Resume deleted');

    const afterDelete = await owner.agent.get(`/api/v1/resumes/${disposableId}`);
    expect(afterDelete.status).toBe(404);
  });
});
