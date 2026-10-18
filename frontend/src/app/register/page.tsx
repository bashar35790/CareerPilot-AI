'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  CheckCircle2,
  Compass,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Play,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '@/store/auth-context';
import { ToastAlert, useToast } from '@/components/ui';
import { registerSchema } from '@/schemas/auth.schema';
import { getApiErrorMessage } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const { register, demoLogin } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    targetRole: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDemoSubmitting, setIsDemoSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Live password checklist validation
  const passwordCriteria = {
    length: formData.password.length >= 8,
    hasUpper: /[A-Z]/.test(formData.password),
    hasLower: /[a-z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
  };

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

    // Client-side Zod validation
    const payload = {
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      ...(formData.targetRole.trim() ? { targetRole: formData.targetRole.trim() } : {}),
    };

    const validationResult = registerSchema.safeParse(payload);
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
      await register(validationResult.data);
      toast.success('Account created successfully! Welcome to CareerPilot AI.');
      router.push('/dashboard');
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'Failed to register account. Please check your details and try again.'
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
      router.push('/dashboard');
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
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          {/* Quick Demo Access Alternative */}
          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Assessor fast track:</span>{' '}
                Skip registration with demo credentials.
              </div>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={isDemoSubmitting || isSubmitting}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-2xs hover:bg-indigo-50 disabled:opacity-50 cursor-pointer"
              >
                <Play className="h-3 w-3 fill-indigo-600 text-indigo-600" />
                <span>{isDemoSubmitting ? 'Signing in...' : 'Demo Login'}</span>
              </button>
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

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
              >
                Full Name
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <UserIcon className="h-4 w-4" aria-hidden="true" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Jane Developer"
                  className={`block w-full rounded-lg border pl-10 pr-3 py-2.5 text-sm text-slate-900 transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                    fieldErrors.fullName
                      ? 'border-rose-300 bg-rose-50/30'
                      : 'border-slate-300 bg-white hover:border-slate-400'
                  }`}
                  aria-invalid={Boolean(fieldErrors.fullName)}
                  aria-describedby={fieldErrors.fullName ? 'fullName-error' : undefined}
                />
              </div>
              {fieldErrors.fullName && (
                <p id="fullName-error" className="mt-1 text-xs text-rose-600">
                  {fieldErrors.fullName}
                </p>
              )}
            </div>

            {/* Email */}
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
                  placeholder="jane@example.com"
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

            {/* Target Role (Optional) */}
            <div>
              <label
                htmlFor="targetRole"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
              >
                Target Engineering Role{' '}
                <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Briefcase className="h-4 w-4" aria-hidden="true" />
                </div>
                <input
                  id="targetRole"
                  name="targetRole"
                  type="text"
                  value={formData.targetRole}
                  onChange={handleChange}
                  placeholder="e.g. Junior Full-Stack Developer"
                  className="block w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-sm placeholder:text-slate-400 transition-colors hover:border-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Password */}
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
                  autoComplete="new-password"
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

              {/* Password Requirements Checklist */}
              <div className="mt-2.5 grid grid-cols-2 gap-1.5 rounded-lg bg-slate-50 p-2.5 text-[11px] border border-slate-200">
                <div
                  className={`flex items-center gap-1.5 ${
                    passwordCriteria.length ? 'text-emerald-700 font-medium' : 'text-slate-400'
                  }`}
                >
                  <CheckCircle2
                    className={`h-3 w-3 ${
                      passwordCriteria.length ? 'text-emerald-600' : 'text-slate-300'
                    }`}
                  />
                  <span>8+ characters</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${
                    passwordCriteria.hasUpper ? 'text-emerald-700 font-medium' : 'text-slate-400'
                  }`}
                >
                  <CheckCircle2
                    className={`h-3 w-3 ${
                      passwordCriteria.hasUpper ? 'text-emerald-600' : 'text-slate-300'
                    }`}
                  />
                  <span>1 uppercase letter</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${
                    passwordCriteria.hasLower ? 'text-emerald-700 font-medium' : 'text-slate-400'
                  }`}
                >
                  <CheckCircle2
                    className={`h-3 w-3 ${
                      passwordCriteria.hasLower ? 'text-emerald-600' : 'text-slate-300'
                    }`}
                  />
                  <span>1 lowercase letter</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${
                    passwordCriteria.hasNumber ? 'text-emerald-700 font-medium' : 'text-slate-400'
                  }`}
                >
                  <CheckCircle2
                    className={`h-3 w-3 ${
                      passwordCriteria.hasNumber ? 'text-emerald-600' : 'text-slate-300'
                    }`}
                  />
                  <span>1 number (0-9)</span>
                </div>
              </div>
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
                    <span>Creating account...</span>
                  </div>
                ) : (
                  'Create account'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Security Notice */}
        <p className="mt-4 text-center text-xs text-slate-500">
          Passwords are cryptographically hashed using bcrypt (cost 12).
        </p>
      </div>
    </div>
  );
}
