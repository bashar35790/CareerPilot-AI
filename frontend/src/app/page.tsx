import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Map,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui';

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.100),white)] opacity-60" />
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-6">
            <Badge variant="info" dot>
              Full-Stack Developer Assessment Platform
            </Badge>
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Align Your Resume with Real Job Postings Using{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
              Explainable AI
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 leading-relaxed">
            Stop guessing why applications fail. Compare your technical profile
            against target job descriptions, uncover verified skill gaps, and
            track tailored milestone roadmaps to land your next engineering role.
          </p>

          {/* Call to Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-md transition-all hover:bg-indigo-500 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <span>Get Started Free</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:border-slate-400"
            >
              <span>Sign in / Demo Access</span>
            </Link>
          </div>

          {/* Key Value Propositions */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Hybrid Deterministic + Gemini 2.5 Flash</span>
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0" />
              <span>Secure HttpOnly Cookie Sessions</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-500 shrink-0" />
              <span>Zero Mock Production Responses</span>
            </span>
          </div>
        </div>
      </section>

      {/* Feature Pillar Highlights */}
      <section className="border-t border-slate-200/80 bg-white/70 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="purple" className="mb-3">
              Assessment Rubric Mapping
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Engineered with Full-Stack Precision
            </h2>
            <p className="mt-3 text-slate-600">
              Every workflow adheres to relational integrity, explainable business logic, and modern UX design.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="relative rounded-2xl border border-slate-200 bg-white p-7 shadow-xs transition-all hover:shadow-md hover:border-indigo-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-5">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Flagship Match & Gap Engine
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Dual-tier analysis combines canonical skill regex extraction with
                Gemini 2.5 Flash for verified technical accuracy and structured
                JSON output.
              </p>
              <Badge variant="matched" size="sm">
                Hybrid Scoring Formula
              </Badge>
            </div>

            {/* Card 2 */}
            <div className="relative rounded-2xl border border-slate-200 bg-white p-7 shadow-xs transition-all hover:shadow-md hover:border-indigo-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-5">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Explainable Scorecard & Badges
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Clear visual breakdown of Matched, Missing Required, and Preferred
                skills with actionable Google XYZ bullet-point recommendations.
              </p>
              <Badge variant="info" size="sm">
                Interactive Score Dial
              </Badge>
            </div>

            {/* Card 3 */}
            <div className="relative rounded-2xl border border-slate-200 bg-white p-7 shadow-xs transition-all hover:shadow-md hover:border-indigo-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 mb-5">
                <Map className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Dynamic Career Roadmaps
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Turn identified technical gaps into a 3-phase milestone plan
                with optimistic task checking and persistent database progress.
              </p>
              <Badge variant="warning" size="sm">
                PostgreSQL Relational Tasks
              </Badge>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
