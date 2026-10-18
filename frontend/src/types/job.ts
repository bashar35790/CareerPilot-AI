export type ExperienceLevel = 'ENTRY' | 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD';

export interface JobDescriptionSummary {
  id: string;
  title: string;
  company: string;
  experienceLevel: ExperienceLevel;
  createdAt: string;
}

export interface JobDescription {
  id: string;
  userId: string;
  title: string;
  company: string;
  experienceLevel: ExperienceLevel;
  rawText: string;
  createdAt: string;
}

export interface CreateJobInput {
  title: string;
  company: string;
  experienceLevel?: ExperienceLevel;
  rawText: string;
}
