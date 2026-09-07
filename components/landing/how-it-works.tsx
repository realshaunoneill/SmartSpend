'use client';

import { Camera, Sparkles, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Replaces the previous testimonials/social-proof section.
 *
 * The old version shipped invented users, an invented rating and invented usage stats.
 * Until there are real customers willing to be quoted, this section explains the product
 * instead of inventing proof for it. Add real, permissioned testimonials here.
 */

const steps = [
  {
    icon: Camera,
    step: '01',
    title: 'Snap or upload',
    description:
      'Photograph a paper receipt, upload a PDF or screenshot, or clip an online receipt straight from your browser with the Chrome extension.',
  },
  {
    icon: Sparkles,
    step: '02',
    title: 'AI reads it for you',
    description:
      'Merchant, date, total, tax and every line item are extracted automatically and sorted into a spending category. No manual typing.',
  },
  {
    icon: Users,
    step: '03',
    title: 'Everyone sees it',
    description:
      'Receipts land in your shared household, so a partner, family or roommates all see the same picture of what was spent and by whom.',
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-t border-border/50 bg-muted/30 px-4 py-20 scroll-mt-20"
      aria-labelledby="how-it-works-title"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            How it works
          </div>
          <h2
            id="how-it-works-title"
            className="mb-4 text-3xl font-bold text-foreground sm:text-4xl"
          >
            Three steps, then it&apos;s automatic
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            From a crumpled receipt in your pocket to a shared, searchable spending
            history — without a spreadsheet in sight.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.step}
                className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/20 hover:shadow-lg"
              >
                <CardContent className="p-6">
                  <span
                    className="absolute right-5 top-4 text-4xl font-bold text-primary/10"
                    aria-hidden="true"
                  >
                    {item.step}
                  </span>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                    <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
