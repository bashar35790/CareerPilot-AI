'use client';

import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CheckCircle2, Compass, ShieldCheck, Zap } from 'lucide-react';

const TRUST = [
  { icon: CheckCircle2, label: 'Hybrid Deterministic + Gemini 2.5 Flash' },
  { icon: ShieldCheck, label: 'Secure HttpOnly Cookie Sessions' },
  { icon: Zap, label: 'Zero Mock Production Responses' },
];

type AuthShellProps = {
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
};

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  const reduceMotion = useReducedMotion();

  const reveal = (delay: number) => ({
    initial: reduceMotion ? (false as const) : { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.5, ease: 'easeOut' as const, delay },
  });

  return (
    <section className="relative flex min-h-svh items-center overflow-hidden bg-black px-4 pb-16 pt-28 text-white sm:px-6">
      {/* Masked accent field — fine diagonal hatch */}
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.06)_0px_1px,transparent_1px_8px)] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      {/* Soft blue glow for continuity with the hero */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(31,70,154,0.35)_0%,transparent_70%)]" />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Brand panel */}
        <motion.div {...reveal(0)} className="hidden lg:block">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-white text-blue-600">
              <Compass className="size-6" aria-hidden="true" />
            </span>
            <span className="text-lg font-bold tracking-tight">
              CareerPilot AI
            </span>
          </div>

          <h2 className="mt-8 text-balance font-display text-4xl font-medium leading-[115%] tracking-tight md:text-5xl">
            Match your resume to real jobs with explainable AI
          </h2>
          <p className="mt-5 max-w-md text-lg font-light text-neutral-400">
            Compare your technical profile against target job descriptions,
            uncover verified skill gaps, and track tailored milestone roadmaps.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-neutral-400">
            {TRUST.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2">
                <Icon className="size-4 text-blue-400" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Form card */}
        <motion.div {...reveal(0.12)} className="mx-auto w-full max-w-md">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md sm:p-8">
            <div className="mb-5 flex justify-center lg:hidden">
              <span className="flex size-11 items-center justify-center rounded-xl bg-white text-blue-600">
                <Compass className="size-6" aria-hidden="true" />
              </span>
            </div>

            <div className="mb-6 text-center lg:text-left">
              <h1 className="font-display text-3xl font-medium tracking-tight text-white">
                {title}
              </h1>
              <p className="mt-2 text-sm text-neutral-400">{subtitle}</p>
            </div>

            {children}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default AuthShell;
