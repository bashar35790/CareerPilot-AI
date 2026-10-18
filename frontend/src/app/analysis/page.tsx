import React, { Suspense } from 'react';
import { Sparkles } from 'lucide-react';
import AnalysisView from './AnalysisView';

export const dynamic = 'force-dynamic';

export default function AnalysisPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 text-neutral-500">
            <Sparkles className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium">Loading gap analysis…</span>
          </div>
        </div>
      }
    >
      <AnalysisView />
    </Suspense>
  );
}
