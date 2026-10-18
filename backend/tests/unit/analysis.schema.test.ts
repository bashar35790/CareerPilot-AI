import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  analysisIdParamSchema,
  createAnalysisSchema,
  listAnalysesQuerySchema,
} from '../../src/schemas/analysis.schema';

const RESUME_ID = 'e4f5a6b7-c8d9-0123-ef45-6789abcdef01';
const longResume = 'Experienced backend engineer. '.repeat(10);
const longJob = 'We are hiring a backend engineer proficient in Node.js and PostgreSQL. '.repeat(3);

const validInput = {
  resumeId: RESUME_ID,
  jobTitle: 'Junior Backend Developer',
  company: 'FinTech Innovators Inc.',
  jobDescriptionText: longJob,
};

function issuePaths(result: z.SafeParseReturnType<unknown, unknown>): string[] {
  if (result.success) {
    throw new Error('Expected the payload to fail validation');
  }
  return result.error.issues.map((issue) => issue.path.join('.'));
}

describe('createAnalysisSchema: happy path', () => {
  it('accepts a stored resume reference', () => {
    const result = createAnalysisSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('accepts inline resume content as an alternative to resumeId', () => {
    const result = createAnalysisSchema.safeParse({
      ...validInput,
      resumeId: undefined,
      resumeContent: longResume,
    });
    expect(result.success).toBe(true);
  });

  it('accepts an optional experience level', () => {
    const result = createAnalysisSchema.safeParse({ ...validInput, experienceLevel: 'JUNIOR' });
    expect(result.success).toBe(true);
    expect(result.success && result.data.experienceLevel).toBe('JUNIOR');
  });

  it('trims surrounding whitespace on job title and company', () => {
    const result = createAnalysisSchema.safeParse({
      ...validInput,
      jobTitle: '  Backend Developer  ',
      company: '  FinTech  ',
    });
    expect(result.success && result.data.jobTitle).toBe('Backend Developer');
    expect(result.success && result.data.company).toBe('FinTech');
  });
});

describe('createAnalysisSchema: resume source refinement', () => {
  it('rejects a payload with neither resumeId nor resumeContent', () => {
    const result = createAnalysisSchema.safeParse({
      jobTitle: validInput.jobTitle,
      company: validInput.company,
      jobDescriptionText: validInput.jobDescriptionText,
    });
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain('resumeId');
  });

  it('rejects a malformed resume identifier', () => {
    expect(createAnalysisSchema.safeParse({ ...validInput, resumeId: 'not-a-uuid' }).success).toBe(
      false
    );
  });

  it('enforces the 100 to 20000 character window for inline resume content', () => {
    expect(
      createAnalysisSchema.safeParse({ ...validInput, resumeId: undefined, resumeContent: 'too short' })
        .success
    ).toBe(false);
    expect(
      createAnalysisSchema.safeParse({
        ...validInput,
        resumeId: undefined,
        resumeContent: 'a'.repeat(20001),
      }).success
    ).toBe(false);
    expect(
      createAnalysisSchema.safeParse({
        ...validInput,
        resumeId: undefined,
        resumeContent: 'a'.repeat(100),
      }).success
    ).toBe(true);
  });
});

describe('createAnalysisSchema: field validation', () => {
  it('enforces job title bounds', () => {
    expect(createAnalysisSchema.safeParse({ ...validInput, jobTitle: 'A' }).success).toBe(false);
    expect(createAnalysisSchema.safeParse({ ...validInput, jobTitle: 'a'.repeat(151) }).success).toBe(
      false
    );
  });

  it('enforces company name bounds', () => {
    expect(createAnalysisSchema.safeParse({ ...validInput, company: 'A' }).success).toBe(false);
    expect(createAnalysisSchema.safeParse({ ...validInput, company: 'a'.repeat(151) }).success).toBe(
      false
    );
  });

  it('enforces the 100 to 20000 character window for the job description', () => {
    expect(createAnalysisSchema.safeParse({ ...validInput, jobDescriptionText: 'x'.repeat(99) }).success).toBe(false);
    expect(createAnalysisSchema.safeParse({ ...validInput, jobDescriptionText: 'x'.repeat(100) }).success).toBe(true);
    expect(createAnalysisSchema.safeParse({ ...validInput, jobDescriptionText: 'x'.repeat(20000) }).success).toBe(true);
    expect(createAnalysisSchema.safeParse({ ...validInput, jobDescriptionText: 'x'.repeat(20001) }).success).toBe(false);
  });

  it('rejects an unsupported experience level', () => {
    expect(createAnalysisSchema.safeParse({ ...validInput, experienceLevel: 'PRINCIPAL' }).success).toBe(
      false
    );
  });

  it('flags the correct path for a missing required field', () => {
    const { company, ...withoutCompany } = validInput;
    void company;
    const result = createAnalysisSchema.safeParse(withoutCompany);
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain('company');
  });
});

describe('analysisIdParamSchema', () => {
  it('accepts a valid uuid', () => {
    expect(analysisIdParamSchema.safeParse({ id: RESUME_ID }).success).toBe(true);
  });

  it('rejects a non-uuid identifier', () => {
    const result = analysisIdParamSchema.safeParse({ id: 'abc123' });
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain('id');
  });
});

describe('listAnalysesQuerySchema', () => {
  it('applies default pagination values', () => {
    const result = listAnalysesQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    expect(result.success && result.data).toEqual({ page: 1, limit: 10 });
  });

  it('coerces string query parameters into numbers', () => {
    const result = listAnalysesQuerySchema.safeParse({ page: '3', limit: '25' });
    expect(result.success && result.data).toEqual({ page: 3, limit: 25 });
  });

  it('rejects a page below 1 and a limit above 50', () => {
    expect(listAnalysesQuerySchema.safeParse({ page: 0 }).success).toBe(false);
    expect(listAnalysesQuerySchema.safeParse({ limit: 51 }).success).toBe(false);
  });

  it('rejects non-numeric pagination values', () => {
    expect(listAnalysesQuerySchema.safeParse({ page: 'abc' }).success).toBe(false);
  });
});
