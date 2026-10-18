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
  X,
} from 'lucide-react';
import { api, getApiErrorMessage } from '@/lib/api';
import { ApiResponse, ExperienceLevel, JobDescription } from '@/types';
import { Badge, CardSkeleton, EmptyState, useToast } from '@/components/ui';
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

export default function JobsPage() {
  const toast = useToast();

  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobDescription | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      const response = await api.get<ApiResponse<{ jobs: JobDescription[] }>>('/jobs');
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
        validationResult.data
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

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this job description?')) {
      return;
    }

    setDeletingId(id);
    try {
      await api.delete(`/jobs/${id}`);
      toast.success('Job description deleted successfully.');
      if (selectedJob?.id === id) {
        setSelectedJob(null);
      }
      fetchJobs();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete job description.'));
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Target Job Postings
            </h1>
            <Badge variant="matched" size="sm">
              {jobs.length} {jobs.length === 1 ? 'Job' : 'Jobs'}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Ingest and store real-world job postings to benchmark your technical resume and identify skill gaps.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-indigo-500 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Job Posting</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="mt-8">
        {isLoading ? (
          /* Loading Skeletons */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add First Job Description</span>
              </button>
            }
          />
        ) : (
          /* Jobs Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all hover:shadow-md hover:border-slate-300"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Badge variant={getLevelVariant(job.experienceLevel)} size="sm">
                      {job.experienceLevel}
                    </Badge>

                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Calendar className="h-3 w-3" />
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Title & Company */}
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight line-clamp-1">
                    {job.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{job.company}</span>
                  </div>

                  {/* Content Preview */}
                  <p className="mt-3 text-xs text-slate-600 line-clamp-3 leading-relaxed bg-slate-50 rounded-lg p-2.5 border border-slate-100 font-mono">
                    {job.rawText}
                  </p>
                </div>

                {/* Bottom Actions */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedJob(job)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                      title="View full job posting"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-400" />
                      <span>View</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(job.id)}
                      disabled={deletingId === job.id}
                      className="inline-flex items-center p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                      title="Delete job posting"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <Link
                    href={`/analysis?jobId=${job.id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Match Resume</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Job Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Add Target Job Posting</h3>
                  <p className="text-xs text-slate-500">
                    Paste raw job specifications (min 100, max 20,000 characters).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Sample Button */}
            <div className="pt-4 pb-2 flex justify-between items-center">
              <span className="text-xs text-slate-500">Evaluating the platform?</span>
              <button
                type="button"
                onClick={handleLoadSample}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 cursor-pointer"
              >
                <Sparkles className="h-3 w-3" />
                <span>Load Sample Job Posting</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 py-2 pr-1" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Junior Full-Stack Developer"
                    className={`block w-full rounded-lg border px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                      fieldErrors.title ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300 bg-white'
                    }`}
                  />
                  {fieldErrors.title && (
                    <p className="mt-1 text-xs text-rose-600">{fieldErrors.title}</p>
                  )}
                </div>

                {/* Company */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g. Stripe, FinTech Innovators"
                    className={`block w-full rounded-lg border px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                      fieldErrors.company ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300 bg-white'
                    }`}
                  />
                  {fieldErrors.company && (
                    <p className="mt-1 text-xs text-rose-600">{fieldErrors.company}</p>
                  )}
                </div>
              </div>

              {/* Experience Level Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Experience Seniority
                </label>
                <div className="flex flex-wrap gap-2">
                  {EXPERIENCE_LEVELS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setFormData({ ...formData, experienceLevel: level })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                        formData.experienceLevel === level
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Job Description Text *
                  </label>
                  {/* Live Character Counter */}
                  <span
                    className={`text-xs font-mono font-medium ${
                      charCount === 0
                        ? 'text-slate-400'
                        : isContentValid
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {charCount.toLocaleString()} / 20,000 characters{' '}
                    {charCount > 0 && charCount < 100 && '(min 100 required)'}
                  </span>
                </div>
                <textarea
                  rows={9}
                  value={formData.rawText}
                  onChange={(e) => setFormData({ ...formData, rawText: e.target.value })}
                  placeholder="Paste the full job requirements, tech stack keywords, and responsibilities here..."
                  className={`block w-full rounded-lg border p-3 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                    fieldErrors.rawText ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300 bg-white'
                  }`}
                />
                {fieldErrors.rawText && (
                  <p className="mt-1 text-xs text-rose-600">{fieldErrors.rawText}</p>
                )}
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !isContentValid}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 cursor-pointer shadow-xs"
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
          </div>
        </div>
      )}

      {/* Full Job View Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedJob.title}</h3>
                <p className="text-xs text-slate-500">
                  {selectedJob.company} • {selectedJob.experienceLevel} Level •{' '}
                  {selectedJob.rawText.length.toLocaleString()} characters
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-4 rounded-xl bg-slate-50 p-4 border border-slate-200">
              <pre className="whitespace-pre-wrap font-mono text-xs text-slate-800 leading-relaxed">
                {selectedJob.rawText}
              </pre>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <div className="text-xs text-slate-500">
                Created on {new Date(selectedJob.createdAt).toLocaleDateString()}
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/analysis?jobId=${selectedJob.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Match a Resume to This Job</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedJob(null)}
                  className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
