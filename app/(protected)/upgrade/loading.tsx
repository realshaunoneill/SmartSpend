import { Skeleton } from '@/components/ui/skeleton';

export default function UpgradeLoading() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl space-y-20">
      {/* Hero Skeleton - matches page exactly */}
      <div className="text-center space-y-6">
        <Skeleton className="h-6 w-32 mx-auto rounded-full" />
        <Skeleton className="h-12 w-80 mx-auto" />
        <Skeleton className="h-6 w-96 max-w-full mx-auto" />
      </div>

      {/* Pricing Cards - matches page grid exactly */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`rounded-lg border bg-card p-6 space-y-4 ${i === 2 ? 'border-primary' : ''}`}>
            {i === 2 && <Skeleton className="h-6 w-24 mx-auto rounded-full" />}
            <Skeleton className="h-7 w-28 mx-auto" />
            <div className="space-y-1">
              <Skeleton className="h-10 w-24 mx-auto" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </div>
            <Skeleton className="h-4 w-48 mx-auto" />
            <div className="space-y-3 pt-4">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full shrink-0" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
            <Skeleton className="h-11 w-full mt-4" />
          </div>
        ))}
      </div>
    </main>
  );
}
