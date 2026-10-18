'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Building2,
  Calendar,
  Check,
  Eye,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { api, getApiErrorMessage } from '@/lib/api';
import {
  ApiResponse,
  ExperienceLevel,
  JobDescription,
  JobDescriptionSummary,
} from '@/types';
import {
  Badge,
  CardSkeleton,
  ConfirmDialog,
  EmptyState,
  Modal,
  useToast,
} from '@/components/ui';
import { createJobSchema } from '@/schemas/job.schema';

const SAMPLE_JOB_TEXT = `FinTech Innovators Inc. - Junior Full-Stack Developer
Location: Remote (US / EMEA) | Full-time | Experience: 1-3 years

ABOUT THE ROLE
We are seeking an energetic Junior Full-Stack Software Engineer to join our core banking integrations team. In this role, you will design, develop, and maintain high-performance web applications and backend APIs supporting thousands of concurrent financial transactions.

KEY RESPONSIBILITIES
- Build resilient, scalable REST API endpoints using Node.js, Express.js, and TypeScript.
- Design normalized relational database schemas with PostgreSQL and execute migrations via Prisma ORM.
- Develop interactive, responsive frontend user interfaces using React, Next.js (App Router), and Tailwind CSS.
- Implement secure authentication mechanisms, including HttpOnly cookie-based JWT sessions and CSRF mitigations.
- Write unit and integration test suites using Vitest/Jest and Supertest to ensure 85%+ code reliability.
- Containerize application services using Docker and Docker Compose for local development and CI/CD pipelines.

MANDATORY REQUIREMENTS
- 1-3 years of demonstrable production experience in Full-Stack web development.
- Strong proficiency in TypeScript, React, Node.js, and Express.
- Hands-on experience with relational databases (PostgreSQL preferred) and ORMs (Prisma or TypeORM).
- Solid understanding of REST architectural principles, HTTP cookies, and web security best practices.
- Familiarity with version control using Git and GitHub workflows.

PREFERRED QUALIFICATIONS (BONUS)
- Experience with Docker containerization and CI/CD automation.
- Exposure to Google Cloud Platform or AWS cloud hosting.
- Experience with Redis caching or message queues.
- Bachelor's degree in Computer Science or equivalent practical engineering experience.`;

const EXPERIENCE_LEVELS: ExperienceLevel[] = ['ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD'];

const inputBase =
  'block w-full rounded-lg border bg-white/5 px-3.5 py-2 text-sm text-white placeholder:text-neutral-500 transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500';

export default function JobsPage() {
  const toast = useToast();

  const [jobs, setJobs] = useState<JobDescriptionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobDescription | null>(null);
  const [isViewLoading, setIsViewLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] =
    useState<JobDescriptionSummary | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    experienceLevel: 'ENTRY' as ExperienceLevel,
    rawText: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const fetchJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      const response =
        await api.get<ApiResponse<{ jobs: JobDescriptionSummary[] }>>('/jobs');
      if (response.data.success && response.data.data) {
        setJobs(response.data.data.jobs);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load job descriptions.'));
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleOpenCreateModal = () => {
    setFormData({
      title: '',
      company: '',
      experienceLevel: 'ENTRY',
      rawText: '',
    });
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFieldErrors({});
  };

  const handleViewJob = async (id: string) => {
    setIsViewLoading(true);
    try {
      const response = await api.get<ApiResponse<{ job: JobDescription }>>(
        `/jobs/${id}`,
      );
      if (response.data.success && response.data.data?.job) {
        setSelectedJob(response.data.data.job);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load job description.'));
    } finally {
      setIsViewLoading(false);
    }
  };

  const handleLoadSample = () => {
    setFormData({
      title: 'Junior Full-Stack Developer',
      company: 'FinTech Innovators Inc.',
      experienceLevel: 'JUNIOR',
      rawText: SAMPLE_JOB_TEXT,
    });
    setFieldErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const validationResult = createJobSchema.safeParse(formData);
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

    setIsSubmitting(true);
    try {
      const response = await api.post<ApiResponse<{ job: JobDescription }>>(
        '/jobs',
        validationResult.data,
      );
      if (response.data.success && response.data.data?.job) {
        toast.success('Job description saved successfully!');
        handleCloseModal();
        fetchJobs();
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to save job description.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmTarget) return;
    const id = confirmTarget.id;

    setDeletingId(id);
    try {
      await api.delete(`/jobs/${id}`);
      toast.success('Job description deleted successfully.');
      if (selectedJob?.id === id) {
        setSelectedJob(null);
      }
      setConfirmTarget(null);
      fetchJobs();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Failed to delete job description.'),
      );
    } finally {
      setDeletingId(null);
    }
  };

  const charCount = formData.rawText.length;
  const isContentValid = charCount >= 100 && charCount <= 20000;

  const getLevelVariant = (level: ExperienceLevel) => {
    switch (level) {
      case 'ENTRY':
      case 'JUNIOR':
        return 'info';
      case 'MID':
        return 'success';
      case 'SENIOR':
      case 'LEAD':
        return 'purple';
      default:
        return 'default';
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-medium tracking-tight text-white sm:text-3xl">
              Target Job Postings
            </h1>
            <Badge variant="matched" size="sm">
              {jobs.length} {jobs.length === 1 ? 'Job' : 'Jobs'}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-neutral-400">
            Ingest and store real-world job postings to benchmark your technical
            resume and identify skill gaps.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Plus className="h-4 w-4" />
          <span>Add Job Posting</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="mt-8">
        {isLoading ? (
          /* Loading Skeletons */
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : jobs.length === 0 ? (
          /* Empty State */
          <EmptyState
            icon={Briefcase}
            title="No job postings saved yet"
            description="Paste a target job posting from LinkedIn, Indeed, or company career pages to analyze qualifications."
            action={
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <Plus className="h-4 w-4" />
                <span>Add First Job Description</span>
              </button>
            }
          />
        ) : (
          /* Jobs Cards Grid */
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="relative flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xs transition-all hover:border-white/20 hover:bg-white/10"
              >
                <div>
                  {/* Top Badges */}
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <Badge variant={getLevelVariant(job.experienceLevel)} size="sm">
                      {job.experienceLevel}
                    </Badge>

                    <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                      <Calendar className="h-3 w-3" />
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Title & Company */}
                  <h3 className="line-clamp-1 text-lg font-bold tracking-tight text-white">
                    {job.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-neutral-300">
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
                    <span className="truncate">{job.company}</span>
                  </div>

                  {/* Meta */}
                  <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 p-2.5 text-xs text-neutral-400">
                    <Eye className="h-3.5 w-3.5 text-neutral-500" />
                    <span>Full description available on View</span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-6 flex items-center justify-between gap-2 border-t border-white/10 pt-4">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleViewJob(job.id)}
                      disabled={isViewLoading}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs font-medium text-neutral-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                      title="View full job posting"
                    >
                      <Eye className="h-3.5 w-3.5 text-neutral-400" />
                      <span>View</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmTarget(job)}
                      disabled={deletingId === job.id}
                      className="inline-flex cursor-pointer items-center rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-50"
                      title="Delete job posting"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <Link
                    href={`/analysis?jobId=${job.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1.5 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/25"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Match Resume</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Job Modal */}
      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        title="Add Target Job Posting"
        description="Paste raw job specifications (min 100, max 20,000 characters)."
        icon={Briefcase}
        tone="emerald"
        size="md"
      >
        {/* Quick Sample Button */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs text-neutral-400">
            Evaluating the platform?
          </span>
          <button
            type="button"
            onClick={handleLoadSample}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/25"
          >
            <Sparkles className="h-3 w-3" />
            <span>Load Sample Job Posting</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Title */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-300">
                Job Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g. Junior Full-Stack Developer"
                className={`${inputBase} ${
                  fieldErrors.title
                    ? 'border-rose-400/60 bg-rose-500/10'
                    : 'border-white/10'
                }`}
              />
              {fieldErrors.title && (
                <p className="mt-1 text-xs text-rose-300">{fieldErrors.title}</p>
              )}
            </div>

            {/* Company */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-300">
                Company Name *
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
                placeholder="e.g. Stripe, FinTech Innovators"
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
          </div>

          {/* Experience Level Selector */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Experience Seniority
            </label>
            <div className="flex flex-wrap gap-2">
              {EXPERIENCE_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, experienceLevel: level })
                  }
                  className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    formData.experienceLevel === level
                      ? 'border-blue-600 bg-blue-600 text-white shadow-2xs'
                      : 'border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Content Textarea */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300">
                Job Description Text *
              </label>
              {/* Live Character Counter */}
              <span
                className={`font-mono text-xs font-medium ${
                  charCount === 0
                    ? 'text-neutral-500'
                    : isContentValid
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                }`}
              >
                {charCount.toLocaleString()} / 20,000 characters{' '}
                {charCount > 0 && charCount < 100 && '(min 100 required)'}
              </span>
            </div>
            <textarea
              rows={9}
              value={formData.rawText}
              onChange={(e) =>
                setFormData({ ...formData, rawText: e.target.value })
              }
              placeholder="Paste the full job requirements, tech stack keywords, and responsibilities here..."
              className={`${inputBase} font-mono text-xs ${
                fieldErrors.rawText
                  ? 'border-rose-400/60 bg-rose-500/10'
                  : 'border-white/10'
              }`}
            />
            {fieldErrors.rawText && (
              <p className="mt-1 text-xs text-rose-300">
                {fieldErrors.rawText}
              </p>
            )}
          </div>

          {/* Form Buttons */}
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
              disabled={isSubmitting || !isContentValid}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving Job...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Save Job Posting</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Full Job View Modal */}
      <Modal
        open={Boolean(selectedJob)}
        onClose={() => setSelectedJob(null)}
        title={selectedJob?.title ?? ''}
        description={
          selectedJob
            ? `${selectedJob.company} • ${selectedJob.experienceLevel} Level • ${selectedJob.rawText.length.toLocaleString()} characters`
            : undefined
        }
        icon={Briefcase}
        tone="emerald"
        size="lg"
        footer={
          <>
            {selectedJob && (
              <Link
                href={`/analysis?jobId=${selectedJob.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Match a Resume to This Job</span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => setSelectedJob(null)}
              className="cursor-pointer rounded-lg border border-white/15 px-3.5 py-1.5 text-xs font-semibold text-neutral-200 transition-colors hover:bg-white/10"
            >
              Close
            </button>
          </>
        }
      >
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-neutral-200">
            {selectedJob?.rawText}
          </pre>
        </div>
        {selectedJob && (
          <p className="mt-3 text-xs text-neutral-500">
            Created on {new Date(selectedJob.createdAt).toLocaleDateString()}
          </p>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title="Delete this job posting?"
        description={
          confirmTarget
            ? `"${confirmTarget.title}" at ${confirmTarget.company} will be permanently removed. This action cannot be undone.`
            : undefined
        }
        confirmLabel="Delete Job Posting"
        isConfirming={Boolean(confirmTarget && deletingId === confirmTarget.id)}
        onConfirm={handleConfirmDelete}
        onClose={() => setConfirmTarget(null)}
      />
    </div>
  );
}
