import { describe, expect, it } from 'vitest';
import { generateResumeAnalysis } from '../../src/lib/gemini';
import { resumeAnalysisResponseSchema } from '../../src/schemas/ai-response.schema';

const apiKey = process.env.GEMINI_API_KEY ?? '';
const hasLiveKey = apiKey.length > 0 && !apiKey.startsWith('your_');

describe.skipIf(!hasLiveKey)('Gemini live integration', () => {
  it(
    'returns a schema-valid analysis for a real resume/job pair',
    async () => {
      const result = await generateResumeAnalysis({
        resumeText:
          'Junior full-stack developer with two years of experience building web apps using TypeScript, React, Node.js, Express and PostgreSQL. Containerized services with Docker and wrote automated tests with Jest.',
        jobTitle: 'Junior Full-Stack Developer',
        company: 'FinTech Innovators Inc.',
        jobDescriptionText:
          'We are hiring a Junior Full-Stack Developer proficient in Node.js, Express, PostgreSQL and React. Experience with Docker and automated testing is a plus.',
        experienceLevel: 'JUNIOR',
      });

      expect(resumeAnalysisResponseSchema.safeParse(result).success).toBe(true);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    },
    60000
  );
});
