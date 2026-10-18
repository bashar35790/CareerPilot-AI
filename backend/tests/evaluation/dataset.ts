export interface EvaluationPair {
  id: string;
  scenario: string;
  resumeText: string;
  jobText: string;
  groundTruth: {
    resume: string[];
    job: string[];
  };
}

export const EVALUATION_PAIRS: EvaluationPair[] = [
  {
    id: 'P-01',
    scenario: 'Strong direct match',
    resumeText: 'Built web applications with React, Node.js, PostgreSQL and TypeScript.',
    jobText:
      'Junior Full-Stack Developer. Required: React, Node.js, PostgreSQL and TypeScript.',
    groundTruth: {
      resume: ['react', 'nodejs', 'postgresql', 'typescript'],
      job: ['react', 'nodejs', 'postgresql', 'typescript'],
    },
  },
  {
    id: 'P-02',
    scenario: 'Partial stack match',
    resumeText: 'Frontend developer skilled in React, CSS and Tailwind CSS.',
    jobText:
      'Full-Stack Developer. Required: React, Node.js, PostgreSQL and Redis.',
    groundTruth: {
      resume: ['react', 'css', 'tailwindcss'],
      job: ['react', 'nodejs', 'postgresql', 'redis'],
    },
  },
  {
    id: 'P-03',
    scenario: 'Seniority mismatch',
    resumeText: 'Recent graduate with academic projects in Java and Python.',
    jobText:
      'Senior Distributed Systems Engineer. Required: Go, Kubernetes and Docker.',
    groundTruth: {
      resume: ['java', 'python'],
      job: ['go', 'kubernetes', 'docker'],
    },
  },
  {
    id: 'P-04',
    scenario: 'Cross-language pivot',
    resumeText: 'Backend developer using Python, Django and PostgreSQL.',
    jobText: 'Backend Engineer. Required: Node.js, Express and PostgreSQL.',
    groundTruth: {
      resume: ['python', 'django', 'postgresql'],
      job: ['nodejs', 'express', 'postgresql'],
    },
  },
  {
    id: 'P-05',
    scenario: 'Adversarial / junk input',
    resumeText: 'lorem ipsum dolor sit amet consectetur.',
    jobText: 'Senior Frontend Engineer. Required: React, TypeScript and Next.js.',
    groundTruth: {
      resume: [],
      job: ['react', 'typescript', 'nextjs'],
    },
  },
  {
    id: 'P-06',
    scenario: 'Cloud / DevOps match',
    resumeText:
      'Automated deployments with Docker, Kubernetes and AWS. Configured Terraform.',
    jobText:
      'DevOps Engineer. Required: Docker, Kubernetes, AWS and Terraform.',
    groundTruth: {
      resume: ['docker', 'kubernetes', 'aws', 'terraform'],
      job: ['docker', 'kubernetes', 'aws', 'terraform'],
    },
  },
  {
    id: 'P-07',
    scenario: 'Database stack mismatch',
    resumeText: 'Worked with MySQL and MongoDB.',
    jobText: 'Database Engineer. Required: PostgreSQL, MySQL and Redis.',
    groundTruth: {
      resume: ['mysql', 'mongodb'],
      job: ['postgresql', 'mysql', 'redis'],
    },
  },
  {
    id: 'P-08',
    scenario: 'Language mismatch',
    resumeText: 'Backend services in Kotlin and Go.',
    jobText: 'Backend Developer. Required: Java and Kotlin.',
    groundTruth: {
      resume: ['kotlin', 'go'],
      job: ['java', 'kotlin'],
    },
  },
  {
    id: 'P-09',
    scenario: 'Concepts & tooling',
    resumeText: 'Applied TDD and OOP. Used Git, Jira and Postman.',
    jobText: 'Engineer. Required: TDD, OOP, Git and Jira. Agile environment.',
    groundTruth: {
      resume: ['tdd', 'oop', 'git', 'jira', 'postman'],
      job: ['tdd', 'oop', 'git', 'jira', 'agile'],
    },
  },
  {
    id: 'P-10',
    scenario: 'Full-stack with tooling extras',
    resumeText:
      'Built SPA with React, Redux and Vite. APIs with Node.js and Express. DB: PostgreSQL and Prisma. Tests: Vitest. CI/CD via Docker.',
    jobText:
      'Full-Stack Developer. Required: React, Redux, Node.js, Express, PostgreSQL, Prisma and Docker.',
    groundTruth: {
      resume: [
        'react',
        'redux',
        'vite',
        'nodejs',
        'express',
        'postgresql',
        'prisma',
        'vitest',
        'cicd',
        'docker',
      ],
      job: ['react', 'redux', 'nodejs', 'express', 'postgresql', 'prisma', 'docker'],
    },
  },
];
