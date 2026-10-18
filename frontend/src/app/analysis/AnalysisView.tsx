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
  Resume,
} from '@/types';
import { Badge, CardSkeleton, EmptyState, ToastAlert, useToast } from '@/components/ui';
import { createAnalysisSchema, CreateAnalysisFormData } from '@/schemas/analysis.schema';
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
      <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2">
        {title}
        <span className="text-xs font-normal text-slate-400">({skills.length})</span>
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

function RecommendationItem({ recommendation }: { recommendation: Recommendation }) {
  const Icon = RECOMMENDATION_ICONS[recommendation.category] ?? Lightbulb;

  return (
    <li className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
          <Icon className="h-3.5 w-3.5 text-indigo-600" />
          {RECOMMENDATION_LABELS[recommendation.category] ?? recommendation.category}
        </span>
        <Badge variant={PRIORITY_VARIANT[recommendation.priority] ?? 'default'} size="sm">
          {recommendation.priority}
        </Badge>
      </div>
      {recommendation.original && (
        <p className="text-xs text-slate-400 line-through leading-relaxed">
          {recommendation.original}
        </p>
      )}
      <p className="mt-1 flex items-start gap-1.5 text-sm font-semibold text-slate-800 leading-relaxed">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
        <span>{recommendation.improved}</span>
      </p>
      <p className="mt-1.5 pl-5.5 text-xs text-slate-500 leading-relaxed">
        {recommendation.rationale}
      </p>
    </li>
  );
}

function AnalysisResult({
  analysis,
  onDelete,
  isDeleting,
}: {
  analysis: AnalysisDetail;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const matchedCount = analysis.matchedSkills.length;
  const missingRequiredCount = analysis.missingRequiredSkills.length;
  const missingPreferredCount = analysis.missingPreferredSkills.length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xs">
      {/* Result header */}
      <div className="p-6 sm:p-8 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Target className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 truncate">
                {analysis.jobDescription.title}
              </h2>
            </div>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
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
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="purple" size="sm">
              {analysis.modelVersion}
            </Badge>
            <button
              type="button"
              onClick={() => onDelete(analysis.id)}
              disabled={isDeleting}
              aria-label="Delete analysis"
              className="rounded-lg border border-slate-200 p-2 text-slate-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 cursor-pointer"
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
      <div className="p-6 sm:p-8 border-b border-slate-100">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr] items-center">
          <ScoreGauge score={analysis.overallScore} />
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600 mb-4">
              Score Breakdown
            </h3>
            <ScoreBreakdownChart
              overallScore={analysis.overallScore}
              skillScore={analysis.skillScore}
              experienceScore={analysis.experienceScore}
            />
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
          <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-700 mb-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            AI Summary
          </h4>
          <p className="text-sm leading-relaxed text-slate-700">{analysis.summary}</p>
        </div>
      </div>

      {/* Skill coverage + groups */}
      <div className="p-6 sm:p-8 border-b border-slate-100">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[200px_1fr] items-start">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600 mb-2">
              Required Skill Coverage
            </h3>
            <SkillCoverageChart
              matched={matchedCount}
              missingRequired={missingRequiredCount}
            />
            {missingPreferredCount > 0 && (
              <p className="mt-3 text-center text-xs text-amber-600 font-medium">
                +{missingPreferredCount} preferred bonus skill
                {missingPreferredCount === 1 ? '' : 's'} missing
              </p>
            )}
          </div>

          <div className="space-y-5">
            <SkillGroup title="Matched Skills" skills={analysis.matchedSkills} variant="matched" />
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
                <p className="text-sm text-slate-500">
                  No skill signals were detected for this pairing.
                </p>
              )}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="p-6 sm:p-8 border-b border-slate-100">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-600 mb-4">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          Tailoring Recommendations
        </h3>
        {analysis.recommendations.length === 0 ? (
          <p className="text-sm text-slate-500">
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-6 sm:p-8">
        <p className="text-xs text-slate-500">
          Turn these gaps into an actionable learning plan.
        </p>
        <Link
          href="/roadmaps"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-indigo-500"
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

  const [resumes, setResumes] = useState<Resume[]>([]);
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
  const [hasPrefilled, setHasPrefilled] = useState(false);

  const loadResumes = useCallback(async () => {
    setIsLoadingResumes(true);
    try {
      const response = await api.get<ApiResponse<{ resumes: Resume[] }>>('/resumes');
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
        const response = await api.get<ApiResponse<AnalysisDetail>>(`/analyses/${id}`);
        if (response.data.success && response.data.data) {
          setSelected(response.data.data);
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to load the analysis.'));
      } finally {
        setIsDetailLoading(false);
      }
    },
    [toast]
  );

  const loadHistory = useCallback(
    async (targetPage: number, append: boolean): Promise<AnalysisSummary[]> => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoadingHistory(true);
      }
      try {
        const response = await api.get<ApiResponse<AnalysesListResponse>>('/analyses', {
          params: { page: targetPage, limit: HISTORY_PAGE_SIZE },
        });
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
    [toast]
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
          toast.warning('Could not prefill the selected job. Please enter it manually.');
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
      const response = await api.post<ApiResponse<AnalysisDetail>>('/analyses', payload);
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

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this analysis? This action cannot be undone.')) return;

    const wasSelected = selected?.id === id;
    setDeletingId(id);
    try {
      await api.delete(`/analyses/${id}`);
      toast.success('Analysis deleted.');
      if (wasSelected) setSelected(null);
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Gap Analysis
            </h1>
            <Badge variant="purple" size="sm">
              {total} {total === 1 ? 'Report' : 'Reports'}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Score your resume against a target role with the hybrid matching engine, then
            tailor it to close the gaps.
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetForm}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          <span>New Analysis</span>
        </button>
      </div>

      {/* Run analysis form */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs"
      >
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 mb-6">
          <Sparkles className="h-5 w-5 text-indigo-600" />
          Run a New Analysis
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Resume input */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Resume Source *
            </label>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              <button
                type="button"
                onClick={() => setResumeMode('saved')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  resumeMode === 'saved'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Saved Resume
              </button>
              <button
                type="button"
                onClick={() => setResumeMode('paste')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  resumeMode === 'paste'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
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
                    className={`block w-full rounded-lg border px-3.5 py-2 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                      fieldErrors.resumeId
                        ? 'border-rose-300 bg-rose-50/30'
                        : 'border-slate-300 bg-white'
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
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-500"
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
                    setFieldErrors((prev) => ({ ...prev, resumeContent: '', resumeId: '' }));
                  }}
                  rows={9}
                  placeholder="Paste your full resume text (100–20,000 characters)..."
                  className={`block w-full rounded-lg border px-3.5 py-2 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                    fieldErrors.resumeContent || fieldErrors.resumeId
                      ? 'border-rose-300 bg-rose-50/30'
                      : 'border-slate-300 bg-white'
                  }`}
                />
                <p
                  className={`mt-1 text-xs ${
                    resumeContentLength > 0 && resumeContentLength < 100
                      ? 'text-rose-500'
                      : 'text-slate-400'
                  }`}
                >
                  {resumeContentLength.toLocaleString()} / 20,000 characters
                </p>
              </div>
            )}

            {(fieldErrors.resumeId || fieldErrors.resumeContent) && (
              <p className="text-xs text-rose-600">
                {fieldErrors.resumeId || fieldErrors.resumeContent}
              </p>
            )}
          </div>

          {/* Job input */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
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
                className={`block w-full rounded-lg border px-3.5 py-2 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                  fieldErrors.jobTitle
                    ? 'border-rose-300 bg-rose-50/30'
                    : 'border-slate-300 bg-white'
                }`}
              />
              {fieldErrors.jobTitle && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.jobTitle}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
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
                  className={`block w-full rounded-lg border px-3.5 py-2 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                    fieldErrors.company
                      ? 'border-rose-300 bg-rose-50/30'
                      : 'border-slate-300 bg-white'
                  }`}
                />
                {fieldErrors.company && (
                  <p className="mt-1 text-xs text-rose-600">{fieldErrors.company}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
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
                  className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Job Description *
              </label>
              <textarea
                value={formData.jobDescriptionText}
                onChange={(e) => {
                  setFormData({ ...formData, jobDescriptionText: e.target.value });
                  setFieldErrors((prev) => ({ ...prev, jobDescriptionText: '' }));
                }}
                rows={6}
                placeholder="Paste the full job description text (100–20,000 characters)..."
                className={`block w-full rounded-lg border px-3.5 py-2 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                  fieldErrors.jobDescriptionText
                    ? 'border-rose-300 bg-rose-50/30'
                    : 'border-slate-300 bg-white'
                }`}
              />
              <p
                className={`mt-1 text-xs ${
                  jobDescriptionLength > 0 && jobDescriptionLength < 100
                    ? 'text-rose-500'
                    : 'text-slate-400'
                }`}
              >
                {jobDescriptionLength.toLocaleString()} / 20,000 characters
              </p>
              {fieldErrors.jobDescriptionText && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.jobDescriptionText}</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-6 border-t border-slate-100">
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            Analysis uses AI and may take a few seconds.
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-indigo-500 disabled:opacity-50 cursor-pointer"
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
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] items-start">
        <div className="min-w-0">
          {isDetailLoading ? (
            <div className="space-y-6">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : selected ? (
            <AnalysisResult
              analysis={selected}
              onDelete={handleDelete}
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
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-600">
            <Calendar className="h-4 w-4" />
            Report History
          </h3>

          {isLoadingHistory ? (
            <CardSkeleton />
          ) : analyses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-6 text-center">
              <p className="text-sm text-slate-500">
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
                        ? 'border-indigo-300 bg-indigo-50/50 ring-2 ring-indigo-500/10'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectAnalysis(analysis.id)}
                      className="min-w-0 flex-1 text-left cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-900 line-clamp-1 tracking-tight">
                          {analysis.jobDescription.title}
                        </h4>
                        <Badge variant={scoreVariant(analysis.overallScore)} size="sm">
                          {analysis.overallScore}%
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                        {analysis.jobDescription.company}
                      </p>
                      <p className="mt-1.5 text-[11px] text-slate-400">
                        {new Date(analysis.createdAt).toLocaleDateString()}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(analysis.id)}
                      disabled={isDeleting}
                      aria-label="Delete analysis"
                      className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 cursor-pointer"
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
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                >
                  {isLoadingMore ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
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
    </div>
  );
}
