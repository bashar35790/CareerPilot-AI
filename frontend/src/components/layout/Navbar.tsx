'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Briefcase,
  ChevronDown,
  Compass,
  FileText,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  Play,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '@/store/auth-context';
import { useToast } from '@/components/ui';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const AUTH_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Resumes', href: '/resumes', icon: FileText },
  { label: 'Job Postings', href: '/jobs', icon: Briefcase },
  { label: 'Gap Analysis', href: '/analysis', icon: Sparkles },
  { label: 'Roadmaps', href: '/roadmaps', icon: Map },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout, demoLogin, isLoading } = useAuth();
  const toast = useToast();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('You have been signed out successfully.');
      router.push('/login');
    } catch {
      toast.error('Failed to log out. Please try again.');
    }
  };

  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    try {
      await demoLogin();
      toast.success('Signed in as Demo Reviewer!');
      router.push('/dashboard');
    } catch {
      toast.error('Unable to sign in with demo account.');
    } finally {
      setIsDemoLoading(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          href={isAuthenticated ? '/dashboard' : '/'}
          className="flex items-center gap-2.5 transition-transform hover:scale-[1.01] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-xs">
            <Compass className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-slate-900">
                CareerPilot
              </span>
              <span className="rounded-md bg-indigo-100 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-indigo-700">
                AI
              </span>
            </div>
            <span className="text-[10px] font-medium text-slate-500 hidden sm:block">
              Career Alignment Platform
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1">
            {AUTH_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? 'text-indigo-600' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Desktop Right Action Area */}
        <div className="hidden md:flex items-center gap-3">
          {isLoading ? (
            <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-100" />
          ) : isAuthenticated && user ? (
            /* Authenticated User Menu */
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-white p-1.5 pr-3 text-sm font-medium text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:border-slate-300 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-expanded={profileDropdownOpen}
                aria-haspopup="true"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white shadow-xs">
                  {getInitials(user.fullName)}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-900 leading-tight">
                    {user.fullName}
                  </span>
                  <span className="text-[10px] text-slate-500 leading-tight truncate max-w-[110px]">
                    {user.targetRole || user.email}
                  </span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                    profileDropdownOpen ? 'rotate-180 text-indigo-600' : ''
                  }`}
                />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-lg ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150 z-50">
                  <div className="border-b border-slate-100 px-3 py-2.5">
                    <p className="text-xs font-medium text-slate-500">Signed in as</p>
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {user.email}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                        {user.careerLevel} Level
                      </span>
                      {user.role === 'ADMIN' && (
                        <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 border border-purple-200">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/dashboard"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-indigo-600"
                    >
                      <LayoutDashboard className="h-4 w-4 text-slate-400" />
                      <span>Dashboard & Stats</span>
                    </Link>
                    <Link
                      href="/resumes"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-indigo-600"
                    >
                      <FileText className="h-4 w-4 text-slate-400" />
                      <span>Manage Resumes</span>
                    </Link>
                    <Link
                      href="/analysis"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-indigo-600"
                    >
                      <Sparkles className="h-4 w-4 text-slate-400" />
                      <span>Match Analysis</span>
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
                    >
                      <LogOut className="h-4 w-4 text-rose-500" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Unauthenticated Action Buttons */
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={isDemoLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 transition-all hover:bg-indigo-100 hover:border-indigo-300 disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                <Play className="h-3 w-3 fill-indigo-600 text-indigo-600" />
                <span>{isDemoLoading ? 'Signing in...' : 'One-Click Demo'}</span>
              </button>

              <Link
                href="/login"
                className="rounded-lg px-3.5 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:text-slate-900 hover:bg-slate-100"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white transition-all hover:bg-indigo-500 shadow-2xs"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          {!isAuthenticated && (
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={isDemoLoading}
              className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200"
            >
              <Play className="h-2.5 w-2.5 fill-indigo-600 text-indigo-600" />
              <span>Demo</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white px-4 pt-3 pb-6 md:hidden animate-in slide-in-from-top-2 duration-200">
          {isAuthenticated && user ? (
            <div className="space-y-4">
              {/* User Profile Info in Mobile */}
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 border border-slate-200/80">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                  {getInitials(user.fullName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {user.fullName}
                  </p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                  {user.careerLevel}
                </span>
              </div>

              {/* Navigation Items */}
              <nav className="flex flex-col gap-1">
                {AUTH_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          isActive ? 'text-indigo-600' : 'text-slate-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          ) : (
            /* Unauthenticated Mobile Actions */
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={isDemoLoading}
                className="flex items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
              >
                <Play className="h-4 w-4 fill-indigo-600 text-indigo-600" />
                <span>{isDemoLoading ? 'Signing in...' : 'One-Click Demo Login'}</span>
              </button>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-indigo-500"
              >
                Create an account
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export default Navbar;
