'use client';

import { Star, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const testimonials = [
  {
    name: 'Sarah M.',
    role: 'Working Mom',
    avatar: 'SM',
    content: 'ReceiptWise has been a game-changer for our family. We finally know where our money goes each month!',
    rating: 5,
  },
  {
    name: 'James K.',
    role: 'Roommate Group',
    avatar: 'JK',
    content: 'Splitting expenses with 3 roommates used to be a nightmare. Now it takes seconds to track who owes what.',
    rating: 5,
  },
  {
    name: 'Emily & Tom',
    role: 'Couple',
    avatar: 'ET',
    content: 'We love the AI scanning feature. Just snap a photo and it extracts everything automatically!',
    rating: 5,
  },
];

const trustBadges = [
  { label: '256-bit SSL', icon: '🔒' },
  { label: 'GDPR Compliant', icon: '🛡️' },
  { label: '99.9% Uptime', icon: '✅' },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? 'fill-yellow-400 text-yellow-400' : 'fill-muted text-muted'
          }`}
        />
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="border-t border-border/50 bg-muted/30 px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-foreground">
            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
            Loved by thousands
          </div>
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            What Our Users Say
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Join families, roommates, and couples who trust ReceiptWise to manage their shared expenses.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="mb-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.name}
              className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/20 hover:shadow-lg"
            >
              <CardContent className="p-6">
                <Quote className="absolute right-4 top-4 h-8 w-8 text-primary/10" />
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <StarRating rating={testimonial.rating} />
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                  &quot;{testimonial.content}&quot;
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6">
          {trustBadges.map((badge) => (
            <div
              key={badge.label}
              className="flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-4 py-2 text-sm font-medium text-muted-foreground backdrop-blur-sm"
            >
              <span>{badge.icon}</span>
              <span>{badge.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SocialProofBanner() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 py-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'].map((color, i) => (
            <div
              key={i}
              className={`h-8 w-8 rounded-full ${color} ring-2 ring-background flex items-center justify-center text-xs font-semibold text-white`}
            >
              {['JD', 'SM', 'AK', 'LM'][i]}
            </div>
          ))}
        </div>
        <span>
          <strong className="text-foreground">10,000+</strong> happy users
        </span>
      </div>
      <div className="flex items-center gap-1">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <span>
          <strong className="text-foreground">4.9/5</strong> average rating
        </span>
      </div>
    </div>
  );
}
