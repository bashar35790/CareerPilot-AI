export type RoadmapTimeframe = '3_MONTHS' | '6_MONTHS' | '12_MONTHS';

export interface RoadmapTask {
  id: string;
  phaseNumber: number;
  phaseTitle: string;
  title: string;
  description: string;
  isCompleted: boolean;
  orderIndex: number;
}

export interface RoadmapPhase {
  phaseNumber: number;
  phaseTitle: string;
  tasks: RoadmapTask[];
}

export interface RoadmapSummary {
  id: string;
  analysisId: string;
  targetRole: string;
  timeframe: string;
  totalTasks: number;
  completedTasks: number;
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface Roadmap extends RoadmapSummary {
  userId: string;
  phases: RoadmapPhase[];
  modelVersion: string;
}

export interface CreateRoadmapInput {
  analysisId: string;
  targetRole: string;
  timeframe: RoadmapTimeframe;
}

export interface RoadmapProgress {
  completedTasks: number;
  totalTasks: number;
  completionPercentage: number;
}

export interface UpdateRoadmapTaskResponse {
  taskId: string;
  isCompleted: boolean;
  roadmapProgress: RoadmapProgress;
}
