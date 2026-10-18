'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Play,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '@/store/auth-context';
import { ToastAlert, useToast } from '@/components/ui';
import { AuthShell } from '@/components/auth/AuthShell';
import { registerSchema } from '@/schemas/auth.schema';
import { getApiErrorMessage } from '@/lib/api';

const inputClass = (hasError: boolean) =>
  `block w-full rounded-lg border bg-white/5 pl-10 pr-3 py-2.5 text-sm text-white placeholder:text-neutral-500 transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
    hasError ? 'border-rose-400/60 bg-rose-500/10' : 'border-white/10 hover:border-white/20'
  }`;

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
      ...(formData.targetRole.trim()
        ? { targetRole: formData.targetRole.trim() }
        : {}),
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
    <AuthShell
      title="Create your account"
      subtitle={
        <>
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-blue-400 transition-colors hover:text-blue-300"
          >
            Sign in
          </Link>
        </>
      }
    >
      {/* Quick Demo Access Alternative */}
      <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-neutral-400">
            <span className="font-semibold text-white">
              Assessor fast track:
            </span>{' '}
            Skip registration with demo credentials.
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isDemoSubmitting || isSubmitting}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-600/20 px-3 py-1.5 text-xs font-semibold text-blue-200 transition-colors hover:bg-blue-600/30 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Play className="h-3 w-3 fill-blue-200 text-blue-200" />
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
            className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-300"
          >
            Full Name
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
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
              className={inputClass(Boolean(fieldErrors.fullName))}
              aria-invalid={Boolean(fieldErrors.fullName)}
              aria-describedby={
                fieldErrors.fullName ? 'fullName-error' : undefined
              }
            />
          </div>
          {fieldErrors.fullName && (
            <p id="fullName-error" className="mt-1 text-xs text-rose-300">
              {fieldErrors.fullName}
            </p>
          )}
        </div>

        {/* Email */}
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
              placeholder="jane@example.com"
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

        {/* Target Role (Optional) */}
        <div>
          <label
            htmlFor="targetRole"
            className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-300"
          >
            Target Engineering Role{' '}
            <span className="font-normal lowercase text-neutral-500">
              (optional)
            </span>
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
              <Briefcase className="h-4 w-4" aria-hidden="true" />
            </div>
            <input
              id="targetRole"
              name="targetRole"
              type="text"
              value={formData.targetRole}
              onChange={handleChange}
              placeholder="e.g. Junior Full-Stack Developer"
              className={inputClass(false)}
            />
          </div>
        </div>

        {/* Password */}
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
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className={`${inputClass(Boolean(fieldErrors.password))} pr-10`}
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

          {/* Password Requirements Checklist */}
          <div className="mt-2.5 grid grid-cols-2 gap-1.5 rounded-lg border border-white/10 bg-white/5 p-2.5 text-[11px]">
            <div
              className={`flex items-center gap-1.5 ${
                passwordCriteria.length
                  ? 'font-medium text-emerald-400'
                  : 'text-neutral-500'
              }`}
            >
              <CheckCircle2
                className={`h-3 w-3 ${
                  passwordCriteria.length
                    ? 'text-emerald-400'
                    : 'text-neutral-600'
                }`}
              />
              <span>8+ characters</span>
            </div>
            <div
              className={`flex items-center gap-1.5 ${
                passwordCriteria.hasUpper
                  ? 'font-medium text-emerald-400'
                  : 'text-neutral-500'
              }`}
            >
              <CheckCircle2
                className={`h-3 w-3 ${
                  passwordCriteria.hasUpper
                    ? 'text-emerald-400'
                    : 'text-neutral-600'
                }`}
              />
              <span>1 uppercase letter</span>
            </div>
            <div
              className={`flex items-center gap-1.5 ${
                passwordCriteria.hasLower
                  ? 'font-medium text-emerald-400'
                  : 'text-neutral-500'
              }`}
            >
              <CheckCircle2
                className={`h-3 w-3 ${
                  passwordCriteria.hasLower
                    ? 'text-emerald-400'
                    : 'text-neutral-600'
                }`}
              />
              <span>1 lowercase letter</span>
            </div>
            <div
              className={`flex items-center gap-1.5 ${
                passwordCriteria.hasNumber
                  ? 'font-medium text-emerald-400'
                  : 'text-neutral-500'
              }`}
            >
              <CheckCircle2
                className={`h-3 w-3 ${
                  passwordCriteria.hasNumber
                    ? 'text-emerald-400'
                    : 'text-neutral-600'
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
            className="flex w-full cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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

      {/* Security Notice */}
      <p className="mt-6 text-center text-xs text-neutral-500">
        Passwords are cryptographically hashed using bcrypt (cost 12).
      </p>
    </AuthShell>
  );
}
