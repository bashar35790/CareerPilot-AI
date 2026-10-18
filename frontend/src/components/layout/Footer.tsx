'use client';

import { useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { motion, useInView, useReducedMotion } from 'motion/react';
import type { Variants } from 'motion/react';
import { useToast } from '@/components/ui';

const SITEMAP_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Gap Analysis', href: '/analysis' },
  { label: 'Resume Management', href: '/resumes' },
  { label: 'Job Postings', href: '/jobs' },
  { label: 'Career Roadmaps', href: '/roadmaps' },
  { label: 'Dashboard', href: '/dashboard' },
];

const SOCIAL_LINKS = [
  { label: 'LinkedIn', href: '#' },
  { label: 'Twitter', href: '#' },
  { label: 'GitHub', href: '#' },
  { label: 'Instagram', href: '#' },
];

const WORDMARK = 'CareerPilot';

const letterVariants: Variants = {
  hidden: { y: '100%' },
  visible: (i: number) => ({
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 12,
      duration: 0.4,
      delay: i * 0.03,
    },
  }),
};

export function Footer() {
  const toast = useToast();
  const reduceMotion = useReducedMotion();
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(wordmarkRef, { amount: 0.3 });
  const [email, setEmail] = useState('');

  const handleSubscribe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) return;
    toast.success('Thanks for subscribing — we will be in touch!');
    setEmail('');
  };

  return (
    <footer className="relative w-full bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 pb-6 pt-14 sm:px-6 lg:px-8">
        <div className="w-full justify-between gap-10 md:flex">
          {/* Newsletter */}
          <div>
            <h2 className="text-3xl font-medium tracking-tight md:text-5xl">
              Let&rsquo;s do great work together
            </h2>
            <div className="pb-6 pt-2 md:w-96">
              <p className="py-4 text-xl text-neutral-400 md:text-2xl">
                Sign up for our newsletter*
              </p>
              <form
                onSubmit={handleSubscribe}
                className="relative flex items-center justify-between overflow-hidden rounded-full border border-white/15 bg-white/5 backdrop-blur-md"
              >
                <label htmlFor="newsletter_email" className="sr-only">
                  Your Email
                </label>
                <input
                  id="newsletter_email"
                  type="email"
                  name="newsletter_email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Your Email *"
                  className="w-full border-none bg-transparent px-6 py-3 text-white placeholder:text-neutral-500 focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Subscribe to newsletter"
                  className="flex h-full shrink-0 cursor-pointer items-center justify-center bg-white px-5 text-black transition hover:bg-neutral-200"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z"
                      fill="#000"
                      fillRule="evenodd"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </form>
            </div>
          </div>

          {/* Link Columns */}
          <div className="flex gap-10">
            <ul>
              <li className="pb-2 text-lg font-semibold text-white">SITEMAP</li>
              {SITEMAP_LINKS.map((link) => (
                <li key={link.label} className="text-base font-medium">
                  <Link
                    href={link.href}
                    className="text-neutral-400 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ul>
              <li className="pb-2 text-lg font-semibold text-white">SOCIAL</li>
              {SOCIAL_LINKS.map((link) => (
                <li key={link.label} className="text-base font-medium">
                  <Link
                    href={link.href}
                    className="text-neutral-400 underline-offset-2 transition-colors hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Wordmark */}
        <div className="my-8 border-y border-white/10 py-4">
          <div
            ref={wordmarkRef}
            aria-hidden="true"
            className="flex w-full items-end justify-between overflow-hidden"
          >
            {WORDMARK.split('').map((letter, index) => (
              <motion.span
                key={`${letter}-${index}`}
                custom={index}
                variants={letterVariants}
                initial={reduceMotion ? false : 'hidden'}
                animate={reduceMotion || isInView ? 'visible' : 'hidden'}
                className="text-5xl font-medium leading-none tracking-tight text-white sm:text-7xl md:text-[7rem] lg:text-[9rem]"
              >
                {letter}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col-reverse justify-between gap-3 py-2 md:flex-row">
          <span className="font-medium text-neutral-500">
            &copy; {new Date().getFullYear()} CareerPilot AI. All Rights Reserved.
          </span>
          <Link
            href="#"
            className="font-semibold text-neutral-300 transition-colors hover:text-white"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
