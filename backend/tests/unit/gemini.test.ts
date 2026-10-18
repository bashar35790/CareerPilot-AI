import { describe, expect, it, vi } from 'vitest';
import {
  FALLBACK_MODEL,
  PRIMARY_MODEL,
  buildAnalysisPrompt,
  generateResumeAnalysis,
  isRateLimitError,
  stripCodeFences,
  type GeminiClientLike,
} from '../../src/lib/gemini';
import { resumeAnalysisResponseSchema } from '../../src/schemas/ai-response.schema';

const validPayload = {
  overallScore: 82,
  skillScore: 85,
  experienceScore: 78,
  summary: 'Strong alignment with the target role across core backend engineering skills.',
  matchedSkills: [
    {
      name: 'PostgreSQL',
      category: 'DATABASE',
      relevance: 'HIGH',
      evidenceFromResume: 'Built REST APIs backed by PostgreSQL.',
    },
  ],
  missingRequiredSkills: [
    {
      name: 'Kubernetes',
      category: 'DEVOPS',
      relevance: 'HIGH',
      contextualNote: 'Required for deploying containerized services.',
    },
  ],
  missingPreferredSkills: [],
  recommendations: [
    {
      category: 'BULLET_POINT_REWRITE',
      priority: 'HIGH',
      original: 'Worked on APIs.',
      improved: 'Accomplished X as measured by Y by doing Z.',
      rationale: 'Quantifies engineering impact.',
    },
  ],
};

const request = {
  resumeText: 'Backend engineer with PostgreSQL and Node.js experience.',
  jobTitle: 'Backend Developer',
  company: 'FinTech Innovators Inc.',
  jobDescriptionText: 'Looking for a Backend Developer proficient in Node.js and PostgreSQL.',
  experienceLevel: 'JUNIOR',
};

function clientWith(generateContent: ReturnType<typeof vi.fn>): GeminiClientLike {
  return { models: { generateContent } } as unknown as GeminiClientLike;
}

const fastOptions = { baseDelayMs: 0, sleep: async () => {} };

describe('stripCodeFences', () => {
  it('removes ```json fences', () => {
    expect(stripCodeFences('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it('removes bare ``` fences', () => {
    expect(stripCodeFences('```\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it('leaves plain JSON untouched', () => {
    expect(stripCodeFences('  {"a":1}  ')).toBe('{"a":1}');
  });
});

describe('isRateLimitError', () => {
  it('detects HTTP 429 status codes', () => {
    expect(isRateLimitError(Object.assign(new Error('boom'), { status: 429 }))).toBe(true);
  });

  it('detects RESOURCE_EXHAUSTED messages', () => {
    expect(isRateLimitError(new Error('RESOURCE_EXHAUSTED: quota exceeded'))).toBe(true);
  });

  it('ignores unrelated errors', () => {
    expect(isRateLimitError(new Error('Internal Server Error'))).toBe(false);
    expect(isRateLimitError('not an error')).toBe(false);
  });
});

describe('buildAnalysisPrompt', () => {
  it('wraps untrusted inputs in XML delimiters', () => {
    const prompt = buildAnalysisPrompt(request);
    expect(prompt).toContain('<resume_content>');
    expect(prompt).toContain('</resume_content>');
    expect(prompt).toContain('<job_description>');
    expect(prompt).toContain(request.jobTitle);
    expect(prompt).toContain('JUNIOR');
  });
});

describe('generateResumeAnalysis', () => {
  it('parses and validates a structured JSON response', async () => {
    const generateContent = vi.fn().mockResolvedValue({ text: JSON.stringify(validPayload) });

    const result = await generateResumeAnalysis(request, {
      client: clientWith(generateContent),
      ...fastOptions,
    });

    expect(result).toMatchObject({ overallScore: 82, skillScore: 85, experienceScore: 78 });
    expect(resumeAnalysisResponseSchema.safeParse(result).success).toBe(true);
  });

  it('tolerates markdown code-fenced JSON', async () => {
    const generateContent = vi
      .fn()
      .mockResolvedValue({ text: `\`\`\`json\n${JSON.stringify(validPayload)}\n\`\`\`` });

    const result = await generateResumeAnalysis(request, {
      client: clientWith(generateContent),
      ...fastOptions,
    });

    expect(result.matchedSkills[0].name).toBe('PostgreSQL');
  });

  it('configures the model call with the JSON response schema and system instruction', async () => {
    const generateContent = vi.fn().mockResolvedValue({ text: JSON.stringify(validPayload) });

    await generateResumeAnalysis(request, { client: clientWith(generateContent), ...fastOptions });

    const params = generateContent.mock.calls[0][0];
    expect(params.model).toBe(PRIMARY_MODEL);
    expect(params.config.responseMimeType).toBe('application/json');
    expect(params.config.responseSchema).toBeTruthy();
    expect(params.config.temperature).toBe(0.2);
    expect(params.config.systemInstruction).toContain('principal technical recruiter');
  });

  it('rotates to the fallback model when the primary is rate limited', async () => {
    const rateLimit = Object.assign(new Error('RESOURCE_EXHAUSTED'), { status: 429 });
    const generateContent = vi
      .fn()
      .mockRejectedValueOnce(rateLimit)
      .mockResolvedValueOnce({ text: JSON.stringify(validPayload) });

    const result = await generateResumeAnalysis(request, {
      client: clientWith(generateContent),
      ...fastOptions,
    });

    expect(result.overallScore).toBe(82);
    expect(generateContent.mock.calls[0][0].model).toBe(PRIMARY_MODEL);
    expect(generateContent.mock.calls[1][0].model).toBe(FALLBACK_MODEL);
  });

  it('rejects responses that violate the schema contract', async () => {
    const generateContent = vi.fn().mockResolvedValue({ text: '{"overallScore":"oops"}' });

    await expect(
      generateResumeAnalysis(request, {
        client: clientWith(generateContent),
        maxRetries: 1,
        ...fastOptions,
      })
    ).rejects.toMatchObject({ code: 'AI_RESPONSE_INVALID' });

    // primary (1 attempt) + fallback (maxRetries + 1 attempts)
    expect(generateContent).toHaveBeenCalledTimes(3);
  });

  it('rejects malformed JSON with an AI response error', async () => {
    const generateContent = vi.fn().mockResolvedValue({ text: 'not json at all' });

    await expect(
      generateResumeAnalysis(request, {
        client: clientWith(generateContent),
        maxRetries: 0,
        ...fastOptions,
      })
    ).rejects.toMatchObject({ code: 'AI_RESPONSE_INVALID' });
  });
});
