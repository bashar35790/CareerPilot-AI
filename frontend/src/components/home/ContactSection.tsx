"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  type ComponentType,
  type FormEvent,
} from "react";
import type { Variants } from "motion/react";
import { useReducedMotion } from "motion/react";
import { ArrowRight, Mail, MapPin } from "lucide-react";
import { TimelineAnimation } from "@/components/ui/timeline-animation";
import { useToast } from "@/components/ui";
import { cn } from "@/lib/utils";
import { contactSchema } from "@/schemas/contact.schema";

const LINKEDIN_URL = "https://www.linkedin.com/in/bashar35790";
const GITHUB_URL = "https://github.com/bashar35790";
const CONTACT_EMAIL = "bashar35790@gmail.com";

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 256 256"
      className={className}
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M218.123 218.127h-37.931v-59.403c0-14.165-.253-32.4-19.728-32.4-19.756 0-22.779 15.434-22.779 31.369v60.43h-37.93V95.967h36.413v16.694h.51a39.907 39.907 0 0 1 35.928-19.733c38.445 0 45.533 25.288 45.533 58.186l-.016 67.013ZM56.955 79.27c-12.157.002-22.014-9.852-22.016-22.009-.002-12.157 9.851-22.014 22.008-22.016 12.157-.003 22.014 9.851 22.016 22.008A22.013 22.013 0 0 1 56.955 79.27m18.966 138.858H37.95V95.967h37.97v122.16ZM237.033.018H18.89C8.58-.098.125 8.161-.001 18.471v219.053c.122 10.315 8.576 18.582 18.89 18.474h218.144c10.336.128 18.823-8.139 18.966-18.474V18.454c-.147-10.33-8.635-18.588-18.966-18.453" />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.5 11.5 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

type Detail = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href?: string;
};

const DETAILS: Detail[] = [
  {
    icon: Mail,
    label: "Email",
    value: CONTACT_EMAIL,
    href: `mailto:${CONTACT_EMAIL}`,
  },
  { icon: MapPin, label: "Location", value: "Remote · Worldwide" },
  {
    icon: LinkedinIcon,
    label: "LinkedIn",
    value: "Connect with the founder",
    href: LINKEDIN_URL,
  },
  {
    icon: GithubIcon,
    label: "GitHub",
    value: "Explore the source",
    href: GITHUB_URL,
  },
];

const initialForm = { fullName: "", email: "", message: "" };

const inputBase =
  "w-full rounded-lg border bg-white/5 px-4 py-3 text-sm text-white placeholder:text-neutral-500 transition-colors hover:border-white/20 focus:outline-hidden focus:ring-2 focus:ring-blue-500";

export function ContactSection() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const toast = useToast();

  const [formData, setFormData] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const revealVariants: Variants = {
    hidden: reduceMotion
      ? { opacity: 1, y: 0, filter: "blur(0px)" }
      : { opacity: 0, y: 0, filter: "blur(20px)" },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { delay: i * (reduceMotion ? 0 : 0.08), duration: 0.5 },
    }),
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});

    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const flattened = result.error.flatten().fieldErrors;
      const errors: Record<string, string> = {};
      Object.entries(flattened).forEach(([key, messages]) => {
        if (messages && messages.length > 0) {
          errors[key] = messages[0];
        }
      });
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    toast.success("Thanks for reaching out — we'll get back to you shortly.");
    setFormData(initialForm);
    setIsSubmitting(false);
  };

  return (
    <section
      id="contact"
      ref={timelineRef}
      className="relative overflow-hidden bg-black px-4 py-24 text-white sm:px-6"
    >
      {/* Masked accent field — fine diagonal hatch */}
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.06)_0px_1px,transparent_1px_8px)] mask-[radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      {/* Soft blue glow for continuity with the hero */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(31,70,154,0.35)_0%,transparent_70%)]" />

      <div className="relative mx-auto max-w-6xl">
        <TimelineAnimation
          timelineRef={timelineRef}
          animationNum={0}
          customVariants={revealVariants}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 text-sm font-medium text-blue-400">
            <span>« Contact »</span>
          </div>
          <h2 className="mt-4 text-balance font-display text-4xl font-medium tracking-tight text-white md:text-5xl">
            Let&rsquo;s build your next move together
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg text-neutral-400">
            Questions about matching, roadmaps, or the platform? Send a note and
            we&rsquo;ll reply.
          </p>
        </TimelineAnimation>

        <div className="mt-14 grid gap-10 md:grid-cols-2">
          {/* Details */}
          <TimelineAnimation
            timelineRef={timelineRef}
            animationNum={1}
            customVariants={revealVariants}
            className="space-y-4"
          >
            {DETAILS.map(({ icon: Icon, label, value, href }) => {
              const inner = (
                <>
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-blue-400">
                    <Icon className="size-5" />
                  </span>

                  <span className="min-w-0">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      {label}
                    </span>
                    <span className="block truncate text-base font-medium text-white">
                      {value}
                    </span>
                  </span>
                </>
              );

              return href ? (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noreferrer" : undefined}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  {inner}
                </a>
              ) : (
                <div
                  key={label}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  {inner}
                </div>
              );
            })}
          </TimelineAnimation>

          {/* Form */}
          <TimelineAnimation
            timelineRef={timelineRef}
            animationNum={2}
            customVariants={revealVariants}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label
                  htmlFor="contact-fullName"
                  className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-300"
                >
                  Full Name
                </label>
                <input
                  id="contact-fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Jane Developer"
                  aria-invalid={Boolean(fieldErrors.fullName)}
                  aria-describedby={
                    fieldErrors.fullName ? "contact-fullName-error" : undefined
                  }
                  className={cn(
                    inputBase,
                    fieldErrors.fullName
                      ? "border-rose-400/60"
                      : "border-white/10",
                  )}
                />
                {fieldErrors.fullName && (
                  <p
                    id="contact-fullName-error"
                    className="mt-1 text-xs text-rose-300"
                  >
                    {fieldErrors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="contact-email"
                  className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-300"
                >
                  Email Address
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jane@example.com"
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={
                    fieldErrors.email ? "contact-email-error" : undefined
                  }
                  className={cn(
                    inputBase,
                    fieldErrors.email
                      ? "border-rose-400/60"
                      : "border-white/10",
                  )}
                />
                {fieldErrors.email && (
                  <p
                    id="contact-email-error"
                    className="mt-1 text-xs text-rose-300"
                  >
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-300"
                >
                  Message
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us what you're working on..."
                  aria-invalid={Boolean(fieldErrors.message)}
                  aria-describedby={
                    fieldErrors.message ? "contact-message-error" : undefined
                  }
                  className={cn(
                    inputBase,
                    "resize-none",
                    fieldErrors.message
                      ? "border-rose-400/60"
                      : "border-white/10",
                  )}
                />
                {fieldErrors.message && (
                  <p
                    id="contact-message-error"
                    className="mt-1 text-xs text-rose-300"
                  >
                    {fieldErrors.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>Send Message</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </TimelineAnimation>
        </div>
      </div>
    </section>
  );
}

export default ContactSection;
