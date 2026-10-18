'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Check,
  Eye,
  FileText,
  Plus,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { api, getApiErrorMessage } from '@/lib/api';
import { ApiResponse, Resume, ResumeSummary } from '@/types';
import { Badge, CardSkeleton, EmptyState, useToast } from '@/components/ui';
import { createResumeSchema } from '@/schemas/resume.schema';

const SAMPLE_RESUME_TEXT = `ALEX DEVELOPER
Full-Stack Software Engineer
Email: alex@example.com | GitHub: github.com/alexdev | Portfolio: alexdev.io

PROFESSIONAL SUMMARY
Results-driven Full-Stack Software Engineer with 2+ years of hands-on experience building scalable web applications. Proficient in TypeScript, React, Next.js, Node.js, Express, PostgreSQL, and Prisma ORM. Passionate about clean architecture, relational database design, and automated testing.

TECHNICAL SKILLS
- Languages: TypeScript, JavaScript, SQL, HTML5, CSS3
- Frontend: React, Next.js, Tailwind CSS, Redux Toolkit
- Backend: Node.js, Express.js, REST APIs, JWT, Bcrypt
- Databases & ORM: PostgreSQL, Prisma ORM, Redis
- DevOps & Tools: Docker, Git, GitHub Actions, Vitest, Postman

WORK EXPERIENCE
Junior Full-Stack Engineer | TechVentures Inc. (2023 – Present)
- Architected and maintained 15+ secure RESTful API endpoints handling 20,000+ daily requests using Express.js and PostgreSQL.
- Implemented HttpOnly cookie-based session authentication with refresh token rotation, eliminating client-side XSS vulnerabilities.
- Optimized relational database queries and indexed Prisma foreign keys, reducing P95 query latency by 35%.
- Built responsive UI dashboards with Next.js and Tailwind CSS, increasing mobile user engagement by 28%.

PROJECTS
Career Alignment & ATS Match Engine
- Built a decoupled full-stack platform using Next.js 15, Express, Prisma, and PostgreSQL.
- Integrated Google Gemini 2.5 Flash for semantic qualification extraction and ATS keyword scoring.
- Implemented automated Vitest test suite achieving 92% coverage across business logic services.`;

export default function ResumesPage() {
  const toast = useToast();

  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [isViewLoading, setIsViewLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    targetRole: '',
    content: '',
    isPrimary: false,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const fetchResumes = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get<ApiResponse<{ resumes: ResumeSummary[] }>>('/resumes');
      if (response.data.success && response.data.data) {
        setResumes(response.data.data.resumes);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load resumes.'));
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const handleOpenCreateModal = () => {
    setFormData({
      title: '',
      targetRole: '',
      content: '',
      isPrimary: resumes.length === 0, // Default to primary if first resume
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
      title: 'Full-Stack Developer Resume',
      targetRole: 'Junior Full-Stack Engineer',
      content: SAMPLE_RESUME_TEXT,
      isPrimary: resumes.length === 0,
    });
    setFieldErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const validationResult = createResumeSchema.safeParse(formData);
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
      const response = await api.post<ApiResponse<{ resume: Resume }>>(
        '/resumes',
        validationResult.data
      );
      if (response.data.success && response.data.data?.resume) {
        toast.success('Resume saved successfully!');
        handleCloseModal();
        fetchResumes();
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to save resume.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetPrimary = async (resume: ResumeSummary) => {
    try {
      await api.put(`/resumes/${resume.id}`, { isPrimary: true });
      toast.success(`"${resume.title}" marked as primary resume.`);
      fetchResumes();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update primary status.'));
    }
  };

  const handleViewResume = async (id: string) => {
    setIsViewLoading(true);
    try {
      const response = await api.get<ApiResponse<{ resume: Resume }>>(`/resumes/${id}`);
      if (response.data.success && response.data.data?.resume) {
        setSelectedResume(response.data.data.resume);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load resume.'));
    } finally {
      setIsViewLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) {
      return;
    }

    setDeletingId(id);
    try {
      await api.delete(`/resumes/${id}`);
      toast.success('Resume deleted successfully.');
      if (selectedResume?.id === id) {
        setSelectedResume(null);
      }
      fetchResumes();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete resume.'));
    } finally {
      setDeletingId(null);
    }
  };

  const charCount = formData.content.length;
  const isContentValid = charCount >= 100 && charCount <= 20000;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Resume Management
            </h1>
            <Badge variant="info" size="sm">
              {resumes.length} {resumes.length === 1 ? 'Resume' : 'Resumes'}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Create, manage, and benchmark your engineering resumes against target job postings.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-indigo-500 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Resume</span>
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
        ) : resumes.length === 0 ? (
          /* Empty State */
          <EmptyState
            icon={FileText}
            title="No resumes created yet"
            description="Create or paste your technical resume to start benchmarking against job postings and uncover missing skills."
            action={
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Create First Resume</span>
              </button>
            }
          />
        ) : (
          /* Resumes Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className={`relative flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-xs transition-all hover:shadow-md ${
                  resume.isPrimary
                    ? 'border-indigo-300 ring-2 ring-indigo-500/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {resume.isPrimary ? (
                      <Badge variant="info" size="sm" dot>
                        Primary Resume
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-400">Secondary</span>
                    )}

                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Calendar className="h-3 w-3" />
                      {new Date(resume.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Title & Role */}
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight line-clamp-1">
                    {resume.title}
                  </h3>
                  <p className="mt-0.5 text-xs font-medium text-slate-500 line-clamp-1">
                    {resume.targetRole || 'General Engineering Role'}
                  </p>

                  {/* Meta */}
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>Updated {new Date(resume.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleViewResume(resume.id)}
                      disabled={isViewLoading}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      title="View full resume text"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-400" />
                      <span>View</span>
                    </button>

                    {!resume.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(resume)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 cursor-pointer"
                        title="Set as primary resume"
                      >
                        <Star className="h-3.5 w-3.5 text-slate-400" />
                        <span>Primary</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(resume.id)}
                      disabled={deletingId === resume.id}
                      className="inline-flex items-center p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                      title="Delete resume"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <Link
                    href={`/analysis?resumeId=${resume.id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Analyze</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Resume Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Add New Resume</h3>
                  <p className="text-xs text-slate-500">
                    Paste or type your resume content (min 100, max 20,000 characters).
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
              <span className="text-xs text-slate-500">Need a starting point?</span>
              <button
                type="button"
                onClick={handleLoadSample}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200 cursor-pointer"
              >
                <Sparkles className="h-3 w-3" />
                <span>Load Sample Template</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 py-2 pr-1" noValidate>
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Resume Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Full-Stack Software Engineer CV"
                  className={`block w-full rounded-lg border px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                    fieldErrors.title ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300 bg-white'
                  }`}
                />
                {fieldErrors.title && (
                  <p className="mt-1 text-xs text-rose-600">{fieldErrors.title}</p>
                )}
              </div>

              {/* Target Role */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Target Role <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.targetRole}
                  onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                  placeholder="e.g. Junior Backend Engineer"
                  className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Content Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Resume Content *
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
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Paste your plain-text or Markdown resume here (e.g. Summary, Skills, Work Experience, Projects)..."
                  className={`block w-full rounded-lg border p-3 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                    fieldErrors.content ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300 bg-white'
                  }`}
                />
                {fieldErrors.content && (
                  <p className="mt-1 text-xs text-rose-600">{fieldErrors.content}</p>
                )}
              </div>

              {/* Set Primary Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="isPrimary"
                  type="checkbox"
                  checked={formData.isPrimary}
                  onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isPrimary" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Set as my primary resume for evaluations
                </label>
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
                      <span>Saving Resume...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Save Resume</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Resume View Modal */}
      {selectedResume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedResume.title}</h3>
                <p className="text-xs text-slate-500">
                  {selectedResume.targetRole || 'Engineering Candidate'} •{' '}
                  {selectedResume.content.length.toLocaleString()} characters
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedResume(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-4 rounded-xl bg-slate-50 p-4 border border-slate-200">
              <pre className="whitespace-pre-wrap font-mono text-xs text-slate-800 leading-relaxed">
                {selectedResume.content}
              </pre>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <div className="text-xs text-slate-500">
                Created on {new Date(selectedResume.createdAt).toLocaleDateString()}
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/analysis?resumeId=${selectedResume.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Analyze This Resume</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedResume(null)}
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
