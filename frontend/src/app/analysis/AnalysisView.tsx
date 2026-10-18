'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  FileText,
  Lightbulb,
  Map as MapIcon,
  RefreshCw,
  Sparkles,
  Target,
  Trash2,
  Wand2,
} from 'lucide-react';
import { api, getApiErrorMessage } from '@/lib/api';
import {
  AnalysesListResponse,
  AnalysisDetail,
  AnalysisSkillBadge,
  AnalysisSummary,
  ApiResponse,
  CreateAnalysisPayload,
  ExperienceLevel,
  JobDescription,
  Recommendation,
  ResumeSummary,
} from '@/types';
import {
  Badge,
  CardSkeleton,
  ConfirmDialog,
  EmptyState,
  ToastAlert,
  useToast,
} from '@/components/ui';
import {
  createAnalysisSchema,
  CreateAnalysisFormData,
} from '@/schemas/analysis.schema';
import { ScoreGauge } from '@/components/analysis/ScoreGauge';
import { ScoreBreakdownChart } from '@/components/analysis/ScoreBreakdownChart';
import { SkillCoverageChart } from '@/components/analysis/SkillCoverageChart';

const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: 'ENTRY', label: 'Entry Level' },
  { value: 'JUNIOR', label: 'Junior' },
  { value: 'MID', label: 'Mid Level' },
  { value: 'SENIOR', label: 'Senior' },
  { value: 'LEAD', label: 'Lead / Staff' },
];

const RECOMMENDATION_LABELS: Record<string, string> = {
  SKILL_INTEGRATION: 'Skill Integration',
  BULLET_POINT_REWRITE: 'Bullet Point Rewrite',
  EXPERIENCE_FRAMING: 'Experience Framing',
};

const RECOMMENDATION_ICONS: Record<string, typeof Wand2> = {
  SKILL_INTEGRATION: Target,
  BULLET_POINT_REWRITE: Wand2,
  EXPERIENCE_FRAMING: Briefcase,
};

const PRIORITY_VARIANT: Record<string, 'danger' | 'warning' | 'default'> = {
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'default',
};

const HISTORY_PAGE_SIZE = 5;

const inputBase =
  'block w-full rounded-lg border bg-white/5 px-3.5 py-2 text-sm text-white placeholder:text-neutral-500 transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500';

type ResumeMode = 'saved' | 'paste';

function scoreVariant(score: number): 'success' | 'info' | 'warning' | 'danger' {
  if (score >= 80) return 'success';
  if (score >= 60) return 'info';
  if (score >= 40) return 'warning';
  return 'danger';
}

function SkillGroup({
  title,
  skills,
  variant,
}: {
  title: string;
  skills: AnalysisSkillBadge[];
  variant: 'matched' | 'missing-required' | 'missing-preferred';
}) {
  if (skills.length === 0) return null;

  return (
    <div>
      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-200">
        {title}
        <span className="text-xs font-normal text-neutral-500">
          ({skills.length})
        </span>
      </h4>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <Badge
            key={skill.name}
            variant={variant}
            size="md"
            title={skill.contextualNote}
          >
            {skill.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function RecommendationItem({
  recommendation,
}: {
  recommendation: Recommendation;
}) {
  const Icon = RECOMMENDATION_ICONS[recommendation.category] ?? Lightbulb;

  return (
    <li className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-300">
          <Icon className="h-3.5 w-3.5 text-blue-400" />
          {RECOMMENDATION_LABELS[recommendation.category] ??
            recommendation.category}
        </span>
        <Badge
          variant={PRIORITY_VARIANT[recommendation.priority] ?? 'default'}
          size="sm"
        >
          {recommendation.priority}
        </Badge>
      </div>
      {recommendation.original && (
        <p className="text-xs leading-relaxed text-neutral-500 line-through">
          {recommendation.original}
        </p>
      )}
      <p className="mt-1 flex items-start gap-1.5 text-sm font-semibold leading-relaxed text-neutral-100">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
        <span>{recommendation.improved}</span>
      </p>
      <p className="mt-1.5 pl-5.5 text-xs leading-relaxed text-neutral-400">
        {recommendation.rationale}
      </p>
    </li>
  );
}

function AnalysisResult({
  analysis,
  onRequestDelete,
  isDeleting,
}: {
  analysis: AnalysisDetail;
  onRequestDelete: (id: string, title: string) => void;
  isDeleting: boolean;
}) {
  const matchedCount = analysis.matchedSkills.length;
  const missingRequiredCount = analysis.missingRequiredSkills.length;
  const missingPreferredCount = analysis.missingPreferredSkills.length;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 shadow-xs">
      {/* Result header */}
      <div className="border-b border-white/10 p-6 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/15 text-blue-400">
                <Target className="h-5 w-5" />
              </div>
              <h2 className="truncate font-display text-xl font-medium tracking-tight text-white">
                {analysis.jobDescription.title}
              </h2>
            </div>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {analysis.jobDescription.company}
              </span>
              <span className="inline-flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                {analysis.resume.title}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(analysis.createdAt).toLocaleString()}
              </span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant="purple" size="sm">
              {analysis.modelVersion}
            </Badge>
            <button
              type="button"
              onClick={() =>
                onRequestDelete(analysis.id, analysis.jobDescription.title)
              }
              disabled={isDeleting}
              aria-label="Delete analysis"
              className="cursor-pointer rounded-lg border border-white/15 p-2 text-neutral-400 transition-colors hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-50"
            >
              {isDeleting ? (
                <span className="block h-4 w-4 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Scores */}
      <div className="border-b border-white/10 p-6 sm:p-8">
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[220px_1fr]">
          <ScoreGauge score={analysis.overallScore} />
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-300">
              Score Breakdown
            </h3>
            <ScoreBreakdownChart
              overallScore={analysis.overallScore}
              skillScore={analysis.skillScore}
              experienceScore={analysis.experienceScore}
            />
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
          <h4 className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-300">
            <Sparkles className="h-3.5 w-3.5" />
            AI Summary
          </h4>
          <p className="text-sm leading-relaxed text-neutral-200">
            {analysis.summary}
          </p>
        </div>
      </div>

      {/* Skill coverage + groups */}
      <div className="border-b border-white/10 p-6 sm:p-8">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[200px_1fr]">
          <div>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-neutral-300">
              Required Skill Coverage
            </h3>
            <SkillCoverageChart
              matched={matchedCount}
              missingRequired={missingRequiredCount}
            />
            {missingPreferredCount > 0 && (
              <p className="mt-3 text-center text-xs font-medium text-amber-400">
                +{missingPreferredCount} preferred bonus skill
                {missingPreferredCount === 1 ? '' : 's'} missing
              </p>
            )}
          </div>

          <div className="space-y-5">
            <SkillGroup
              title="Matched Skills"
              skills={analysis.matchedSkills}
              variant="matched"
            />
            <SkillGroup
              title="Missing Required Skills"
              skills={analysis.missingRequiredSkills}
              variant="missing-required"
            />
            <SkillGroup
              title="Missing Preferred Skills"
              skills={analysis.missingPreferredSkills}
              variant="missing-preferred"
            />
            {analysis.matchedSkills.length === 0 &&
              analysis.missingRequiredSkills.length === 0 &&
              analysis.missingPreferredSkills.length === 0 && (
                <p className="text-sm text-neutral-400">
                  No skill signals were detected for this pairing.
                </p>
              )}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="border-b border-white/10 p-6 sm:p-8">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-neutral-300">
          <Lightbulb className="h-4 w-4 text-amber-400" />
          Tailoring Recommendations
        </h3>
        {analysis.recommendations.length === 0 ? (
          <p className="text-sm text-neutral-400">
            No rewriting suggestions were generated for this analysis.
          </p>
        ) : (
          <ul className="space-y-3">
            {analysis.recommendations.map((recommendation, index) => (
              <RecommendationItem
                key={`${recommendation.category}-${index}`}
                recommendation={recommendation}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <p className="text-xs text-neutral-500">
          Turn these gaps into an actionable learning plan.
        </p>
        <Link
          href="/roadmaps"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-blue-700"
        >
          <MapIcon className="h-4 w-4" />
          <span>Generate Roadmap</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default function AnalysisView() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const prefillResumeId = searchParams.get('resumeId');
  const prefillJobId = searchParams.get('jobId');

  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [isLoadingResumes, setIsLoadingResumes] = useState(true);

  const [resumeMode, setResumeMode] = useState<ResumeMode>('saved');
  const [formData, setFormData] = useState({
    resumeId: '',
    resumeContent: '',
    jobTitle: '',
    company: '',
    experienceLevel: 'MID' as ExperienceLevel,
    jobDescriptionText: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [selected, setSelected] = useState<AnalysisDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [hasPrefilled, setHasPrefilled] = useState(false);

  const loadResumes = useCallback(async () => {
    setIsLoadingResumes(true);
    try {
      const response =
        await api.get<ApiResponse<{ resumes: ResumeSummary[] }>>('/resumes');
      if (response.data.success && response.data.data) {
        setResumes(response.data.data.resumes);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load your resumes.'));
    } finally {
      setIsLoadingResumes(false);
    }
  }, [toast]);

  const loadDetail = useCallback(
    async (id: string) => {
      setIsDetailLoading(true);
      try {
        const response = await api.get<ApiResponse<AnalysisDetail>>(
          `/analyses/${id}`,
        );
        if (response.data.success && response.data.data) {
          setSelected(response.data.data);
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to load the analysis.'));
      } finally {
        setIsDetailLoading(false);
      }
    },
    [toast],
  );

  const loadHistory = useCallback(
    async (targetPage: number, append: boolean): Promise<AnalysisSummary[]> => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoadingHistory(true);
      }
      try {
        const response = await api.get<ApiResponse<AnalysesListResponse>>(
          '/analyses',
          {
            params: { page: targetPage, limit: HISTORY_PAGE_SIZE },
          },
        );
        if (response.data.success && response.data.data) {
          const { analyses: items, pagination } = response.data.data;
          setAnalyses((prev) => (append ? [...prev, ...items] : items));
          setPage(pagination.page);
          setTotalPages(pagination.totalPages);
          setTotal(pagination.total);
          return items;
        }
        return [];
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to load your analyses.'));
        return [];
      } finally {
        if (append) {
          setIsLoadingMore(false);
        } else {
          setIsLoadingHistory(false);
        }
      }
    },
    [toast],
  );

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  useEffect(() => {
    let active = true;
    (async () => {
      const items = await loadHistory(1, false);
      if (active && items.length > 0) {
        await loadDetail(items[0].id);
      }
    })();
    return () => {
      active = false;
    };
  }, [loadHistory, loadDetail]);

  useEffect(() => {
    if (hasPrefilled) return;

    if (prefillResumeId) {
      setResumeMode('saved');
      setFormData((prev) => ({ ...prev, resumeId: prefillResumeId }));
    }

    if (prefillJobId) {
      api
        .get<ApiResponse<{ job: JobDescription }>>(`/jobs/${prefillJobId}`)
        .then((response) => {
          const job = response.data.data?.job;
          if (job) {
            setFormData((prev) => ({
              ...prev,
              jobTitle: job.title,
              company: job.company,
              experienceLevel: job.experienceLevel,
              jobDescriptionText: job.rawText ?? '',
            }));
          }
        })
        .catch(() => {
          toast.warning(
            'Could not prefill the selected job. Please enter it manually.',
          );
        });
    }

    setHasPrefilled(true);
  }, [hasPrefilled, prefillResumeId, prefillJobId, toast]);

  const handleLoadMore = () => {
    if (page < totalPages && !isLoadingMore) {
      loadHistory(page + 1, true);
    }
  };

  const handleSelectAnalysis = (id: string) => {
    if (selected?.id === id && !isDetailLoading) return;
    loadDetail(id);
  };

  const handleResetForm = () => {
    setFormData({
      resumeId: '',
      resumeContent: '',
      jobTitle: '',
      company: '',
      experienceLevel: 'MID',
      jobDescriptionText: '',
    });
    setFieldErrors({});
    setResumeMode('saved');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const candidate: CreateAnalysisFormData = {
      resumeId: resumeMode === 'saved' ? formData.resumeId : undefined,
      resumeContent: resumeMode === 'paste' ? formData.resumeContent : undefined,
      jobTitle: formData.jobTitle,
      company: formData.company,
      jobDescriptionText: formData.jobDescriptionText,
      experienceLevel: formData.experienceLevel,
    };

    const validation = createAnalysisSchema.safeParse(candidate);
    if (!validation.success) {
      const flattened = validation.error.flatten().fieldErrors;
      const errors: Record<string, string> = {};
      Object.entries(flattened).forEach(([key, messages]) => {
        if (messages && messages.length > 0) {
          errors[key] = messages[0];
        }
      });
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateAnalysisPayload = { ...validation.data };
      const response = await api.post<ApiResponse<AnalysisDetail>>(
        '/analyses',
        payload,
      );
      const created = response.data.data;
      if (created) {
        setSelected(created);
        toast.success('Gap analysis complete!');
        await loadHistory(1, false);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to run the analysis.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestDelete = (id: string, title: string) => {
    setConfirmTarget({ id, title });
  };

  const handleConfirmDelete = async () => {
    if (!confirmTarget) return;
    const id = confirmTarget.id;

    const wasSelected = selected?.id === id;
    setDeletingId(id);
    try {
      await api.delete(`/analyses/${id}`);
      toast.success('Analysis deleted.');
      if (wasSelected) setSelected(null);
      setConfirmTarget(null);
      const items = await loadHistory(1, false);
      if (wasSelected && items.length > 0) {
        await loadDetail(items[0].id);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete the analysis.'));
    } finally {
      setDeletingId(null);
    }
  };

  const resumeContentLength = formData.resumeContent.length;
  const jobDescriptionLength = formData.jobDescriptionText.length;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-medium tracking-tight text-white sm:text-3xl">
              Gap Analysis
            </h1>
            <Badge variant="purple" size="sm">
              {total} {total === 1 ? 'Report' : 'Reports'}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-neutral-400">
            Score your resume against a target role with the hybrid matching
            engine, then tailor it to close the gaps.
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetForm}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-neutral-200 shadow-xs transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <RefreshCw className="h-4 w-4" />
          <span>New Analysis</span>
        </button>
      </div>

      {/* Run analysis form */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xs sm:p-8"
      >
        <h2 className="mb-6 flex items-center gap-2 text-base font-bold text-white">
          <Sparkles className="h-5 w-5 text-blue-400" />
          Run a New Analysis
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Resume input */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Resume Source *
            </label>
            <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-0.5">
              <button
                type="button"
                onClick={() => setResumeMode('saved')}
                className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  resumeMode === 'saved'
                    ? 'bg-blue-600/20 text-blue-200 shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Saved Resume
              </button>
              <button
                type="button"
                onClick={() => setResumeMode('paste')}
                className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  resumeMode === 'paste'
                    ? 'bg-blue-600/20 text-blue-200 shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Paste Content
              </button>
            </div>

            {resumeMode === 'saved' ? (
              isLoadingResumes ? (
                <CardSkeleton />
              ) : resumes.length === 0 ? (
                <ToastAlert
                  variant="info"
                  title="No saved resumes"
                  message="Create a resume first, or switch to “Paste Content” to run an analysis on the fly."
                />
              ) : (
                <>
                  <select
                    value={formData.resumeId}
                    onChange={(e) => {
                      setFormData({ ...formData, resumeId: e.target.value });
                      setFieldErrors((prev) => ({ ...prev, resumeId: '' }));
                    }}
                    className={`${inputBase} ${
                      fieldErrors.resumeId
                        ? 'border-rose-400/60 bg-rose-500/10'
                        : 'border-white/10'
                    }`}
                  >
                    <option value="">Select a saved resume...</option>
                    {resumes.map((resume) => (
                      <option key={resume.id} value={resume.id}>
                        {resume.title}
                        {resume.targetRole ? ` — ${resume.targetRole}` : ''}
                      </option>
                    ))}
                  </select>
                  <Link
                    href="/resumes"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Manage resumes
                  </Link>
                </>
              )
            ) : (
              <div>
                <textarea
                  value={formData.resumeContent}
                  onChange={(e) => {
                    setFormData({ ...formData, resumeContent: e.target.value });
                    setFieldErrors((prev) => ({
                      ...prev,
                      resumeContent: '',
                      resumeId: '',
                    }));
                  }}
                  rows={9}
                  placeholder="Paste your full resume text (100–20,000 characters)..."
                  className={`${inputBase} ${
                    fieldErrors.resumeContent || fieldErrors.resumeId
                      ? 'border-rose-400/60 bg-rose-500/10'
                      : 'border-white/10'
                  }`}
                />
                <p
                  className={`mt-1 text-xs ${
                    resumeContentLength > 0 && resumeContentLength < 100
                      ? 'text-rose-400'
                      : 'text-neutral-500'
                  }`}
                >
                  {resumeContentLength.toLocaleString()} / 20,000 characters
                </p>
              </div>
            )}

            {(fieldErrors.resumeId || fieldErrors.resumeContent) && (
              <p className="text-xs text-rose-300">
                {fieldErrors.resumeId || fieldErrors.resumeContent}
              </p>
            )}
          </div>

          {/* Job input */}
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-300">
                Job Title *
              </label>
              <input
                type="text"
                value={formData.jobTitle}
                onChange={(e) => {
                  setFormData({ ...formData, jobTitle: e.target.value });
                  setFieldErrors((prev) => ({ ...prev, jobTitle: '' }));
                }}
                placeholder="e.g. Junior Backend Engineer"
                className={`${inputBase} ${
                  fieldErrors.jobTitle
                    ? 'border-rose-400/60 bg-rose-500/10'
                    : 'border-white/10'
                }`}
              />
              {fieldErrors.jobTitle && (
                <p className="mt-1 text-xs text-rose-300">
                  {fieldErrors.jobTitle}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-300">
                  Company *
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => {
                    setFormData({ ...formData, company: e.target.value });
                    setFieldErrors((prev) => ({ ...prev, company: '' }));
                  }}
                  placeholder="e.g. Acme Corp"
                  className={`${inputBase} ${
                    fieldErrors.company
                      ? 'border-rose-400/60 bg-rose-500/10'
                      : 'border-white/10'
                  }`}
                />
                {fieldErrors.company && (
                  <p className="mt-1 text-xs text-rose-300">
                    {fieldErrors.company}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-300">
                  Experience Level
                </label>
                <select
                  value={formData.experienceLevel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      experienceLevel: e.target.value as ExperienceLevel,
                    })
                  }
                  className={`${inputBase} border-white/10`}
                >
                  {EXPERIENCE_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-300">
                Job Description *
              </label>
              <textarea
                value={formData.jobDescriptionText}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    jobDescriptionText: e.target.value,
                  });
                  setFieldErrors((prev) => ({
                    ...prev,
                    jobDescriptionText: '',
                  }));
                }}
                rows={6}
                placeholder="Paste the full job description text (100–20,000 characters)..."
                className={`${inputBase} ${
                  fieldErrors.jobDescriptionText
                    ? 'border-rose-400/60 bg-rose-500/10'
                    : 'border-white/10'
                }`}
              />
              <p
                className={`mt-1 text-xs ${
                  jobDescriptionLength > 0 && jobDescriptionLength < 100
                    ? 'text-rose-400'
                    : 'text-neutral-500'
                }`}
              >
                {jobDescriptionLength.toLocaleString()} / 20,000 characters
              </p>
              {fieldErrors.jobDescriptionText && (
                <p className="mt-1 text-xs text-rose-300">
                  {fieldErrors.jobDescriptionText}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-1.5 text-xs text-neutral-500">
            <AlertTriangle className="h-3.5 w-3.5" />
            Analysis uses AI and may take a few seconds.
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Run Analysis</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Results + history */}
      <div className="mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          {isDetailLoading ? (
            <div className="space-y-6">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : selected ? (
            <AnalysisResult
              analysis={selected}
              onRequestDelete={requestDelete}
              isDeleting={deletingId === selected.id}
            />
          ) : (
            <EmptyState
              icon={Sparkles}
              title="No report selected"
              description="Run a new analysis above, or pick one from your report history to review its full breakdown."
            />
          )}
        </div>

        {/* History sidebar */}
        <aside className="space-y-3 lg:sticky lg:top-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-neutral-300">
            <Calendar className="h-4 w-4" />
            Report History
          </h3>

          {isLoadingHistory ? (
            <CardSkeleton />
          ) : analyses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-center">
              <p className="text-sm text-neutral-400">
                No reports yet. Run your first analysis to see it here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {analyses.map((analysis) => {
                const isActive = selected?.id === analysis.id;
                const isDeleting = deletingId === analysis.id;
                return (
                  <div
                    key={analysis.id}
                    className={`group flex items-start gap-3 rounded-xl border p-3.5 shadow-xs transition-all ${
                      isActive
                        ? 'border-blue-500/40 bg-blue-500/10 ring-2 ring-blue-500/20'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectAnalysis(analysis.id)}
                      className="min-w-0 flex-1 cursor-pointer text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="line-clamp-1 text-sm font-bold tracking-tight text-white">
                          {analysis.jobDescription.title}
                        </h4>
                        <Badge
                          variant={scoreVariant(analysis.overallScore)}
                          size="sm"
                        >
                          {analysis.overallScore}%
                        </Badge>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-xs text-neutral-400">
                        {analysis.jobDescription.company}
                      </p>
                      <p className="mt-1.5 text-[11px] text-neutral-500">
                        {new Date(analysis.createdAt).toLocaleDateString()}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        requestDelete(
                          analysis.id,
                          analysis.jobDescription.title,
                        )
                      }
                      disabled={isDeleting}
                      aria-label="Delete analysis"
                      className="cursor-pointer rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <span className="block h-4 w-4 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                );
              })}

              {page < totalPages && (
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-neutral-200 transition-colors hover:bg-white/10 disabled:opacity-50"
                >
                  {isLoadingMore ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <span>Load more reports</span>
                  )}
                </button>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title="Delete this analysis?"
        description={
          confirmTarget
            ? `The match report for "${confirmTarget.title}" will be permanently removed. This action cannot be undone.`
            : undefined
        }
        confirmLabel="Delete Analysis"
        isConfirming={Boolean(confirmTarget && deletingId === confirmTarget.id)}
        onConfirm={handleConfirmDelete}
        onClose={() => setConfirmTarget(null)}
      />
    </div>
  );
}
