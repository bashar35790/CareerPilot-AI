import type { SkillCategory } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface CanonicalSkill {
  id: string;
  name: string;
  normalizedName: string;
  category: SkillCategory;
}

export interface ExtractedSkill extends CanonicalSkill {
  occurrences: number;
}

export interface DeterministicMatchResult {
  resumeSkills: ExtractedSkill[];
  jobSkills: ExtractedSkill[];
  matchedSkills: ExtractedSkill[];
  missingRequiredCandidates: ExtractedSkill[];
  additionalResumeSkills: ExtractedSkill[];
  deterministicSkillScore: number;
}

type SkillDefinition = Omit<CanonicalSkill, 'id'>;

export const CANONICAL_SKILLS: readonly SkillDefinition[] = [
  // Languages
  { name: 'TypeScript', normalizedName: 'typescript', category: 'LANGUAGE' },
  { name: 'JavaScript', normalizedName: 'javascript', category: 'LANGUAGE' },
  { name: 'Python', normalizedName: 'python', category: 'LANGUAGE' },
  { name: 'Java', normalizedName: 'java', category: 'LANGUAGE' },
  { name: 'C#', normalizedName: 'csharp', category: 'LANGUAGE' },
  { name: 'C++', normalizedName: 'cpp', category: 'LANGUAGE' },
  { name: 'C', normalizedName: 'c', category: 'LANGUAGE' },
  { name: 'Go', normalizedName: 'go', category: 'LANGUAGE' },
  { name: 'Rust', normalizedName: 'rust', category: 'LANGUAGE' },
  { name: 'PHP', normalizedName: 'php', category: 'LANGUAGE' },
  { name: 'Ruby', normalizedName: 'ruby', category: 'LANGUAGE' },
  { name: 'Kotlin', normalizedName: 'kotlin', category: 'LANGUAGE' },
  { name: 'Swift', normalizedName: 'swift', category: 'LANGUAGE' },
  { name: 'SQL', normalizedName: 'sql', category: 'LANGUAGE' },
  { name: 'HTML', normalizedName: 'html', category: 'LANGUAGE' },
  { name: 'CSS', normalizedName: 'css', category: 'LANGUAGE' },
  { name: 'Bash', normalizedName: 'bash', category: 'LANGUAGE' },

  // Frameworks & Libraries
  { name: 'React', normalizedName: 'react', category: 'FRAMEWORK' },
  { name: 'Next.js', normalizedName: 'nextjs', category: 'FRAMEWORK' },
  { name: 'Angular', normalizedName: 'angular', category: 'FRAMEWORK' },
  { name: 'Vue.js', normalizedName: 'vuejs', category: 'FRAMEWORK' },
  { name: 'Node.js', normalizedName: 'nodejs', category: 'FRAMEWORK' },
  { name: 'Express', normalizedName: 'express', category: 'FRAMEWORK' },
  { name: 'NestJS', normalizedName: 'nestjs', category: 'FRAMEWORK' },
  { name: 'Django', normalizedName: 'django', category: 'FRAMEWORK' },
  { name: 'Flask', normalizedName: 'flask', category: 'FRAMEWORK' },
  { name: 'Spring Boot', normalizedName: 'springboot', category: 'FRAMEWORK' },
  { name: '.NET', normalizedName: 'dotnet', category: 'FRAMEWORK' },
  { name: 'Tailwind CSS', normalizedName: 'tailwindcss', category: 'FRAMEWORK' },
  { name: 'jQuery', normalizedName: 'jquery', category: 'FRAMEWORK' },
  { name: 'FastAPI', normalizedName: 'fastapi', category: 'FRAMEWORK' },

  // Databases & ORMs
  { name: 'PostgreSQL', normalizedName: 'postgresql', category: 'DATABASE' },
  { name: 'MySQL', normalizedName: 'mysql', category: 'DATABASE' },
  { name: 'MongoDB', normalizedName: 'mongodb', category: 'DATABASE' },
  { name: 'Redis', normalizedName: 'redis', category: 'DATABASE' },
  { name: 'SQLite', normalizedName: 'sqlite', category: 'DATABASE' },
  { name: 'SQL Server', normalizedName: 'sqlserver', category: 'DATABASE' },
  { name: 'Oracle', normalizedName: 'oracle', category: 'DATABASE' },
  { name: 'DynamoDB', normalizedName: 'dynamodb', category: 'DATABASE' },
  { name: 'Prisma', normalizedName: 'prisma', category: 'DATABASE' },

  // DevOps & Cloud
  { name: 'Docker', normalizedName: 'docker', category: 'DEVOPS' },
  { name: 'Kubernetes', normalizedName: 'kubernetes', category: 'DEVOPS' },
  { name: 'AWS', normalizedName: 'aws', category: 'DEVOPS' },
  { name: 'Azure', normalizedName: 'azure', category: 'DEVOPS' },
  { name: 'Google Cloud', normalizedName: 'gcp', category: 'DEVOPS' },
  { name: 'CI/CD', normalizedName: 'cicd', category: 'DEVOPS' },
  { name: 'Terraform', normalizedName: 'terraform', category: 'DEVOPS' },
  { name: 'Jenkins', normalizedName: 'jenkins', category: 'DEVOPS' },
  { name: 'GitHub Actions', normalizedName: 'githubactions', category: 'DEVOPS' },
  { name: 'Nginx', normalizedName: 'nginx', category: 'DEVOPS' },
  { name: 'Linux', normalizedName: 'linux', category: 'DEVOPS' },

  // Concepts
  { name: 'REST', normalizedName: 'rest', category: 'CONCEPT' },
  { name: 'GraphQL', normalizedName: 'graphql', category: 'CONCEPT' },
  { name: 'Microservices', normalizedName: 'microservices', category: 'CONCEPT' },
  { name: 'OOP', normalizedName: 'oop', category: 'CONCEPT' },
  { name: 'Data Structures', normalizedName: 'datastructures', category: 'CONCEPT' },
  { name: 'Algorithms', normalizedName: 'algorithms', category: 'CONCEPT' },
  { name: 'System Design', normalizedName: 'systemdesign', category: 'CONCEPT' },
  { name: 'Agile', normalizedName: 'agile', category: 'CONCEPT' },
  { name: 'TDD', normalizedName: 'tdd', category: 'CONCEPT' },
  { name: 'Authentication', normalizedName: 'authentication', category: 'CONCEPT' },
  { name: 'JWT', normalizedName: 'jwt', category: 'CONCEPT' },

  // Tools
  { name: 'Git', normalizedName: 'git', category: 'TOOL' },
  { name: 'GitHub', normalizedName: 'github', category: 'TOOL' },
  { name: 'GitLab', normalizedName: 'gitlab', category: 'TOOL' },
  { name: 'Jira', normalizedName: 'jira', category: 'TOOL' },
  { name: 'Postman', normalizedName: 'postman', category: 'TOOL' },
  { name: 'Webpack', normalizedName: 'webpack', category: 'TOOL' },
  { name: 'Vite', normalizedName: 'vite', category: 'TOOL' },
  { name: 'Jest', normalizedName: 'jest', category: 'TOOL' },
  { name: 'Vitest', normalizedName: 'vitest', category: 'TOOL' },
  { name: 'Redux', normalizedName: 'redux', category: 'TOOL' },
  { name: 'Figma', normalizedName: 'figma', category: 'TOOL' },
];

export const SKILL_ALIASES: Readonly<Record<string, readonly string[]>> = {
  javascript: ['ecmascript'],
  python: ['py'],
  csharp: ['c#'],
  cpp: ['c++'],
  go: ['golang'],
  html: ['html5'],
  css: ['css3'],
  bash: ['shell', 'shell scripting'],
  react: ['react.js', 'reactjs'],
  nextjs: ['next.js'],
  vuejs: ['vue.js', 'vue'],
  nodejs: ['node.js', 'node'],
  express: ['express.js'],
  nestjs: ['nest.js'],
  springboot: ['spring boot', 'spring'],
  dotnet: ['dotnet', '.net core', 'asp.net core', 'net core'],
  tailwindcss: ['tailwind', 'tailwind css'],
  postgresql: ['postgres', 'psql'],
  mongodb: ['mongo'],
  sqlserver: ['mssql', 'microsoft sql server'],
  prisma: ['prisma orm'],
  kubernetes: ['k8s'],
  aws: ['amazon web services'],
  azure: ['microsoft azure'],
  gcp: ['google cloud platform'],
  cicd: ['ci/cd', 'continuous integration', 'continuous delivery', 'continuous deployment'],
  githubactions: ['github actions'],
  rest: ['restful', 'rest api', 'restful api'],
  microservices: ['microservice', 'micro-services', 'micro services'],
  oop: ['object-oriented programming', 'object oriented programming'],
  datastructures: ['data structures', 'data structure'],
  systemdesign: ['system design'],
  agile: ['scrum'],
  tdd: ['test driven development', 'test-driven development'],
  authentication: ['authn'],
  jwt: ['json web token', 'json web tokens'],
};

const AMBIGUOUS_CASE_SENSITIVE = new Set(['go', 'c', 'r']);

// A token boundary is any character that is not a letter, digit, or one of the
// compound-skill characters `+` / `#` (so "C" never matches inside "C++" or "C#").
const BOUNDARY_CLASS = 'A-Za-z0-9+#';

export interface SkillToken {
  value: string;
  caseSensitive: boolean;
}

export interface SkillMatcher {
  extract(text: string): ExtractedSkill[];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function boundaryPattern(value: string, caseSensitive: boolean): RegExp {
  const escaped = escapeRegExp(value);
  const flags = caseSensitive ? 'g' : 'gi';
  return new RegExp(`(?<![${BOUNDARY_CLASS}])${escaped}(?![${BOUNDARY_CLASS}])`, flags);
}

export function resolveSkillTokens(skill: CanonicalSkill): SkillToken[] {
  const candidates = new Set<string>([skill.name, skill.normalizedName]);
  for (const alias of SKILL_ALIASES[skill.normalizedName] ?? []) {
    candidates.add(alias);
  }

  const seen = new Set<string>();
  const tokens: SkillToken[] = [];

  for (const value of candidates) {
    const key = value.toLowerCase();
    if (value.length === 0 || seen.has(key)) {
      continue;
    }
    seen.add(key);
    tokens.push({ value, caseSensitive: AMBIGUOUS_CASE_SENSITIVE.has(key) });
  }

  return tokens;
}

export function createSkillMatcher(catalog: readonly CanonicalSkill[]): SkillMatcher {
  const compiled = catalog.map((skill) => ({
    skill,
    patterns: resolveSkillTokens(skill).map((token) =>
      boundaryPattern(token.value, token.caseSensitive)
    ),
  }));

  return {
    extract(text: string): ExtractedSkill[] {
      const source = typeof text === 'string' ? text : '';
      const results: ExtractedSkill[] = [];

      for (const entry of compiled) {
        let occurrences = 0;
        for (const pattern of entry.patterns) {
          const matches = source.match(pattern);
          if (matches) {
            occurrences += matches.length;
          }
        }
        if (occurrences > 0) {
          results.push({ ...entry.skill, occurrences });
        }
      }

      return results;
    },
  };
}

export function extractSkills(
  text: string,
  catalog: readonly CanonicalSkill[] = buildCanonicalCatalog()
): ExtractedSkill[] {
  return createSkillMatcher(catalog).extract(text);
}

export function matchDeterministically(
  resumeText: string,
  jobText: string,
  catalog: readonly CanonicalSkill[] = buildCanonicalCatalog()
): DeterministicMatchResult {
  const matcher = createSkillMatcher(catalog);
  const resumeSkills = matcher.extract(resumeText);
  const jobSkills = matcher.extract(jobText);

  const resumeKeys = new Set(resumeSkills.map((skill) => skill.normalizedName));
  const jobKeys = new Set(jobSkills.map((skill) => skill.normalizedName));

  const matchedSkills = jobSkills.filter((skill) => resumeKeys.has(skill.normalizedName));
  const missingRequiredCandidates = jobSkills.filter(
    (skill) => !resumeKeys.has(skill.normalizedName)
  );
  const additionalResumeSkills = resumeSkills.filter(
    (skill) => !jobKeys.has(skill.normalizedName)
  );

  const deterministicSkillScore =
    jobSkills.length === 0
      ? 0
      : Math.min(100, Math.round((matchedSkills.length / jobSkills.length) * 100));

  return {
    resumeSkills,
    jobSkills,
    matchedSkills,
    missingRequiredCandidates,
    additionalResumeSkills,
    deterministicSkillScore,
  };
}

export function buildCanonicalCatalog(): CanonicalSkill[] {
  return CANONICAL_SKILLS.map((skill) => ({
    id: `canonical:${skill.normalizedName}`,
    ...skill,
  }));
}

let catalogCache: CanonicalSkill[] | null = null;

export function resetSkillCatalogCache(): void {
  catalogCache = null;
}

export async function syncCanonicalSkills(): Promise<number> {
  const operations = CANONICAL_SKILLS.map((skill) =>
    prisma.skill.upsert({
      where: { normalizedName: skill.normalizedName },
      update: { name: skill.name, category: skill.category },
      create: {
        name: skill.name,
        normalizedName: skill.normalizedName,
        category: skill.category,
      },
    })
  );

  await prisma.$transaction(operations);
  resetSkillCatalogCache();
  return operations.length;
}

export async function loadSkillCatalog(
  options: { refresh?: boolean } = {}
): Promise<CanonicalSkill[]> {
  if (!options.refresh && catalogCache) {
    return catalogCache;
  }

  let skills = await prisma.skill.findMany({ orderBy: { name: 'asc' } });

  if (skills.length === 0) {
    await syncCanonicalSkills();
    skills = await prisma.skill.findMany({ orderBy: { name: 'asc' } });
  }

  catalogCache = skills.map((skill) => ({
    id: skill.id,
    name: skill.name,
    normalizedName: skill.normalizedName,
    category: skill.category,
  }));

  return catalogCache;
}

export async function runDeterministicMatching(
  resumeText: string,
  jobText: string,
  options: { refreshCatalog?: boolean } = {}
): Promise<DeterministicMatchResult> {
  const catalog = await loadSkillCatalog({ refresh: options.refreshCatalog });
  return matchDeterministically(resumeText, jobText, catalog);
}
