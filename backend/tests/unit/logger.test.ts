import { afterEach, describe, expect, it, vi } from 'vitest';
import { logger } from '../../src/lib/logger';

describe('logger PII redaction', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns primitive values unchanged', () => {
    expect(logger.redact('plain')).toBe('plain');
    expect(logger.redact(42)).toBe(42);
    expect(logger.redact(true)).toBe(true);
    expect(logger.redact(null)).toBe(null);
    expect(logger.redact(undefined)).toBe(undefined);
  });

  it('redacts every sensitive PII key at the top level', () => {
    const result = logger.redact({
      password: 'PiiPassword123!',
      passwordHash: '$2a$10$abc',
      token: 'abc',
      accessToken: 'abc',
      refreshToken: 'abc',
      authorization: 'Bearer abc',
      cookie: 'access_token=abc',
      content: 'Senior engineer resume body',
      rawText: 'Job description body',
      email: 'candidate@example.com',
      secret: 'shhh',
      apiKey: 'key-123',
    });

    expect(result).toEqual({
      password: '[REDACTED]',
      passwordHash: '[REDACTED]',
      token: '[REDACTED]',
      accessToken: '[REDACTED]',
      refreshToken: '[REDACTED]',
      authorization: '[REDACTED]',
      cookie: '[REDACTED]',
      content: '[REDACTED]',
      rawText: '[REDACTED]',
      email: '[REDACTED]',
      secret: '[REDACTED]',
      apiKey: '[REDACTED]',
    });
  });

  it('preserves non-sensitive diagnostic fields', () => {
    const result = logger.redact({
      userId: '6f3d-uuid',
      method: 'POST',
      url: '/api/v1/auth/login',
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });

    expect(result).toEqual({
      userId: '6f3d-uuid',
      method: 'POST',
      url: '/api/v1/auth/login',
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  });

  it('matches sensitive keys case-insensitively', () => {
    const result = logger.redact({
      Password: 'secret',
      EMAIL: 'candidate@example.com',
      RefreshToken: 'abc',
    });

    expect(result).toEqual({
      Password: '[REDACTED]',
      EMAIL: '[REDACTED]',
      RefreshToken: '[REDACTED]',
    });
  });

  it('redacts nested objects and arrays of objects', () => {
    const result = logger.redact({
      user: { id: 'u1', email: 'candidate@example.com' },
      sessions: [{ token: 'abc', expiresIn: 900 }],
    });

    expect(result).toEqual({
      user: { id: 'u1', email: '[REDACTED]' },
      sessions: [{ token: '[REDACTED]', expiresIn: 900 }],
    });
  });

  it('guards against circular references', () => {
    const node: Record<string, unknown> = { id: 'u1', email: 'candidate@example.com' };
    node.self = node;

    const result = logger.redact(node) as Record<string, unknown>;

    expect(result.email).toBe('[REDACTED]');
    expect(result.self).toBe('[Circular]');
  });

  it('writes structured JSON records with redacted metadata at every level', () => {
    const infoSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logger.info('Session created', { email: 'candidate@example.com', userId: 'u1' });
    logger.warn('Rejected request', { authorization: 'Bearer leaked', statusCode: 401 });
    logger.error('Failure', { content: 'Resume body', code: 'INTERNAL_SERVER_ERROR' });

    const info = JSON.parse(infoSpy.mock.calls[0][0] as string);
    const warn = JSON.parse(warnSpy.mock.calls[0][0] as string);
    const error = JSON.parse(errorSpy.mock.calls[0][0] as string);

    expect(info).toMatchObject({ level: 'info', message: 'Session created' });
    expect(info.meta).toEqual({ email: '[REDACTED]', userId: 'u1' });
    expect(info.timestamp).toEqual(expect.any(String));

    expect(warn.meta).toEqual({ authorization: '[REDACTED]', statusCode: 401 });
    expect(error.meta).toEqual({ content: '[REDACTED]', code: 'INTERNAL_SERVER_ERROR' });
  });
});
