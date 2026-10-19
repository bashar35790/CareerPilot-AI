"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Check,
  Eye,
  FileText,
  Plus,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { ApiResponse, Resume, ResumeSummary } from "@/types";
import {
  Badge,
  CardSkeleton,
  ConfirmDialog,
  EmptyState,
  Modal,
  useToast,
} from "@/components/ui";
import { createResumeSchema } from "@/schemas/resume.schema";

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

const inputBase =
  "block w-full rounded-lg border bg-white/5 px-3.5 py-2 text-sm text-white placeholder:text-neutral-500 transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500";

export default function ResumesPage() {
  const toast = useToast();

  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [isViewLoading, setIsViewLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ResumeSummary | null>(
    null,
  );

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    targetRole: "",
    content: "",
    isPrimary: false,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const fetchResumes = useCallback(async () => {
    try {
      setIsLoading(true);
      const response =
        await api.get<ApiResponse<{ resumes: ResumeSummary[] }>>("/resumes");
      if (response.data.success && response.data.data) {
        setResumes(response.data.data.resumes);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load resumes."));
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const handleOpenCreateModal = () => {
    setFormData({
      title: "",
      targetRole: "",
      content: "",
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
      title: "Full-Stack Developer Resume",
      targetRole: "Junior Full-Stack Engineer",
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
        "/resumes",
        validationResult.data,
      );
      if (response.data.success && response.data.data?.resume) {
        toast.success("Resume saved successfully!");
        handleCloseModal();
        fetchResumes();
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to save resume."));
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
      toast.error(
        getApiErrorMessage(error, "Failed to update primary status."),
      );
    }
  };

  const handleViewResume = async (id: string) => {
    setIsViewLoading(true);
    try {
      const response = await api.get<ApiResponse<{ resume: Resume }>>(
        `/resumes/${id}`,
      );
      if (response.data.success && response.data.data?.resume) {
        setSelectedResume(response.data.data.resume);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load resume."));
    } finally {
      setIsViewLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmTarget) return;
    const id = confirmTarget.id;

    setDeletingId(id);
    try {
      await api.delete(`/resumes/${id}`);
      toast.success("Resume deleted successfully.");
      if (selectedResume?.id === id) {
        setSelectedResume(null);
      }
      setConfirmTarget(null);
      fetchResumes();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete resume."));
    } finally {
      setDeletingId(null);
    }
  };

  const charCount = formData.content.length;
  const isContentValid = charCount >= 100 && charCount <= 20000;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-medium tracking-tight text-white sm:text-3xl">
              Resume Management
            </h1>
            <Badge variant="info" size="sm">
              {resumes.length} {resumes.length === 1 ? "Resume" : "Resumes"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-neutral-400">
            Create, manage, and benchmark your engineering resumes against
            target job postings.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Plus className="h-4 w-4" />
          <span>Add Resume</span>
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
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <Plus className="h-4 w-4" />
                <span>Create First Resume</span>
              </button>
            }
          />
        ) : (
          /* Resumes Cards Grid */
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className={`relative flex flex-col justify-between rounded-2xl border bg-white/5 p-6 shadow-xs transition-all hover:bg-white/10 ${
                  resume.isPrimary
                    ? "border-blue-500/40 ring-2 ring-blue-500/20"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="mb-3 flex items-center justify-between gap-2">
                    {resume.isPrimary ? (
                      <Badge variant="info" size="sm" dot>
                        Primary Resume
                      </Badge>
                    ) : (
                      <span className="text-xs text-neutral-500">
                        Secondary
                      </span>
                    )}

                    <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                      <Calendar className="h-3 w-3" />
                      {new Date(resume.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Title & Role */}
                  <h3 className="line-clamp-1 text-lg font-bold tracking-tight text-white">
                    {resume.title}
                  </h3>
                  <p className="mt-0.5 line-clamp-1 text-xs font-medium text-neutral-400">
                    {resume.targetRole || "General Engineering Role"}
                  </p>

                  {/* Meta */}
                  <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 p-2.5 text-xs text-neutral-400">
                    <Calendar className="h-3.5 w-3.5 text-neutral-500" />
                    <span>
                      Updated {new Date(resume.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-6 flex items-center justify-between gap-2 border-t border-white/10 pt-4">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleViewResume(resume.id)}
                      disabled={isViewLoading}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs font-medium text-neutral-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                      title="View full resume text"
                    >
                      <Eye className="h-3.5 w-3.5 text-neutral-400" />
                      <span>View</span>
                    </button>

                    {!resume.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(resume)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:bg-blue-500/10 hover:text-blue-300 hover:border-blue-500/40"
                        title="Set as primary resume"
                      >
                        <Star className="h-3.5 w-3.5 text-neutral-400" />
                        <span>Primary</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setConfirmTarget(resume)}
                      disabled={deletingId === resume.id}
                      className="inline-flex cursor-pointer items-center rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-50"
                      title="Delete resume"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <Link
                    href={`/analysis?resumeId=${resume.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-blue-500/40 bg-blue-600/20 px-2.5 py-1.5 text-xs font-semibold text-blue-200 transition-colors hover:bg-blue-600/30"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                    <span>Analyze</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Resume Modal */}
      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        title="Add New Resume"
        description="Paste or type your resume content (min 100, max 20,000 characters)."
        icon={FileText}
        tone="blue"
        size="md"
      >
        {/* Quick Sample Button */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs text-neutral-400">
            Need a starting point?
          </span>
          <button
            type="button"
            onClick={handleLoadSample}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-blue-500/40 bg-blue-600/20 px-2.5 py-1 text-xs font-semibold text-blue-200 transition-colors hover:bg-blue-600/30"
          >
            <Sparkles className="h-3 w-3" />
            <span>Load Sample Template</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-2" noValidate>
          {/* Title */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Resume Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g. Full-Stack Software Engineer CV"
              className={`${inputBase} ${
                fieldErrors.title
                  ? "border-rose-400/60 bg-rose-500/10"
                  : "border-white/10"
              }`}
            />
            {fieldErrors.title && (
              <p className="mt-1 text-xs text-rose-300">{fieldErrors.title}</p>
            )}
          </div>

          {/* Target Role */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Target Role{" "}
              <span className="font-normal lowercase text-neutral-500">
                (optional)
              </span>
            </label>
            <input
              type="text"
              value={formData.targetRole}
              onChange={(e) =>
                setFormData({ ...formData, targetRole: e.target.value })
              }
              placeholder="e.g. Junior Backend Engineer"
              className={`${inputBase} border-white/10`}
            />
          </div>

          {/* Content Textarea */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300">
                Resume Content *
              </label>
              {/* Live Character Counter */}
              <span
                className={`font-mono text-xs font-medium ${
                  charCount === 0
                    ? "text-neutral-500"
                    : isContentValid
                      ? "text-emerald-400"
                      : "text-rose-400"
                }`}
              >
                {charCount.toLocaleString()} / 20,000 characters{" "}
                {charCount > 0 && charCount < 100 && "(min 100 required)"}
              </span>
            </div>
            <textarea
              rows={9}
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              placeholder="Paste your plain-text or Markdown resume here (e.g. Summary, Skills, Work Experience, Projects)..."
              className={`${inputBase} font-mono text-xs ${
                fieldErrors.content
                  ? "border-rose-400/60 bg-rose-500/10"
                  : "border-white/10"
              }`}
            />
            {fieldErrors.content && (
              <p className="mt-1 text-xs text-rose-300">
                {fieldErrors.content}
              </p>
            )}
          </div>

          {/* Set Primary Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              id="isPrimary"
              type="checkbox"
              checked={formData.isPrimary}
              onChange={(e) =>
                setFormData({ ...formData, isPrimary: e.target.checked })
              }
              className="h-4 w-4 rounded border-white/20 bg-white/5 accent-blue-600"
            />
            <label
              htmlFor="isPrimary"
              className="cursor-pointer text-xs font-medium text-neutral-300"
            >
              Set as my primary resume for evaluations
            </label>
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
      </Modal>

      {/* Full Resume View Modal */}
      <Modal
        open={Boolean(selectedResume)}
        onClose={() => setSelectedResume(null)}
        title={selectedResume?.title ?? ""}
        description={
          selectedResume
            ? `${selectedResume.targetRole || "Engineering Candidate"} • ${selectedResume.content.length.toLocaleString()} characters`
            : undefined
        }
        icon={FileText}
        tone="blue"
        size="lg"
        footer={
          <>
            {selectedResume && (
              <Link
                href={`/analysis?resumeId=${selectedResume.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Analyze This Resume</span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => setSelectedResume(null)}
              className="cursor-pointer rounded-lg border border-white/15 px-3.5 py-1.5 text-xs font-semibold text-neutral-200 transition-colors hover:bg-white/10"
            >
              Close
            </button>
          </>
        }
      >
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-neutral-200">
            {selectedResume?.content}
          </pre>
        </div>
        {selectedResume && (
          <p className="mt-3 text-xs text-neutral-500">
            Created on {new Date(selectedResume.createdAt).toLocaleDateString()}
          </p>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title="Delete this resume?"
        description={
          confirmTarget
            ? `"${confirmTarget.title}" will be permanently removed. This action cannot be undone.`
            : undefined
        }
        confirmLabel="Delete Resume"
        isConfirming={Boolean(confirmTarget && deletingId === confirmTarget.id)}
        onConfirm={handleConfirmDelete}
        onClose={() => setConfirmTarget(null)}
      />
    </div>
  );
}
