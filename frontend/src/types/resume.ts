export interface ResumeSummary {
  id: string;
  title: string;
  targetRole: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Resume {
  id: string;
  userId: string;
  title: string;
  targetRole: string | null;
  content: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResumeInput {
  title: string;
  targetRole?: string;
  content: string;
  isPrimary?: boolean;
}

export interface UpdateResumeInput {
  title?: string;
  targetRole?: string;
  content?: string;
  isPrimary?: boolean;
}
