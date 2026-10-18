import React from 'react';
import Link from 'next/link';
import { Compass, Sparkles, Layers, ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white/70 backdrop-blur-xs text-slate-600 transition-colors">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-slate-900 focus-visible:outline-hidden"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-2xs">
                <Compass className="h-5 w-5" aria-hidden="true" />
              </div>
              <span className="text-base font-bold tracking-tight">
                CareerPilot <span className="text-indigo-600">AI</span>
              </span>
            </Link>
            <p className="max-w-md text-sm text-slate-500 leading-relaxed">
              An intelligent career alignment platform bridging the gap between
              engineering candidates and modern job requirements through
              explainable AI matching, skill gap analysis, and phased roadmaps.
            </p>
            {/* Tech Stack Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200">
                Next.js 15
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200">
                Express.js
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200">
                PostgreSQL + Prisma
              </span>
              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 border border-indigo-200 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Gemini 2.5 Flash
              </span>
            </div>
          </div>

          {/* Core Modules Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Platform Features
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/analysis"
                  className="transition-colors hover:text-indigo-600"
                >
                  Gap Analysis Engine
                </Link>
              </li>
              <li>
                <Link
                  href="/resumes"
                  className="transition-colors hover:text-indigo-600"
                >
                  Resume Management
                </Link>
              </li>
              <li>
                <Link
                  href="/jobs"
                  className="transition-colors hover:text-indigo-600"
                >
                  Target Job Postings
                </Link>
              </li>
              <li>
                <Link
                  href="/roadmaps"
                  className="transition-colors hover:text-indigo-600"
                >
                  Career Roadmaps
                </Link>
              </li>
            </ul>
          </div>

          {/* Assessment & Security Notes */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Architecture & Security
            </h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>HttpOnly Cookie Sessions</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-indigo-600 shrink-0" />
                <span>Prisma Relational Models</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Hybrid Match Formula</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Attribution Bar */}
        <div className="mt-8 border-t border-slate-200/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} CareerPilot AI. Built for the Technical Developer Assessment.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>All Systems Operational</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
