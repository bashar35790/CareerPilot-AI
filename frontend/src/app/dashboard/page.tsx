'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Briefcase,
  FileText,
  Plus,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/store/auth-context';
import { Badge } from '@/components/ui';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-r from-blue-950 via-blue-900 to-black p-8 text-white shadow-md sm:p-10">
        {/* Masked accent field — fine diagonal hatch */}
        <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.06)_0px_1px,transparent_1px_8px)] [mask-image:radial-gradient(ellipse_80%_60%_at_30%_0%,#000_60%,transparent_110%)]" />

        <div className="relative z-10 max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2">
            <span className="rounded-md border border-blue-400/30 bg-blue-500/20 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-blue-200">
              Welcome back
            </span>
            <Badge variant="purple" size="sm">
              {user?.careerLevel || 'ENTRY'} Level
            </Badge>
          </div>
          <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
            Hello, {user?.fullName || 'Candidate'}!
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-blue-100/80 sm:text-base">
            Target Role:{' '}
            <span className="font-semibold text-white">
              {user?.targetRole || 'Software Engineer'}
            </span>
            . Evaluate your resume against target job postings or review your
            milestone progress.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/analysis"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-blue-950 shadow-xs transition-colors hover:bg-blue-50"
            >
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span>Run Match Analysis</span>
            </Link>
            <Link
              href="/resumes"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Resume</span>
            </Link>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-72 w-72 rounded-full bg-blue-600/25 blur-3xl" />
      </div>

      {/* Quick Navigation Cards */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Resume Manager */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xs transition-all hover:border-white/20 hover:bg-white/10">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/15 text-blue-400">
              <FileText className="h-5 w-5" />
            </div>
            <Badge variant="info" size="sm">
              CRUD API
            </Badge>
          </div>
          <h3 className="text-base font-semibold text-white">
            Resume Management
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-neutral-400">
            Create, update, and manage your technical resumes with character
            validation (100–20,000 characters).
          </p>
          <div className="mt-5">
            <Link
              href="/resumes"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300"
            >
              <span>Manage Resumes</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Card 2: Job Ingestion */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xs transition-all hover:border-white/20 hover:bg-white/10">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
              <Briefcase className="h-5 w-5" />
            </div>
            <Badge variant="matched" size="sm">
              PostgreSQL
            </Badge>
          </div>
          <h3 className="text-base font-semibold text-white">
            Target Job Postings
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-neutral-400">
            Save and organize job listings across junior, mid, and senior levels
            to reuse across multiple gap analyses.
          </p>
          <div className="mt-5">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              <span>View Job Catalog</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Card 3: Gap Analysis */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xs transition-all hover:border-white/20 hover:bg-white/10">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/15 text-violet-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <Badge variant="purple" size="sm">
              Flagship AI
            </Badge>
          </div>
          <h3 className="text-base font-semibold text-white">
            Resume–Job Gap Analysis
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-neutral-400">
            Run the hybrid matching engine to receive qualification scores,
            matched skill badges, and bullet point rewrites.
          </p>
          <div className="mt-5">
            <Link
              href="/analysis"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300"
            >
              <span>Start New Analysis</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
