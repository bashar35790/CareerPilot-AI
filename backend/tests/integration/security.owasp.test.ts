import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import app from '../../src/index';
import { env } from '../../src/config/env';
import { prisma } from '../../src/lib/prisma';
import { deleteUsers, disconnectDatabase } from '../helpers/db';
import { TEST_PASSWORD, TestUser, registerTestUser } from '../helpers/session';

const SQLI_PAYLOAD = `Robert'); DROP TABLE "Resume";--`;
const SQLI_JOB_PAYLOAD = `1' UNION SELECT password_hash FROM "User"-- ${'A'.repeat(120)}`;
const XSS_PAYLOAD = `<script>alert('xss')</script><img src=x onerror="alert(1)">`;

const REPO_ROOT = path.resolve(process.cwd(), '..');
const FRONTEND_SRC = path.join(REPO_ROOT, 'frontend', 'src');
const FRONTEND_PACKAGE_JSON = path.join(REPO_ROOT, 'frontend', 'package.json');

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const absolute = path.join(directory, entry);
    return statSync(absolute).isDirectory()
      ? collectSourceFiles(absolute)
      : [absolute];
  });
}

describe('OWASP Top 10 security verification', () => {
  let owner: TestUser;
  const extraUserIds: string[] = [];

  beforeAll(async () => {
    owner = await registerTestUser('owasp');
  });

  afterAll(async () => {
    await deleteUsers([owner.id, ...extraUserIds]);
    await disconnectDatabase();
  });

  describe('A01 - Broken access control', () => {
    it('rejects unauthenticated requests to protected resources with 401', async () => {
      const [resumes, jobs, analyses, roadmaps, me] = await Promise.all([
        request(app).get('/api/v1/resumes'),
        request(app).get('/api/v1/jobs'),
        request(app).get('/api/v1/analyses'),
        request(app).get('/api/v1/roadmaps'),
        request(app).get('/api/v1/auth/me'),
      ]);

      for (const response of [resumes, jobs, analyses, roadmaps, me]) {
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      }
    });
  });

  describe('A02 / A07 - Identification, authentication & credential protection', () => {
    it('issues HttpOnly, SameSite=Lax cookies for session state', async () => {
      const login = await request(app).post('/api/v1/auth/login').send({
        email: owner.email,
        password: TEST_PASSWORD,
      });

      expect(login.status).toBe(200);

      const setCookie = login.headers['set-cookie'];
      const cookieHeader = Array.isArray(setCookie)
        ? setCookie.join('; ')
        : String(setCookie ?? '');

      expect(cookieHeader).toContain('access_token=');
      expect(cookieHeader).toContain('refresh_token=');
      expect(cookieHeader).toMatch(/HttpOnly/i);
      expect(cookieHeader).toMatch(/SameSite=Lax/i);
      expect(cookieHeader).toMatch(/Path=\//i);
    });

    it('never returns raw tokens or password hashes in JSON responses', async () => {
      const login = await request(app).post('/api/v1/auth/login').send({
        email: owner.email,
        password: TEST_PASSWORD,
      });

      const serialized = JSON.stringify(login.body);
      expect(serialized).not.toMatch(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\./);
      expect(serialized).not.toContain('access_token');
      expect(serialized).not.toContain('refresh_token');
      expect(login.body.data.user.passwordHash).toBeUndefined();
      expect(login.body.data.user.password).toBeUndefined();
      expect(login.body.data.accessToken).toBeUndefined();
      expect(login.body.data.refreshToken).toBeUndefined();
    });

    it('stores the password as a bcrypt hash and rejects a forged bearer token', async () => {
      const persisted = await prisma.user.findUniqueOrThrow({ where: { id: owner.id } });
      expect(persisted.passwordHash).not.toBe(TEST_PASSWORD);
      expect(persisted.passwordHash).toMatch(/^\$2[aby]\$/);

      const forged = await request(app)
        .get('/api/v1/resumes')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiJ9.forged.signature');

      expect(forged.status).toBe(401);
    });
  });

  describe('A03 - Injection (SQL injection via Prisma parameterized queries)', () => {
    it('treats SQL metacharacters as literal data on register and login', async () => {
      const email = `owasp.sqli.${Date.now()}@example.com`;
      const response = await request(app).post('/api/v1/auth/register').send({
        fullName: `Robert'); DROP TABLE "User";--`,
        email,
        password: TEST_PASSWORD,
      });

      expect(response.status).toBe(201);
      extraUserIds.push(response.body.data.user.id);

      const persisted = await prisma.user.findUniqueOrThrow({ where: { email } });
      expect(persisted.fullName).toBe(`Robert'); DROP TABLE "User";--`);

      await expect(prisma.user.count()).resolves.toBeGreaterThanOrEqual(1);
    });

    it('short-circuits classic SQL auth bypass payloads at the validation layer', async () => {
      const bypass = await request(app).post('/api/v1/auth/login').send({
        email: "admin' OR '1'='1@example.com",
        password: 'anything',
      });

      expect(bypass.status).toBe(400);
      expect(bypass.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('persists SQL metacharacters in resumes and jobs verbatim without executing them', async () => {
      const resume = await owner.agent.post('/api/v1/resumes').send({
        title: SQLI_PAYLOAD,
        content: `${SQLI_PAYLOAD} ${'safe-padding. '.repeat(12)}`,
      });
      expect(resume.status).toBe(201);
      expect(resume.body.data.resume.title).toBe(SQLI_PAYLOAD);

      const job = await owner.agent.post('/api/v1/jobs').send({
        title: 'Junior Backend Developer',
        company: 'FinTech Innovators Inc.',
        rawText: SQLI_JOB_PAYLOAD,
      });
      expect(job.status).toBe(201);
      expect(job.body.data.job.rawText).toBe(SQLI_JOB_PAYLOAD);

      const storedResume = await prisma.resume.findFirstOrThrow({
        where: { userId: owner.id, title: SQLI_PAYLOAD },
      });
      const storedJob = await prisma.jobDescription.findFirstOrThrow({
        where: { userId: owner.id, rawText: SQLI_JOB_PAYLOAD },
      });

      expect(storedResume.title).toBe(SQLI_PAYLOAD);
      expect(storedJob.rawText).toBe(SQLI_JOB_PAYLOAD);
      await expect(prisma.resume.count()).resolves.toBeGreaterThanOrEqual(1);
      await expect(prisma.jobDescription.count()).resolves.toBeGreaterThanOrEqual(1);
    });
  });

  describe('A03 - Injection (XSS protection)', () => {
    it('stores XSS payloads as inert data and always responds with JSON', async () => {
      const response = await owner.agent.post('/api/v1/resumes').send({
        title: `XSS <script>alert('t')</script>`,
        content: `${XSS_PAYLOAD} ${'legit resume text. '.repeat(8)}`,
      });

      expect(response.status).toBe(201);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.body.data.resume.title).toBe(`XSS <script>alert('t')</script>`);
      expect(response.body.data.resume.content).toContain(XSS_PAYLOAD);

      const read = await owner.agent.get(`/api/v1/resumes/${response.body.data.resume.id}`);
      expect(read.status).toBe(200);
      expect(read.headers['content-type']).toMatch(/application\/json/);
      expect(read.body.data.resume.content).toContain(XSS_PAYLOAD);
    });

    it('does not reflect injected markup as an executable HTML response', async () => {
      const response = await request(app).get(
        '/api/v1/does-not-exist?next=<script>alert(1)</script>'
      );

      expect(response.status).toBe(404);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.text).not.toContain('<script>alert(1)</script>');
    });
  });

  describe('A05 - Security misconfiguration', () => {
    it('applies hardened Helmet response headers and hides server fingerprint', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.status).toBe(200);
      expect(response.headers['x-powered-by']).toBeUndefined();
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['strict-transport-security']).toBeDefined();
    });
  });

  describe('A05 / NFR-SEC-2 - CSRF & CORS defense', () => {
    it('restricts CORS to the configured frontend origin with credentials', async () => {
      const allowed = await request(app)
        .options('/api/v1/auth/login')
        .set('Origin', env.FRONTEND_URL)
        .set('Access-Control-Request-Method', 'POST');

      expect(allowed.headers['access-control-allow-origin']).toBe(env.FRONTEND_URL);
      expect(allowed.headers['access-control-allow-credentials']).toBe('true');

      const evil = await request(app)
        .get('/api/v1/health')
        .set('Origin', 'https://evil.example.com');

      expect(evil.headers['access-control-allow-origin']).not.toBe('https://evil.example.com');
      expect(evil.headers['access-control-allow-origin']).toBe(env.FRONTEND_URL);
    });
  });

  describe('NFR-SEC-1 / NFR-SEC-3 - No client-side token or secret exposure', () => {
    it('never stores tokens or credentials in localStorage or sessionStorage', () => {
      expect(existsSync(FRONTEND_SRC)).toBe(true);

      const offenders = collectSourceFiles(FRONTEND_SRC).filter((file) =>
        /localStorage|sessionStorage/.test(readFileSync(file, 'utf8'))
      );

      expect(offenders).toEqual([]);
    });

    it('does not render untrusted HTML in the frontend and ships no AI credentials', () => {
      const htmlInjection = collectSourceFiles(FRONTEND_SRC).filter((file) =>
        /dangerouslySetInnerHTML/.test(readFileSync(file, 'utf8'))
      );
      expect(htmlInjection).toEqual([]);

      const packageJson = JSON.parse(readFileSync(FRONTEND_PACKAGE_JSON, 'utf8')) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      expect(dependencies['@google/genai']).toBeUndefined();
      expect(dependencies['@google/generative-ai']).toBeUndefined();
    });
  });
});
