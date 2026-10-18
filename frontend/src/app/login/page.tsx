'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Compass,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Play,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/store/auth-context';
import { ToastAlert, useToast } from '@/components/ui';
import { loginSchema } from '@/schemas/auth.schema';
import { getApiErrorMessage } from '@/lib/api';

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
    <div className="flex min-h-[calc(100vh-8rem)] flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Icon & Heading */}
        <div className="flex justify-center mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-tr from-indigo-600 to-indigo-500 text-white shadow-md">
            <Compass className="h-7 w-7" aria-hidden="true" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Or{' '}
          <Link
            href="/register"
            className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
          >
            create a new account for free
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          {/* One-Click Demo Access Box for Assessor */}
          <div className="mb-6 rounded-xl border border-indigo-200/80 bg-linear-to-br from-indigo-50/90 to-purple-50/50 p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                Assessment Evaluator Access
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              One-click instant login using the pre-seeded demo reviewer account (
              <span className="font-mono text-indigo-900">demo@careerpilot.internal</span>).
            </p>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={isDemoSubmitting || isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-indigo-500 disabled:opacity-50 cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-white text-white" />
              <span>
                {isDemoSubmitting
                  ? 'Establishing Demo Session...'
                  : 'One-Click Demo Login'}
              </span>
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-medium">
                Or sign in with email
              </span>
            </div>
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
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
              >
                Email Address
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
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
                  className={`block w-full rounded-lg border pl-10 pr-3 py-2.5 text-sm text-slate-900 transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                    fieldErrors.email
                      ? 'border-rose-300 bg-rose-50/30'
                      : 'border-slate-300 bg-white hover:border-slate-400'
                  }`}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                />
              </div>
              {fieldErrors.email && (
                <p id="email-error" className="mt-1 text-xs text-rose-600">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
              >
                Password
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
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
                  className={`block w-full rounded-lg border pl-10 pr-10 py-2.5 text-sm text-slate-900 transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                    fieldErrors.password
                      ? 'border-rose-300 bg-rose-50/30'
                      : 'border-slate-300 bg-white hover:border-slate-400'
                  }`}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
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
                <p id="password-error" className="mt-1 text-xs text-rose-600">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || isDemoSubmitting}
                className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-indigo-500 disabled:opacity-50 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
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
        </div>

        {/* Security Notice */}
        <p className="mt-4 text-center text-xs text-slate-500">
          Protected by HttpOnly SameSite=Lax cookie authentication.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
