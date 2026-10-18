'use client';

import { useId, useRef, useState } from 'react';
import Image from 'next/image';
import type { Variants } from 'motion/react';
import { motion, useReducedMotion } from 'motion/react';
import { Minus, Plus } from 'lucide-react';
import { TimelineAnimation } from '@/components/ui/timeline-animation';

const LINKEDIN_URL = 'https://www.linkedin.com/';

type Faq = {
  question: string;
  answer: string;
};

const FAQS: Faq[] = [
  {
    question: 'What exactly does CareerPilot AI do?',
    answer:
      'It turns a fuzzy job hunt into a measurable one. Upload your resume, paste a job description, and CareerPilot returns an explainable match score, a breakdown of matched, missing-required, and preferred skills, and concrete recommendations to close the gap.',
  },
  {
    question: 'How is the match score calculated?',
    answer:
      'Scores come from a hybrid engine: deterministic skill extraction and weighting run first, then Gemini 2.5 Flash adds structured reasoning for nuance. Because the deterministic layer leads, results stay reproducible and grounded in your actual profile rather than a black box.',
  },
  {
    question: 'Who is CareerPilot AI built for?',
    answer:
      'Software engineers, career switchers, and anyone targeting technical roles who wants evidence instead of guesswork. It supports students preparing for a first role as well as experienced developers aiming at senior positions.',
  },
  {
    question: 'Is my resume data secure?',
    answer:
      'Yes. Sessions use HttpOnly cookies, and every resume, match, and roadmap record is tied to your account through relational, access-controlled data models. Nothing is stored in a shared pool.',
  },
  {
    question: 'Do the career roadmaps actually help?',
    answer:
      'Each identified gap becomes a three-phase milestone plan with checkable tasks. Progress is saved to your account, so the roadmap evolves with you instead of resetting every session.',
  },
  {
    question: 'Can I use it without generating a match first?',
    answer:
      'You can manage resumes and job postings independently, but match analysis and roadmaps are most valuable once a target job is linked. Start with one resume and one posting to see the full loop.',
  },
];

type FaqCardProps = {
  question: string;
  answer: string;
  animationNum: number;
  timelineRef: React.RefObject<HTMLDivElement | null>;
};

export function FaqCard({
  question,
  answer,
  animationNum,
  timelineRef,
}: FaqCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const contentId = useId();
  const reduceMotion = useReducedMotion();

  return (
    <TimelineAnimation
      animationNum={animationNum}
      timelineRef={timelineRef}
      className="rounded-2xl border border-white/10 bg-white/5"
    >
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className="flex w-full cursor-pointer items-center justify-between gap-4 p-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:p-4"
      >
        <span className="text-lg font-medium text-white sm:text-xl">
          {question}
        </span>

        <span className="relative grid size-10 place-items-center rounded-lg border border-white/10 bg-white/10 text-white shadow-sm">
          {isOpen ? <Minus size={20} /> : <Plus size={20} />}
        </span>
      </button>

      <motion.div
        id={contentId}
        role="region"
        initial={false}
        animate={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
        transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
        className="grid overflow-hidden px-2 sm:px-4"
      >
        <div className="overflow-hidden">
          <p className="pb-6 text-sm leading-relaxed text-neutral-300 sm:text-base">
            {answer}
          </p>
        </div>
      </motion.div>
    </TimelineAnimation>
  );
}

export function FaqSection() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const revealVariants: Variants = {
    hidden: reduceMotion
      ? { opacity: 1, y: 0, filter: 'blur(0px)' }
      : { opacity: 0, y: 0, filter: 'blur(20px)' },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { delay: i * (reduceMotion ? 0 : 0.06), duration: 0.5 },
    }),
  };

  return (
    <section
      id="faq"
      ref={timelineRef}
      className="relative overflow-hidden bg-black px-4 py-24 text-white sm:px-6"
    >
      {/* Masked accent field — fine diagonal hatch */}
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.06)_0px_1px,transparent_1px_8px)] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      <div className="relative mx-auto max-w-5xl">
        <TimelineAnimation
          timelineRef={timelineRef}
          animationNum={0}
          customVariants={revealVariants}
          as="h2"
          className="mb-14 text-center font-display text-4xl font-medium tracking-tight text-white md:text-5xl"
        >
          Frequently Asked Questions
        </TimelineAnimation>

        <div className="grid gap-8 md:grid-cols-12 md:gap-10">
          {/* Founder panel */}
          <TimelineAnimation
            timelineRef={timelineRef}
            animationNum={1}
            customVariants={revealVariants}
            className="col-span-5 h-fit rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4 lg:p-5"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 overflow-hidden rounded-xl bg-white/10 sm:size-16">
                <Image
                  src="/Abul Bashar.jpg"
                  alt="Abul Bashar"
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white sm:text-xl">
                  Abul Bashar
                </h3>
                <p className="font-medium text-neutral-400">Founder &amp; CEO</p>
              </div>
            </div>

            <p className="my-4 text-base text-neutral-300 sm:my-5 sm:text-lg">
              &ldquo;I built CareerPilot because job seekers deserve reasons, not
              just scores.&rdquo;
            </p>

            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 p-3 font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <svg
                preserveAspectRatio="xMidYMid"
                viewBox="0 0 256 256"
                aria-hidden="true"
                className="w-6"
              >
                <path
                  d="M218.123 218.127h-37.931v-59.403c0-14.165-.253-32.4-19.728-32.4-19.756 0-22.779 15.434-22.779 31.369v60.43h-37.93V95.967h36.413v16.694h.51a39.907 39.907 0 0 1 35.928-19.733c38.445 0 45.533 25.288 45.533 58.186l-.016 67.013ZM56.955 79.27c-12.157.002-22.014-9.852-22.016-22.009-.002-12.157 9.851-22.014 22.008-22.016 12.157-.003 22.014 9.851 22.016 22.008A22.013 22.013 0 0 1 56.955 79.27m18.966 138.858H37.95V95.967h37.97v122.16ZM237.033.018H18.89C8.58-.098.125 8.161-.001 18.471v219.053c.122 10.315 8.576 18.582 18.89 18.474h218.144c10.336.128 18.823-8.139 18.966-18.474V18.454c-.147-10.33-8.635-18.588-18.966-18.453"
                  fill="#ffffff"
                />
              </svg>
              Connect on LinkedIn
            </a>
          </TimelineAnimation>

          {/* FAQs */}
          <div className="col-span-7 space-y-4">
            {FAQS.map((faq, i) => (
              <FaqCard
                key={faq.question}
                {...faq}
                animationNum={i + 2}
                timelineRef={timelineRef}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default FaqSection;
