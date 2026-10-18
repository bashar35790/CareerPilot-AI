"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
} from "lucide-react";
import { useAuth } from "@/store/auth-context";
import { useToast } from "@/components/ui";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const AUTH_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Resumes", href: "/resumes", icon: FileText },
  { label: "Job Postings", href: "/jobs", icon: Briefcase },
  { label: "Gap Analysis", href: "/analysis", icon: Sparkles },
  { label: "Roadmaps", href: "/roadmaps", icon: Map },
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

  const isHome = pathname === "/";

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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("You have been signed out successfully.");
      router.push("/login");
    } catch {
      toast.error("Failed to log out. Please try again.");
    }
  };

  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    try {
      await demoLogin();
      toast.success("Signed in as Demo Reviewer!");
      router.push("/dashboard");
    } catch {
      toast.error("Unable to sign in with demo account.");
    } finally {
      setIsDemoLoading(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const theme = isHome
    ? {
        header:
          "absolute top-0 z-40 w-full border-b border-transparent bg-transparent",
        focusRing: "focus-visible:ring-white/70",
        brandText: "text-white",
        brandSub: "text-neutral-400",
        brandBadge: "border border-white/10 bg-white/10 text-white/80",
        navIdle: "text-neutral-300 hover:bg-white/10 hover:text-white",
        navActive: "bg-white/10 text-white font-semibold",
        iconIdle: "text-neutral-400",
        iconActive: "text-white",
        skeleton: "bg-white/10",
        profileBtn:
          "border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-white/20",
        profileName: "text-white",
        profileSub: "text-neutral-400",
        chevron: "text-neutral-400",
        chevronOpen: "rotate-180 text-white",
        glass:
          "border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-white/20",
        playIcon: "fill-white text-white",
        ghost: "text-neutral-300 hover:bg-white/10 hover:text-white",
        ghostOutline: "border-white/20 text-neutral-200 hover:bg-white/10",
        primary: "bg-white text-black hover:bg-neutral-200",
        hamburger: "text-white hover:bg-white/10",
        drawer: "border-white/10 bg-black/95",
        drawerCard: "border-white/10 bg-white/5",
        drawerName: "text-white",
        drawerSub: "text-neutral-400",
        drawerNavIdle: "text-neutral-300 hover:bg-white/10",
        drawerNavActive: "bg-white/10 text-white font-semibold",
        logout: "border-white/10 bg-white/5 text-rose-300 hover:bg-white/10",
        divider: "border-white/10",
      }
    : {
        header:
          "sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md",
        focusRing: "focus-visible:ring-indigo-500",
        brandText: "text-slate-900",
        brandSub: "text-slate-500",
        brandBadge: "bg-indigo-100 text-indigo-700",
        navIdle: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        navActive: "bg-indigo-50 text-indigo-700 shadow-2xs font-semibold",
        iconIdle: "text-slate-400",
        iconActive: "text-indigo-600",
        skeleton: "bg-slate-100",
        profileBtn:
          "border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300",
        profileName: "text-slate-900",
        profileSub: "text-slate-500",
        chevron: "text-slate-400",
        chevronOpen: "rotate-180 text-indigo-600",
        glass:
          "border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300",
        playIcon: "fill-indigo-600 text-indigo-600",
        ghost: "text-slate-700 hover:text-slate-900 hover:bg-slate-100",
        ghostOutline: "border-slate-300 text-slate-700 hover:bg-slate-100",
        primary: "bg-indigo-600 text-white hover:bg-indigo-500",
        hamburger: "text-slate-600 hover:bg-slate-100",
        drawer: "border-slate-200 bg-white",
        drawerCard: "border-slate-200/80 bg-slate-50",
        drawerName: "text-slate-900",
        drawerSub: "text-slate-500",
        drawerNavIdle: "text-slate-700 hover:bg-slate-100",
        drawerNavActive: "bg-indigo-50 text-indigo-700 font-semibold",
        logout: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
        divider: "border-slate-100",
      };

  return (
    <header className={`${theme.header} transition-all`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          href={isAuthenticated ? "/dashboard" : "/"}
          className={`flex items-center gap-2.5 rounded-lg transition-transform hover:scale-[1.01] focus-visible:outline-hidden focus-visible:ring-2 ${theme.focusRing}`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-xs">
            <Compass className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span
                className={`text-lg font-bold tracking-tight ${theme.brandText}`}
              >
                CareerPilot
              </span>
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${theme.brandBadge}`}
              >
                AI
              </span>
            </div>
            <span
              className={`hidden text-[10px] font-medium sm:block ${theme.brandSub}`}
            >
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
                (item.href !== "/dashboard" &&
                  pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    isActive ? theme.navActive : theme.navIdle
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? theme.iconActive : theme.iconIdle
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
            <div
              className={`h-9 w-24 animate-pulse rounded-lg ${theme.skeleton}`}
            />
          ) : isAuthenticated && user ? (
            /* Authenticated User Menu */
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className={`flex items-center gap-2.5 rounded-full border p-1.5 pr-3 text-sm font-medium shadow-2xs transition-all focus-visible:outline-hidden focus-visible:ring-2 ${theme.profileBtn} ${theme.focusRing}`}
                aria-expanded={profileDropdownOpen}
                aria-haspopup="true"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white shadow-xs">
                  {getInitials(user.fullName)}
                </div>
                <div className="flex flex-col text-left">
                  <span
                    className={`text-xs font-semibold leading-tight ${theme.profileName}`}
                  >
                    {user.fullName}
                  </span>
                  <span
                    className={`max-w-27.5 truncate text-[10px] leading-tight ${theme.profileSub}`}
                  >
                    {user.targetRole || user.email}
                  </span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${theme.chevron} ${
                    profileDropdownOpen ? theme.chevronOpen : ""
                  }`}
                />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-lg ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150 z-50">
                  <div className="border-b border-slate-100 px-3 py-2.5">
                    <p className="text-xs font-medium text-slate-500">
                      Signed in as
                    </p>
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {user.email}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                        {user.careerLevel} Level
                      </span>
                      {user.role === "ADMIN" && (
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
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition-all disabled:opacity-50 ${theme.glass}`}
              >
                <Play className={`h-3 w-3 ${theme.playIcon}`} />
                <span>
                  {isDemoLoading ? "Signing in..." : "One-Click Demo"}
                </span>
              </button>

              <Link
                href="/login"
                className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${theme.ghost}`}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold shadow-2xs transition-all ${theme.primary}`}
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
              className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-semibold ${theme.glass}`}
            >
              <Play className={`h-2.5 w-2.5 ${theme.playIcon}`} />
              <span>Demo</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className={`rounded-lg p-2 focus-visible:outline-hidden focus-visible:ring-2 ${theme.hamburger} ${theme.focusRing}`}
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
        <div
          className={`border-b px-4 pb-6 pt-3 md:hidden animate-in slide-in-from-top-2 duration-200 ${theme.drawer}`}
        >
          {isAuthenticated && user ? (
            <div className="space-y-4">
              {/* User Profile Info in Mobile */}
              <div
                className={`flex items-center gap-3 rounded-xl border p-3 ${theme.drawerCard}`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                  {getInitials(user.fullName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm font-semibold ${theme.drawerName}`}
                  >
                    {user.fullName}
                  </p>
                  <p className={`truncate text-xs ${theme.drawerSub}`}>
                    {user.email}
                  </p>
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
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(`${item.href}/`));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                        isActive ? theme.drawerNavActive : theme.drawerNavIdle
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          isActive ? theme.iconActive : theme.iconIdle
                        }`}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className={`border-t pt-2 ${theme.divider}`}>
                <button
                  type="button"
                  onClick={handleLogout}
                  className={`flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors ${theme.logout}`}
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
                className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors ${theme.glass}`}
              >
                <Play className={`h-4 w-4 ${theme.playIcon}`} />
                <span>
                  {isDemoLoading ? "Signing in..." : "One-Click Demo Login"}
                </span>
              </button>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors ${theme.ghostOutline}`}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold shadow-xs transition-colors ${theme.primary}`}
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
