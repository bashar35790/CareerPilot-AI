import { afterAll, describe, expect, it } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import {
  CANONICAL_SKILLS,
  buildCanonicalCatalog,
  createSkillMatcher,
  extractSkills,
  loadSkillCatalog,
  matchDeterministically,
  runDeterministicMatching,
  syncCanonicalSkills,
} from '../../src/services/matching.deterministic';

const catalog = buildCanonicalCatalog();
const matcher = createSkillMatcher(catalog);

const names = (text: string): string[] =>
  matcher.extract(text).map((skill) => skill.normalizedName);

describe('deterministic skill extraction (pure)', () => {
  it('detects canonical hard skills case-insensitively', () => {
    const found = names('Built services with PostgreSQL, react and DOCKER.');

    expect(found).toContain('postgresql');
    expect(found).toContain('react');
    expect(found).toContain('docker');
  });

  it('detects skills at sentence boundaries', () => {
    const found = names('We use React, Node.js, and PostgreSQL.');

    expect(found).toContain('react');
    expect(found).toContain('nodejs');
    expect(found).toContain('postgresql');
  });

  it('respects word boundaries and never partial-matches', () => {
    const found = names('Improved JavaScript performance and wrote Java broadly.');

    expect(found).toContain('javascript');
    expect(found).toContain('java');
    const java = matcher.extract('Improved JavaScript performance and wrote Java.').find(
      (skill) => skill.normalizedName === 'java'
    );
    expect(java?.occurrences).toBe(1);
  });

  it('does not match skills embedded in larger words', () => {
    expect(names('Enthusiastic restaurant manager.')).not.toContain('rest');
    expect(names('PostgreSQL')).not.toContain('sql');
  });

  it('distinguishes C from C++ and C#', () => {
    const found = names('Proficient in C++, C# and C.');

    expect(found).toContain('cpp');
    expect(found).toContain('csharp');
    expect(found).toContain('c');

    const cOccurrences = matcher
      .extract('Proficient in C++, C# and C.')
      .find((skill) => skill.normalizedName === 'c')?.occurrences;
    expect(cOccurrences).toBe(1);
  });

  it('requires exact casing for ambiguous short tokens', () => {
    expect(names('I go for a run every morning.')).not.toContain('go');
    expect(names('I build command line tools in Go.')).toContain('go');
  });

  it('recognises curated aliases and synonyms', () => {
    const found = names('Hands-on with postgres, k8s, node and react.js.');

    expect(found).toContain('postgresql');
    expect(found).toContain('kubernetes');
    expect(found).toContain('nodejs');
    expect(found).toContain('react');
  });

  it('returns an empty result for text without any catalog skills', () => {
    expect(extractSkills('', catalog)).toEqual([]);
    expect(names('lorem ipsum dolor sit amet')).toEqual([]);
  });
});

describe('deterministic match partitioning (pure)', () => {
  const result = matchDeterministically(
    'Built APIs with Node.js, React, PostgreSQL and Docker.',
    'Looking for React, Node.js, Kubernetes and PostgreSQL experience.'
  );

  it('partitions job skills into matched and missing required candidates', () => {
    expect(result.matchedSkills.map((skill) => skill.normalizedName).sort()).toEqual([
      'nodejs',
      'postgresql',
      'react',
    ]);
    expect(result.missingRequiredCandidates.map((skill) => skill.normalizedName)).toEqual([
      'kubernetes',
    ]);
    expect(result.additionalResumeSkills.map((skill) => skill.normalizedName)).toEqual(['docker']);
  });

  it('computes the deterministic skill score with bounds enforced', () => {
    expect(result.deterministicSkillScore).toBe(75);
  });

  it('returns a zero score when the job posting has no catalog skills', () => {
    const empty = matchDeterministically('React and Node.js', 'We are a friendly team.');
    expect(empty.deterministicSkillScore).toBe(0);
    expect(empty.matchedSkills).toEqual([]);
  });
});

describe('canonical skill catalog persistence', () => {
  it('syncs the canonical taxonomy and ingests it from PostgreSQL', async () => {
    const synced = await syncCanonicalSkills();
    expect(synced).toBe(CANONICAL_SKILLS.length);

    const persisted = await loadSkillCatalog({ refresh: true });
    expect(persisted.length).toBeGreaterThanOrEqual(CANONICAL_SKILLS.length);

    const postgres = persisted.find((skill) => skill.normalizedName === 'postgresql');
    expect(postgres).toMatchObject({ name: 'PostgreSQL', category: 'DATABASE' });
    expect(postgres?.id).toBeTruthy();
  });

  it('runs deterministic matching against the persisted catalog', async () => {
    const result = await runDeterministicMatching(
      'React developer with Node.js and PostgreSQL experience.',
      'React, PostgreSQL, Kubernetes and Docker required.'
    );

    expect(result.matchedSkills.map((skill) => skill.normalizedName).sort()).toEqual([
      'postgresql',
      'react',
    ]);
    expect(result.missingRequiredCandidates.map((skill) => skill.normalizedName).sort()).toEqual([
      'docker',
      'kubernetes',
    ]);
    expect(result.additionalResumeSkills.map((skill) => skill.normalizedName)).toEqual(['nodejs']);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
