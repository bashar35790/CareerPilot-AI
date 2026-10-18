'use client';

import { useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { Variants } from 'motion/react';
import { ArrowRight, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { TimelineAnimation } from '@/components/ui/timeline-animation';

const ShaderBackground = dynamic(
  () => import('@/components/home/ShaderBackground'),
  { ssr: false }
);

const revealVariants: Variants = {
  hidden: { filter: 'blur(20px)', opacity: 0, y: 0 },
  visible: (i: number) => ({
    filter: 'blur(0px)',
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5 },
  }),
};

export function HeroSection() {
  const timelineRef = useRef<HTMLDivElement>(null);

  return (
    <section
      ref={timelineRef}
      className="relative flex min-h-[100svh] w-full flex-col overflow-hidden bg-black text-white"
    >
      <ShaderBackground />

      {/* Main content */}
      <div className="relative z-10 mb-10 flex grow flex-col items-center justify-center px-4 pt-24 text-center">
        <TimelineAnimation
          timelineRef={timelineRef}
          animationNum={3}
          customVariants={revealVariants}
          className="flex items-center gap-2 rounded-2xl border border-blue-800 bg-blue-800/50 p-1 pr-3 backdrop-blur-lg"
        >
          <span className="rounded-lg bg-blue-600 px-2 py-0.5 text-sm font-semibold text-white">
            New
          </span>
          <span>AI resume ↔ job matching with explainable scores</span>
        </TimelineAnimation>

        <TimelineAnimation
          timelineRef={timelineRef}
          as="h1"
          animationNum={4}
          customVariants={revealVariants}
          className="my-5 max-w-5xl font-display text-5xl font-medium leading-[120%] tracking-tight md:text-7xl"
        >
          Match your resume to real jobs with explainable AI
        </TimelineAnimation>

        <TimelineAnimation
          timelineRef={timelineRef}
          as="p"
          animationNum={5}
          customVariants={revealVariants}
          className="mb-10 max-w-xl text-lg font-light text-neutral-300 md:text-xl"
        >
          Compare your technical profile against target job descriptions, uncover
          verified skill gaps, and track tailored milestone roadmaps to land your
          next engineering role.
        </TimelineAnimation>

        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <TimelineAnimation
            timelineRef={timelineRef}
            animationNum={6}
            customVariants={revealVariants}
          >
            <Link
              href="/register"
              className="flex items-center gap-2 rounded-sm bg-white px-6 py-3 font-semibold text-black transition hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Get Started Free <ArrowRight size={18} />
            </Link>
          </TimelineAnimation>
          <TimelineAnimation
            timelineRef={timelineRef}
            animationNum={7}
            customVariants={revealVariants}
          >
            <Link
              href="/login"
              className="relative flex items-center rounded-sm border border-white/20 bg-white/10 px-8 py-3 font-semibold text-white backdrop-blur-md transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Sign in / Demo
            </Link>
          </TimelineAnimation>
        </div>
      </div>

      {/* Value propositions */}
      <div className="relative z-10 flex flex-col items-center py-16">
        <TimelineAnimation
          timelineRef={timelineRef}
          as="p"
          animationNum={7}
          customVariants={revealVariants}
          className="mb-8 text-center text-neutral-400 md:text-xl"
        >
          Built for developers who want{' '}
          <span className="font-medium text-white">
            verified, explainable results
          </span>
        </TimelineAnimation>
        <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-neutral-400">
          <TimelineAnimation
            timelineRef={timelineRef}
            animationNum={8}
            customVariants={revealVariants}
            className="flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4 text-blue-400" />
            Hybrid Deterministic + Gemini 2.5 Flash
          </TimelineAnimation>
          <TimelineAnimation
            timelineRef={timelineRef}
            animationNum={9}
            customVariants={revealVariants}
            className="flex items-center gap-2"
          >
            <ShieldCheck className="h-4 w-4 text-blue-400" />
            Secure HttpOnly Cookie Sessions
          </TimelineAnimation>
          <TimelineAnimation
            timelineRef={timelineRef}
            animationNum={10}
            customVariants={revealVariants}
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4 text-blue-400" />
            Zero Mock Production Responses
          </TimelineAnimation>
        </div>
      </div>
    </section>
  );
}
