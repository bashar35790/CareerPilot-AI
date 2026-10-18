import { BarChart3, Map, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui';
import { HeroSection } from '@/components/home/HeroSection';

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <HeroSection />

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
