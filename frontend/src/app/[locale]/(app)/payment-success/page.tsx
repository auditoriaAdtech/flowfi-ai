'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, PartyPopper, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Simple confetti-like particle animation using CSS.
 * No external dependencies needed.
 */
function ConfettiParticle({ index }: { index: number }) {
  const colors = ['#8b5cf6', '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
  const color = colors[index % colors.length];
  const left = Math.random() * 100;
  const delay = Math.random() * 2;
  const duration = 2 + Math.random() * 2;
  const size = 6 + Math.random() * 8;

  return (
    <div
      className="pointer-events-none absolute animate-bounce"
      style={{
        left: `${left}%`,
        top: '-10px',
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        animationIterationCount: 3,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: index % 2 === 0 ? '50%' : '2px',
          transform: `rotate(${Math.random() * 360}deg)`,
        }}
      />
    </div>
  );
}

export default function PaymentSuccessPage() {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Hide confetti after a few seconds
    const timer = setTimeout(() => setShowConfetti(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      {/* Confetti overlay */}
      {showConfetti && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <ConfettiParticle key={i} index={i} />
          ))}
        </div>
      )}

      <Card className="mx-auto max-w-md text-center">
        <CardContent className="space-y-6 pt-10 pb-8">
          <div className="flex justify-center">
            <div className="relative">
              <CheckCircle2 className="h-20 w-20 text-green-500" />
              <PartyPopper className="absolute -right-2 -top-2 h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Payment Successful!
            </h1>
            <p className="text-muted-foreground">
              Your plan has been upgraded. All premium features are now unlocked
              and ready to use.
            </p>
          </div>

          <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950/30">
            <p className="text-sm text-green-700 dark:text-green-400">
              Your subscription is now active. You can manage your plan, update
              payment methods, or cancel anytime from Settings.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button asChild size="lg" className="w-full">
              <Link href="/dashboard">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/settings">
                View Subscription Settings
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
