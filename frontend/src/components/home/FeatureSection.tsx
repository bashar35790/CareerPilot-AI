'use client';

import {
  BarChart3,
  Lightbulb,
  Map,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

type Feature = {
  icon: LucideIcon;
  title: string;
  desc: string;
  highlight?: boolean;
};

const FEATURES: Feature[] = [
  {
    icon: BarChart3,
    title: 'Explainable Scorecard & Badges',
    desc: 'Clear visual breakdown of Matched, Missing Required, and Preferred skills with actionable Google XYZ bullet-point recommendations.',
  },
  {
    icon: Sparkles,
    title: 'Flagship Match & Gap Engine',
    desc: 'Dual-tier analysis combines canonical skill regex extraction with Gemini 2.5 Flash for verified technical accuracy and structured JSON output.',
    highlight: true,
  },
  {
    icon: Map,
    title: 'Dynamic Career Roadmaps',
    desc: 'Turn identified technical gaps into a 3-phase milestone plan with optimistic task checking and persistent database progress.',
  },
  {
    icon: Lightbulb,
    title: 'Hybrid AI Reasoning',
    desc: 'Deterministic scoring blended with Gemini 2.5 Flash produces transparent, reproducible qualification scores.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Session Architecture',
    desc: 'HttpOnly cookie sessions and relational Prisma models keep every match and roadmap record trusted end to end.',
  },
];

function FeatureCard({ icon: Icon, title, desc, highlight }: Feature) {
  return (
    <div
      className={cn(
        'group flex flex-col items-center transition-all duration-200',
        highlight && 'md:scale-105'
      )}
    >
      <div
        className={cn(
          'mb-6 flex size-12 items-center justify-center rounded-full transition-colors duration-200',
          highlight
            ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/50'
            : 'border border-white/10 bg-white/5 text-blue-400 group-hover:bg-white/10'
        )}
      >
        <Icon className="size-6" />
      </div>
      <h3 className="mb-3 text-xl font-bold tracking-tight text-white">
        {title}
      </h3>
      <p className="mx-auto max-w-xs text-pretty text-sm leading-relaxed text-neutral-400">
        {desc}
      </p>
    </div>
  );
}

export function FeatureSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-black px-4 py-24 text-white sm:px-6">
      {/* Masked blue horizon — fine diagonal hatch */}
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.06)_0px_1px,transparent_1px_8px)] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      {/* Masked blue horizon — bottom blue radial field */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(125%_125%_at_50%_10%,rgba(0,0,0,0)_40%,rgba(31,70,154,1)_100%)]" />

      <div className="relative mx-auto max-w-7xl text-center">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <h2 className="mb-6 text-balance text-4xl font-bold tracking-tight text-white md:text-5xl">
            Engineered with <br /> Full-Stack Precision
          </h2>
          <p className="mx-auto mb-20 max-w-2xl text-pretty text-lg text-neutral-400">
            Every workflow adheres to relational integrity, explainable business
            logic, and modern UX design.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-3">
          {FEATURES.slice(0, 3).map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}

          <div className="flex flex-col justify-center gap-x-12 gap-y-16 md:col-span-3 md:flex-row">
            {FEATURES.slice(3).map((feature) => (
              <div key={feature.title} className="md:w-1/3">
                <FeatureCard {...feature} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeatureSection;
