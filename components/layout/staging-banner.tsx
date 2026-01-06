'use client';

import { AlertTriangle } from 'lucide-react';

export function StagingBanner() {
  if (process.env.NEXT_PUBLIC_IS_STAGING !== 'true') {
    return null;
  }

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2 text-center text-sm font-medium sticky top-0 z-50">
      <div className="flex items-center justify-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        <span>Staging Environment - Data may be reset at any time</span>
        <AlertTriangle className="h-4 w-4" />
      </div>
    </div>
  );
}
