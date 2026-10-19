'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Check,
  Circle,
  Layers,
  Map as MapIcon,
  Plus,
  Sparkles,
  Target,
} from 'lucide-react';
import { api, getApiErrorMessage } from '@/lib/api';
import {
  ApiResponse,
  Roadmap,
  RoadmapSummary,
  RoadmapTask,
  RoadmapTimeframe,
  UpdateRoadmapTaskResponse,
} from '@/types';
import {
  Badge,
  EmptyState,
  Modal,
  TimelineSkeleton,
  ToastAlert,
  useToast,
} from '@/components/ui';
import { createRoadmapSchema } from '@/schemas/roadmap.schema';

interface AnalysisSummary {
  id: string;
  overallScore: number;
  jobDescription: {
    id: string;
    title: string;
    company: string;
  };
  createdAt: string;
}

const TIMEFRAME_OPTIONS: { value: RoadmapTimeframe; label: string }[] = [
  { value: '3_MONTHS', label: '3 Months — Accelerated' },
  { value: '6_MONTHS', label: '6 Months — Balanced' },
  { value: '12_MONTHS', label: '12 Months — Comprehensive' },
];

const selectBase =
  'block w-full rounded-lg border bg-white/5 px-3.5 py-2 text-sm text-white transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500';

function computeCompletionPercentage(completed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 1000) / 10;
}

function applyTaskToggle(
  roadmap: Roadmap,
  taskId: string,
  isCompleted: boolean,
): Roadmap {
  const phases = roadmap.phases.map((phase) => ({
    ...phase,
    tasks: phase.tasks.map((task) =>
      task.id === taskId ? { ...task, isCompleted } : task,
    ),
  }));

  const totalTasks = phases.reduce((sum, phase) => sum + phase.tasks.length, 0);
  const completedTasks = phases.reduce(
    (sum, phase) => sum + phase.tasks.filter((task) => task.isCompleted).length,
    0,
  );

  return {
    ...roadmap,
    phases,
    totalTasks,
    completedTasks,
    completionPercentage: computeCompletionPercentage(completedTasks, totalTasks),
  };
}

export default function RoadmapsPage() {
  const toast = useToast();

  const [roadmaps, setRoadmaps] = useState<RoadmapSummary[]>([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState<Roadmap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [pendingTaskIds, setPendingTaskIds] = useState<string[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [isLoadingAnalyses, setIsLoadingAnalyses] = useState(false);

  const [formData, setFormData] = useState({
    analysisId: '',
    targetRole: '',
    timeframe: '6_MONTHS' as RoadmapTimeframe,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const loadRoadmapDetail = useCallback(
    async (id: string) => {
      setIsDetailLoading(true);
      try {
        const response = await api.get<ApiResponse<Roadmap>>(`/roadmaps/${id}`);
        if (response.data.success && response.data.data) {
          setSelectedRoadmap(response.data.data);
        }
      } catch (error) {
        toast.error(
          getApiErrorMessage(error, 'Failed to load roadmap details.'),
        );
      } finally {
        setIsDetailLoading(false);
      }
    },
    [toast],
  );

  const fetchRoadmaps = useCallback(
    async (autoSelectId?: string) => {
      try {
        setIsLoading(true);
        const response = await api.get<
          ApiResponse<{ roadmaps: RoadmapSummary[] }>
        >('/roadmaps');
        if (response.data.success && response.data.data) {
          const list = response.data.data.roadmaps;
          setRoadmaps(list);
          const nextId = autoSelectId ?? list[0]?.id;
          if (nextId) {
            await loadRoadmapDetail(nextId);
          } else {
            setSelectedRoadmap(null);
          }
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to load roadmaps.'));
      } finally {
        setIsLoading(false);
      }
    },
    [toast, loadRoadmapDetail],
  );

  useEffect(() => {
    fetchRoadmaps();
  }, [fetchRoadmaps]);

  const handleSelectRoadmap = (id: string) => {
    if (selectedRoadmap?.id === id && !isDetailLoading) return;
    loadRoadmapDetail(id);
  };

  const handleToggleTask = async (task: RoadmapTask) => {
    if (!selectedRoadmap || pendingTaskIds.includes(task.id)) return;

    const nextCompleted = !task.isCompleted;
    setSelectedRoadmap((current) =>
      current ? applyTaskToggle(current, task.id, nextCompleted) : current,
    );
    setPendingTaskIds((prev) => [...prev, task.id]);

    try {
      const response = await api.patch<ApiResponse<UpdateRoadmapTaskResponse>>(
        `/roadmaps/tasks/${task.id}`,
        { isCompleted: nextCompleted },
      );
      const progress = response.data.data?.roadmapProgress;
      if (progress) {
        setSelectedRoadmap((current) =>
          current
            ? {
                ...current,
                completedTasks: progress.completedTasks,
                totalTasks: progress.totalTasks,
                completionPercentage: progress.completionPercentage,
              }
            : current,
        );
        setRoadmaps((prev) =>
          prev.map((roadmap) =>
            roadmap.id === selectedRoadmap.id
              ? {
                  ...roadmap,
                  completedTasks: progress.completedTasks,
                  totalTasks: progress.totalTasks,
                  completionPercentage: progress.completionPercentage,
                }
              : roadmap,
          ),
        );
      }
    } catch (error) {
      setSelectedRoadmap((current) =>
        current ? applyTaskToggle(current, task.id, task.isCompleted) : current,
      );
      toast.error(
        getApiErrorMessage(
          error,
          'Failed to update task status. Reverting change.',
        ),
      );
    } finally {
      setPendingTaskIds((prev) => prev.filter((id) => id !== task.id));
    }
  };

  const handleOpenModal = async () => {
    setFormData({ analysisId: '', targetRole: '', timeframe: '6_MONTHS' });
    setFieldErrors({});
    setIsModalOpen(true);
    setIsLoadingAnalyses(true);
    try {
      const response = await api.get<
        ApiResponse<{ analyses: AnalysisSummary[] }>
      >('/analyses', { params: { limit: 50 } });
      if (response.data.success && response.data.data) {
        setAnalyses(response.data.data.analyses);
      }
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Failed to load your match analyses.'),
      );
    } finally {
      setIsLoadingAnalyses(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFieldErrors({});
  };

  const handleSelectAnalysis = (analysisId: string) => {
    const analysis = analyses.find((item) => item.id === analysisId);
    setFormData((prev) => ({
      ...prev,
      analysisId,
      targetRole: prev.targetRole || analysis?.jobDescription.title || '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const validationResult = createRoadmapSchema.safeParse(formData);
    if (!validationResult.success) {
      const flattened = validationResult.error.flatten().fieldErrors;
      const errors: Record<string, string> = {};
      Object.entries(flattened).forEach(([key, messages]) => {
        if (messages && messages.length > 0) {
          errors[key] = messages[0];
        }
      });
      setFieldErrors(errors);
      return;
    }

    setIsGenerating(true);
    try {
      const response = await api.post<ApiResponse<Roadmap>>(
        '/roadmaps',
        validationResult.data,
      );
      const created = response.data.data;
      if (created) {
        toast.success('Career roadmap generated successfully!');
        setIsModalOpen(false);
        await fetchRoadmaps(created.id);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to generate roadmap.'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-medium tracking-tight text-white sm:text-3xl">
              Career Roadmaps
            </h1>
            <Badge variant="info" size="sm">
              {roadmaps.length} {roadmaps.length === 1 ? 'Roadmap' : 'Roadmaps'}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-neutral-400">
            Track a phased learning plan that closes the skill gaps from your
            match analyses.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenModal}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Plus className="h-4 w-4" />
          <span>Generate Roadmap</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="mt-8">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xs"
              >
                <TimelineSkeleton />
              </div>
            ))}
          </div>
        ) : roadmaps.length === 0 ? (
          <EmptyState
            icon={MapIcon}
            title="No active roadmaps"
            description="No active roadmaps. Run a match analysis to generate a targeted roadmap."
            action={
              <button
                type="button"
                onClick={handleOpenModal}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <Plus className="h-4 w-4" />
                <span>Generate Roadmap</span>
              </button>
            }
            secondaryAction={
              <Link
                href="/analysis"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-neutral-200 transition-colors hover:bg-white/10"
              >
                <Sparkles className="h-4 w-4 text-blue-400" />
                <span>Run a Match Analysis</span>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[320px_1fr]">
            {/* Roadmaps Sidebar */}
            <div className="space-y-3 lg:sticky lg:top-6">
              {roadmaps.map((roadmap) => {
                const isSelected = selectedRoadmap?.id === roadmap.id;
                return (
                  <button
                    key={roadmap.id}
                    type="button"
                    onClick={() => handleSelectRoadmap(roadmap.id)}
                    className={`w-full cursor-pointer rounded-2xl border p-4 text-left shadow-xs transition-all ${
                      isSelected
                        ? 'border-blue-500/40 bg-blue-500/10 ring-2 ring-blue-500/20'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 text-sm font-bold tracking-tight text-white">
                        {roadmap.targetRole}
                      </h3>
                      <span className="shrink-0 font-mono text-xs font-semibold text-blue-400">
                        {roadmap.completionPercentage}%
                      </span>
                    </div>

                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${roadmap.completionPercentage}%` }}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-neutral-500">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(roadmap.createdAt).toLocaleDateString()}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        {roadmap.completedTasks}/{roadmap.totalTasks} tasks
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Roadmap Detail */}
            <div>
              {isDetailLoading || !selectedRoadmap ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xs sm:p-8">
                  <TimelineSkeleton />
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 shadow-xs">
                  {/* Detail Header */}
                  <div className="border-b border-white/10 p-6 sm:p-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/15 text-blue-400">
                            <Target className="h-5 w-5" />
                          </div>
                          <h2 className="font-display text-xl font-medium tracking-tight text-white">
                            {selectedRoadmap.targetRole}
                          </h2>
                        </div>
                        <p className="mt-2 text-xs text-neutral-500">
                          Generated on{' '}
                          {new Date(
                            selectedRoadmap.createdAt,
                          ).toLocaleDateString()}{' '}
                          • {selectedRoadmap.phases.length} phases •{' '}
                          {selectedRoadmap.totalTasks} tasks
                        </p>
                      </div>
                      <Badge variant="purple" size="md" dot>
                        {selectedRoadmap.timeframe}
                      </Badge>
                    </div>

                    {/* Live Progress Bar */}
                    <div className="mt-6">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                          Overall Progress
                        </span>
                        <span className="text-sm font-bold text-white">
                          {selectedRoadmap.completedTasks} /{' '}
                          {selectedRoadmap.totalTasks} tasks completed
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
                          <div
                            role="progressbar"
                            aria-valuenow={selectedRoadmap.completionPercentage}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label="Roadmap completion"
                            className="h-full rounded-full bg-linear-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                            style={{
                              width: `${selectedRoadmap.completionPercentage}%`,
                            }}
                          />
                        </div>
                        <span className="w-12 text-right text-sm font-bold tabular-nums text-blue-400">
                          {selectedRoadmap.completionPercentage}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Phases Timeline */}
                  <div className="p-6 sm:p-8">
                    {selectedRoadmap.phases.map((phase, phaseIndex) => {
                      const phaseCompleted = phase.tasks.filter(
                        (task) => task.isCompleted,
                      ).length;
                      const isLastPhase =
                        phaseIndex === selectedRoadmap.phases.length - 1;

                      return (
                        <div key={phase.phaseNumber} className="flex gap-4">
                          {/* Timeline rail */}
                          <div className="flex flex-col items-center">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-blue-500/40 bg-blue-500/15 text-sm font-bold text-blue-300">
                              {phase.phaseNumber}
                            </div>
                            {!isLastPhase && (
                              <div className="my-1 w-0.5 flex-1 bg-white/10" />
                            )}
                          </div>

                          {/* Phase Content */}
                          <div className="min-w-0 flex-1 pb-8">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-base font-bold tracking-tight text-white">
                                {phase.phaseTitle}
                              </h3>
                              <Badge
                                variant={
                                  phaseCompleted === phase.tasks.length
                                    ? 'success'
                                    : 'default'
                                }
                                size="sm"
                              >
                                {phaseCompleted}/{phase.tasks.length}
                              </Badge>
                            </div>

                            <ul className="mt-3 space-y-2">
                              {phase.tasks.map((task) => {
                                const isPending = pendingTaskIds.includes(
                                  task.id,
                                );
                                return (
                                  <li
                                    key={task.id}
                                    className={`flex items-start gap-3 rounded-xl border p-3.5 transition-colors ${
                                      task.isCompleted
                                        ? 'border-emerald-500/30 bg-emerald-500/10'
                                        : 'border-white/10 bg-white/5'
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      role="checkbox"
                                      aria-checked={task.isCompleted}
                                      aria-label={`Mark "${task.title}" as ${
                                        task.isCompleted
                                          ? 'incomplete'
                                          : 'complete'
                                      }`}
                                      onClick={() => handleToggleTask(task)}
                                      disabled={isPending}
                                      className={`mt-0.5 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-md border transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                                        task.isCompleted
                                          ? 'border-emerald-500 bg-emerald-500 text-white'
                                          : 'border-white/20 bg-white/5 text-transparent hover:border-blue-400'
                                      }`}
                                    >
                                      {task.isCompleted ? (
                                        <Check className="h-3.5 w-3.5" />
                                      ) : (
                                        <Circle className="h-3 w-3 opacity-0" />
                                      )}
                                    </button>

                                    <div className="min-w-0">
                                      <p
                                        className={`text-sm font-semibold transition-colors ${
                                          task.isCompleted
                                            ? 'text-neutral-500 line-through'
                                            : 'text-white'
                                        }`}
                                      >
                                        {task.title}
                                      </p>
                                      <p
                                        className={`mt-0.5 text-xs leading-relaxed ${
                                          task.isCompleted
                                            ? 'text-neutral-500'
                                            : 'text-neutral-400'
                                        }`}
                                      >
                                        {task.description}
                                      </p>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Generate Roadmap Modal */}
      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        title="Generate Roadmap"
        description="Turn a completed match analysis into a phased learning plan."
        icon={MapIcon}
        tone="blue"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-2" noValidate>
          {isLoadingAnalyses ? (
            <TimelineSkeleton />
          ) : analyses.length === 0 ? (
            <ToastAlert
              variant="info"
              title="No match analyses found"
              message="Run a resume-to-job match analysis first, then generate a tailored roadmap from its skill gaps."
            />
          ) : (
            <>
              {/* Analysis Select */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-300">
                  Match Analysis *
                </label>
                <select
                  value={formData.analysisId}
                  onChange={(e) => handleSelectAnalysis(e.target.value)}
                  className={`${selectBase} ${
                    fieldErrors.analysisId
                      ? 'border-rose-400/60 bg-rose-500/10'
                      : 'border-white/10'
                  }`}
                >
                  <option value="">Select an analysis...</option>
                  {analyses.map((analysis) => (
                    <option key={analysis.id} value={analysis.id}>
                      {analysis.jobDescription.title} •{' '}
                      {analysis.jobDescription.company} ({analysis.overallScore}
                      %)
                    </option>
                  ))}
                </select>
                {fieldErrors.analysisId && (
                  <p className="mt-1 text-xs text-rose-300">
                    {fieldErrors.analysisId}
                  </p>
                )}
              </div>

              {/* Target Role */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-300">
                  Target Role *
                </label>
                <input
                  type="text"
                  value={formData.targetRole}
                  onChange={(e) =>
                    setFormData({ ...formData, targetRole: e.target.value })
                  }
                  placeholder="e.g. Junior Backend Engineer"
                  className={`${selectBase} ${
                    fieldErrors.targetRole
                      ? 'border-rose-400/60 bg-rose-500/10'
                      : 'border-white/10'
                  }`}
                />
                {fieldErrors.targetRole && (
                  <p className="mt-1 text-xs text-rose-300">
                    {fieldErrors.targetRole}
                  </p>
                )}
              </div>

              {/* Timeframe */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-300">
                  Timeframe *
                </label>
                <select
                  value={formData.timeframe}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      timeframe: e.target.value as RoadmapTimeframe,
                    })
                  }
                  className={`${selectBase} border-white/10`}
                >
                  {TIMEFRAME_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-neutral-500">
                  Generation may take a few seconds while the AI plans your
                  phases.
                </p>
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="cursor-pointer rounded-lg border border-white/15 px-4 py-2 text-xs font-semibold text-neutral-200 transition-colors hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating || analyses.length === 0}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Generate Roadmap</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
