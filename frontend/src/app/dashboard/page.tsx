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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-linear-to-r from-indigo-900 via-indigo-800 to-slate-900 p-8 sm:p-10 text-white shadow-md">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="rounded-md bg-indigo-500/30 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-200 border border-indigo-400/30">
              Welcome back
            </span>
            <Badge variant="purple" size="sm">
              {user?.careerLevel || 'ENTRY'} Level
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Hello, {user?.fullName || 'Candidate'}!
          </h1>
          <p className="mt-2 text-indigo-200 text-sm sm:text-base leading-relaxed">
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
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-indigo-900 shadow-xs transition-colors hover:bg-indigo-50"
            >
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span>Run Match Analysis</span>
            </Link>
            <Link
              href="/resumes"
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-300/40 bg-indigo-800/40 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-800/60"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Resume</span>
            </Link>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl" />
      </div>

      {/* Quick Navigation Cards */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Resume Manager */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FileText className="h-5 w-5" />
            </div>
            <Badge variant="info" size="sm">
              CRUD API
            </Badge>
          </div>
          <h3 className="text-base font-semibold text-slate-900">
            Resume Management
          </h3>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Create, update, and manage your technical resumes with character
            validation (100–20,000 characters).
          </p>
          <div className="mt-5">
            <Link
              href="/resumes"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-500"
            >
              <span>Manage Resumes</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Card 2: Job Ingestion */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Briefcase className="h-5 w-5" />
            </div>
            <Badge variant="matched" size="sm">
              PostgreSQL
            </Badge>
          </div>
          <h3 className="text-base font-semibold text-slate-900">
            Target Job Postings
          </h3>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Save and organize job listings across junior, mid, and senior levels
            to reuse across multiple gap analyses.
          </p>
          <div className="mt-5">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-500"
            >
              <span>View Job Catalog</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Card 3: Gap Analysis */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <Badge variant="purple" size="sm">
              Flagship AI
            </Badge>
          </div>
          <h3 className="text-base font-semibold text-slate-900">
            Resume–Job Gap Analysis
          </h3>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Run the hybrid matching engine to receive qualification scores,
            matched skill badges, and bullet point rewrites.
          </p>
          <div className="mt-5">
            <Link
              href="/analysis"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-500"
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
