'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, Play, Sparkles } from 'lucide-react';
import { useAuth } from '@/store/auth-context';
import { ToastAlert, useToast } from '@/components/ui';
import { AuthShell } from '@/components/auth/AuthShell';
import { loginSchema } from '@/schemas/auth.schema';
import { getApiErrorMessage } from '@/lib/api';

const inputClass = (hasError: boolean) =>
  `block w-full rounded-lg border bg-white/5 pl-10 pr-3 py-2.5 text-sm text-white placeholder:text-neutral-500 transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
    hasError ? 'border-rose-400/60 bg-rose-500/10' : 'border-white/10 hover:border-white/20'
  }`;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const { login, demoLogin } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDemoSubmitting, setIsDemoSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (generalError) {
      setGeneralError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    // Client-side Zod Validation
    const validationResult = loginSchema.safeParse(formData);
    if (!validationResult.success) {
      const flattened = validationResult.error.flatten().fieldErrors;
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
    try {
      await login(validationResult.data);
      toast.success('Signed in successfully! Redirecting...');
      router.push(redirectTo);
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'Invalid email or password. Please try again.'
      );
      setGeneralError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setGeneralError(null);
    setIsDemoSubmitting(true);
    try {
      await demoLogin();
      toast.success('Signed in as Demo Reviewer!');
      router.push(redirectTo);
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'Unable to initialize demo session. Please try again.'
      );
      setGeneralError(message);
    } finally {
      setIsDemoSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Sign in to your account"
      subtitle={
        <>
          Or{' '}
          <Link
            href="/register"
            className="font-medium text-blue-400 transition-colors hover:text-blue-300"
          >
            create a new account for free
          </Link>
        </>
      }
    >
      {/* One-Click Demo Access Box for Assessor */}
      <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="mb-1.5 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">
            Assessment Evaluator Access
          </h2>
        </div>
        <p className="mb-3 text-xs leading-relaxed text-neutral-400">
          One-click instant login using the pre-seeded demo reviewer account (
          <span className="font-mono text-blue-300">
            demo@careerpilot.internal
          </span>
          ).
        </p>
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={isDemoSubmitting || isSubmitting}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Play className="h-3.5 w-3.5 fill-white text-white" />
          <span>
            {isDemoSubmitting
              ? 'Establishing Demo Session...'
              : 'One-Click Demo Login'}
          </span>
        </button>
      </div>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-xs font-medium uppercase text-neutral-500">
          Or sign in with email
        </span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      {/* Error Banner */}
      {generalError && (
        <div className="mb-5">
          <ToastAlert
            variant="error"
            message={generalError}
            onClose={() => setGeneralError(null)}
          />
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-300"
          >
            Email Address
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
              <Mail className="h-4 w-4" aria-hidden="true" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="alex@example.com"
              className={inputClass(Boolean(fieldErrors.email))}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            />
          </div>
          {fieldErrors.email && (
            <p id="email-error" className="mt-1 text-xs text-rose-300">
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-300"
          >
            Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
              <Lock className="h-4 w-4" aria-hidden="true" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className={`${inputClass(
                Boolean(fieldErrors.password)
              )} pr-10`}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={
                fieldErrors.password ? 'password-error' : undefined
              }
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-neutral-500 hover:text-neutral-300"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {fieldErrors.password && (
            <p id="password-error" className="mt-1 text-xs text-rose-300">
              {fieldErrors.password}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || isDemoSubmitting}
            className="flex w-full cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Signing in...</span>
              </div>
            ) : (
              'Sign in'
            )}
          </button>
        </div>
      </form>

      {/* Security Notice */}
      <p className="mt-6 text-center text-xs text-neutral-500">
        Protected by HttpOnly SameSite=Lax cookie authentication.
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center bg-black">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
