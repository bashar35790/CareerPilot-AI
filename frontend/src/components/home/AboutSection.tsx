'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

const REVEAL = { opacity: 0, y: 24 };

export function AboutSection() {
  const reduceMotion = useReducedMotion();

  const reveal = (delay = 0) => ({
    initial: reduceMotion ? (false as const) : REVEAL,
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.5, ease: 'easeOut' as const, delay },
  });

  return (
    <section
      id="about"
      className="relative overflow-hidden bg-black px-6 py-24 text-white md:px-12 lg:px-24"
    >
      {/* Masked accent field — fine diagonal hatch */}
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.06)_0px_1px,transparent_1px_8px)] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      {/* Soft blue glow anchored to the top for continuity with the hero */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(31,70,154,0.35)_0%,transparent_70%)]" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-16 lg:flex-row">
        {/* Primary portrait */}
        <motion.div
          {...reveal(0)}
          className="relative w-full max-w-sm shrink-0"
        >
          <div className="relative aspect-5/6 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <Image
              src="/Abul Bashar.jpg"
              alt="Abul Bashar, creator of CareerPilot AI"
              fill
              sizes="(max-width: 1024px) 80vw, 384px"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-12 -left-4">
            <div className="font-display text-2xl italic text-white -rotate-6">
              Abul Bashar
              <div className="h-px w-48 -mt-1 bg-white/30" />
            </div>
          </div>
        </motion.div>

        {/* Story */}
        <motion.div
          {...reveal(0.12)}
          className="flex-1 space-y-8"
        >
          <div className="inline-flex items-center gap-2 text-sm font-medium text-blue-400">
            <span>« About CareerPilot »</span>
          </div>

          <h2 className="text-balance font-display text-5xl font-medium tracking-tight text-white md:text-6xl">
            Careers, decoded with explainable AI
          </h2>

          <div className="max-w-2xl space-y-6">
            <p className="text-pretty text-xl leading-relaxed text-neutral-300">
              CareerPilot AI turns an opaque job hunt into a transparent
              process. We compare your resume against real job descriptions,
              surface verified skill gaps, and score your fit with reasoning
              you can actually read.
            </p>
            <p className="text-pretty text-xl leading-relaxed text-neutral-300">
              Built on a hybrid engine that blends deterministic matching with
              Gemini 2.5 Flash, every score, badge, and roadmap milestone is
              reproducible and grounded in your own profile.
            </p>
          </div>

          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Link
              href="/register"
              className="group flex items-center gap-3 rounded-full bg-blue-600 px-8 py-4 font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Get Started Free
              <span className="flex size-8 items-center justify-center rounded-full bg-white text-blue-600 transition-transform group-hover:translate-x-1">
                <ArrowRight size={16} />
              </span>
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-white/20 bg-white/10 px-8 py-4 font-semibold text-white backdrop-blur-md transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Sign in / Demo
            </Link>
          </div>
        </motion.div>

        {/* Playful portrait cards — signature overlapping rotation */}
        <motion.div
          {...reveal(0.24)}
          className="hidden w-48 shrink-0 flex-col gap-6 self-end lg:flex"
        >
          <div className="relative aspect-square rotate-6 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl">
            <Image
              src="https://images.unsplash.com/photo-1765779038142-054a9f8c2268?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt=""
              fill
              sizes="192px"
              className="object-cover"
            />
          </div>
          <div className="relative -mt-2 aspect-square -rotate-6 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl">
            <Image
              src="https://images.unsplash.com/photo-1764703495149-f09b0aa607c3?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt=""
              fill
              sizes="192px"
              className="object-cover"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default AboutSection;
