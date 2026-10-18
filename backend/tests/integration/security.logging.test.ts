import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import app from '../../src/index';
import { deleteUsers, disconnectDatabase } from '../helpers/db';

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
    missingPreferredSkills: [],
    recommendations: [],
  })),
  generateCareerRoadmap: vi.fn(),
}));

const EMAIL = `pii.logging.${Date.now()}@example.com`;
const PASSWORD = 'PiiLogging123!';
const WRONG_PASSWORD = 'WrongPassword456!';
const FULL_NAME = 'Pii Logging Sentinel';
const RESUME_TOKEN = 'PII_RESUME_BODY_SENTINEL_7c1f9a';
const RESUME_CONTENT = `${RESUME_TOKEN} ${'legitimate resume body sentence. '.repeat(6)}`;
const JOB_TEXT =
  'We are hiring a Junior Backend Developer proficient in Node.js, Express, PostgreSQL, Prisma and Redis. Docker and monitoring exposure are required for the platform team.';

interface AppLogRecord {
  level: string;
  message: string;
  meta?: Record<string, unknown>;
}

describe('PII-free logging (NFR-SEC-5)', () => {
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  let ownerId: string;

  function capturedAppLogs(): AppLogRecord[] {
    const lines = [logSpy, warnSpy, errorSpy].flatMap((spy) =>
      spy.mock.calls
        .map((call) => call[0])
        .filter((arg): arg is string => typeof arg === 'string')
    );

    return lines.flatMap((line) => {
      try {
        const parsed = JSON.parse(line) as AppLogRecord;
        return typeof parsed.level === 'string' ? [parsed] : [];
      } catch {
        return [];
      }
    });
  }

  beforeAll(async () => {
    const agent = request.agent(app);

    const registration = await agent
      .post('/api/v1/auth/register')
      .send({ fullName: FULL_NAME, email: EMAIL, password: PASSWORD });
    expect(registration.status).toBe(201);
    ownerId = registration.body.data.user.id;

    await agent
      .post('/api/v1/auth/register')
      .send({ fullName: FULL_NAME, email: EMAIL, password: PASSWORD });

    await agent.post('/api/v1/auth/login').send({ email: EMAIL, password: PASSWORD });
    await agent.post('/api/v1/auth/login').send({ email: EMAIL, password: WRONG_PASSWORD });

    const resume = await agent.post('/api/v1/resumes').send({
      title: 'Backend Engineer Resume',
      content: RESUME_CONTENT,
    });
    expect(resume.status).toBe(201);

    const job = await agent.post('/api/v1/jobs').send({
      title: 'Junior Backend Developer',
      company: 'FinTech Innovators Inc.',
      experienceLevel: 'JUNIOR',
      rawText: JOB_TEXT,
    });
    expect(job.status).toBe(201);

    const analysis = await agent.post('/api/v1/analyses').send({
      resumeId: resume.body.data.resume.id,
      jobTitle: 'Junior Backend Developer',
      company: 'FinTech Innovators Inc.',
      experienceLevel: 'JUNIOR',
      jobDescriptionText: JOB_TEXT,
    });
    expect(analysis.status).toBe(201);

    await agent.get('/api/v1/analyses/00000000-0000-0000-0000-000000000000');
    await agent.get('/api/v1/unknown-route');
  });

  afterAll(async () => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
    await deleteUsers([ownerId]);
    await disconnectDatabase();
  });

  it('captures application log records emitted during the request lifecycle', () => {
    const logs = capturedAppLogs();

    expect(logs.length).toBeGreaterThan(0);
    expect(logs.some((record) => record.level === 'warn')).toBe(true);
  });

  it('never writes passwords, emails, names, tokens, or resume bodies to logs', () => {
    const serialized = capturedAppLogs()
      .map((record) => JSON.stringify(record))
      .join('\n');

    expect(serialized).not.toContain(EMAIL);
    expect(serialized).not.toContain(PASSWORD);
    expect(serialized).not.toContain(WRONG_PASSWORD);
    expect(serialized).not.toContain(FULL_NAME);
    expect(serialized).not.toContain(RESUME_TOKEN);
    expect(serialized).not.toContain('passwordHash');
    expect(serialized).not.toMatch(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
  });

  it('still records useful, non-PII diagnostic context', () => {
    const serialized = capturedAppLogs()
      .map((record) => JSON.stringify(record))
      .join('\n');

    expect(serialized).toContain('Request rejected');
    expect(serialized).toContain('/api/v1/auth/login');
    expect(serialized).toContain('UNAUTHORIZED');
  });
});
