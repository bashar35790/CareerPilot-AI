import Link from "next/link";
import { Compass } from "lucide-react";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex items-center gap-3">
        <Compass className="h-10 w-10 text-indigo-600" aria-hidden="true" />
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">
          CareerPilot AI 
        </h1>
      </div>
      <p className="max-w-xl text-lg text-slate-600">
        Score your resume against any job posting, uncover the skills you are
        missing, and follow a personalized roadmap to close the gap.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
        >
          Create account
        </Link>
      </div>
    </main>
  );
}
