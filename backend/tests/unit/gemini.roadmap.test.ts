import { describe, expect, it, vi } from 'vitest';
import {
  FALLBACK_MODEL,
  PRIMARY_MODEL,
  buildRoadmapPrompt,
  generateCareerRoadmap,
  type GeminiClientLike,
} from '../../src/lib/gemini';
import { roadmapGenerationResponseSchema } from '../../src/schemas/ai-response.schema';

const validPayload = {
  phases: [
    {
      phaseNumber: 1,
      phaseTitle: 'Phase 1: Data Layer Foundations',
      tasks: [
        {
          title: 'Master Prisma ORM',
          description: 'Build a CRUD service with Prisma and PostgreSQL to practice schema design.',
        },
      ],
    },
    {
      phaseNumber: 2,
      phaseTitle: 'Phase 2: DevOps Readiness',
      tasks: [
        {
          title: 'Containerize a service with Docker',
          description: 'Ship a multi-stage Docker build for an existing Express API.',
        },
      ],
    },
  ],
};

const request = {
  targetRole: 'Backend Engineer',
  timeframe: '6 Months',
  experienceLevel: 'JUNIOR',
  jobTitle: 'Junior Backend Developer',
  summary: 'Strong alignment with Node.js; gaps in database tooling and containerization.',
  missingRequiredSkills: [
    {
      name: 'Prisma',
      category: 'TOOL',
      relevance: 'HIGH',
      contextualNote: 'Required for the ORM data layer.',
    },
  ],
  missingPreferredSkills: [{ name: 'Docker', category: 'DEVOPS', relevance: 'MEDIUM' }],
};

function clientWith(generateContent: ReturnType<typeof vi.fn>): GeminiClientLike {
  return { models: { generateContent } } as unknown as GeminiClientLike;
}

const fastOptions = { baseDelayMs: 0, sleep: async () => {} };

describe('buildRoadmapPrompt', () => {
  it('wraps untrusted gaps and context in XML delimiters', () => {
    const prompt = buildRoadmapPrompt(request);
    expect(prompt).toContain('<candidate_context>');
    expect(prompt).toContain('</candidate_context>');
    expect(prompt).toContain('<skill_gaps>');
    expect(prompt).toContain('</skill_gaps>');
    expect(prompt).toContain('MISSING_REQUIRED:');
    expect(prompt).toContain('MISSING_PREFERRED:');
    expect(prompt).toContain('Backend Engineer');
    expect(prompt).toContain('6 Months');
  });

  it('renders a placeholder when no gaps are supplied', () => {
    const prompt = buildRoadmapPrompt({
      ...request,
      missingRequiredSkills: [],
      missingPreferredSkills: [],
    });
    expect(prompt).toContain('- None identified.');
  });
});

describe('generateCareerRoadmap', () => {
  it('parses and validates a structured roadmap response', async () => {
    const generateContent = vi.fn().mockResolvedValue({ text: JSON.stringify(validPayload) });

    const result = await generateCareerRoadmap(request, {
      client: clientWith(generateContent),
      ...fastOptions,
    });

    expect(result.phases).toHaveLength(2);
    expect(result.phases[0].tasks[0].title).toBe('Master Prisma ORM');
    expect(roadmapGenerationResponseSchema.safeParse(result).success).toBe(true);
  });

  it('tolerates markdown code-fenced JSON', async () => {
    const generateContent = vi
      .fn()
      .mockResolvedValue({ text: `\`\`\`json\n${JSON.stringify(validPayload)}\n\`\`\`` });

    const result = await generateCareerRoadmap(request, {
      client: clientWith(generateContent),
      ...fastOptions,
    });

    expect(result.phases).toHaveLength(2);
  });

  it('configures the model call with the roadmap response schema and system instruction', async () => {
    const generateContent = vi.fn().mockResolvedValue({ text: JSON.stringify(validPayload) });

    await generateCareerRoadmap(request, { client: clientWith(generateContent), ...fastOptions });

    const params = generateContent.mock.calls[0][0];
    expect(params.model).toBe(PRIMARY_MODEL);
    expect(params.config.responseMimeType).toBe('application/json');
    expect(params.config.responseSchema).toBeTruthy();
    expect(params.config.temperature).toBe(0.2);
    expect(params.config.systemInstruction).toContain('career coach');
  });

  it('rotates to the fallback model when the primary is rate limited', async () => {
    const rateLimit = Object.assign(new Error('RESOURCE_EXHAUSTED'), { status: 429 });
    const generateContent = vi
      .fn()
      .mockRejectedValueOnce(rateLimit)
      .mockResolvedValueOnce({ text: JSON.stringify(validPayload) });

    const result = await generateCareerRoadmap(request, {
      client: clientWith(generateContent),
      ...fastOptions,
    });

    expect(result.phases).toHaveLength(2);
    expect(generateContent.mock.calls[0][0].model).toBe(PRIMARY_MODEL);
    expect(generateContent.mock.calls[1][0].model).toBe(FALLBACK_MODEL);
  });

  it('rejects responses that violate the roadmap contract', async () => {
    const generateContent = vi.fn().mockResolvedValue({ text: '{"phases":[]}' });

    await expect(
      generateCareerRoadmap(request, {
        client: clientWith(generateContent),
        maxRetries: 1,
        ...fastOptions,
      })
    ).rejects.toMatchObject({ code: 'AI_RESPONSE_INVALID' });

    expect(generateContent).toHaveBeenCalledTimes(3);
  });

  it('rejects malformed JSON with an AI response error', async () => {
    const generateContent = vi.fn().mockResolvedValue({ text: 'not json at all' });

    await expect(
      generateCareerRoadmap(request, {
        client: clientWith(generateContent),
        maxRetries: 0,
        ...fastOptions,
      })
    ).rejects.toMatchObject({ code: 'AI_RESPONSE_INVALID' });
  });
});
