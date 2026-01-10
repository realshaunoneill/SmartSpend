import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsLoading() {
  return (
    <main className="container mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      {/* Header - matches page exactly */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded" />
            <Skeleton className="h-9 w-24" />
          </div>
          <Skeleton className="h-5 w-64 mt-1 sm:mt-2" />
        </div>
      </div>

      {/* Tabs - matches TabsList grid w-full grid-cols-5 */}
      <div className="grid w-full grid-cols-5 lg:w-auto lg:flex gap-1 p-1 bg-muted rounded-lg">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-9 rounded-md" />
        ))}
      </div>

      {/* Profile Card - matches TabsContent mt-6 */}
      <div className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-3 w-72" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
