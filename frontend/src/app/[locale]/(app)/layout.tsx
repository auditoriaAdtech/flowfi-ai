'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Loader2 } from 'lucide-react';
import { ExpenseReminder } from '@/components/forms/expense-reminder';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  const isOnboardingPage = pathname?.includes('/onboarding');

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    const onboardingComplete = localStorage.getItem('flowfi_onboarding_complete');

    if (!onboardingComplete && !isOnboardingPage) {
      router.push('/onboarding');
      return;
    }

    setOnboardingChecked(true);
  }, [isLoading, isAuthenticated, isOnboardingPage, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  // Onboarding page renders full-screen without sidebar
  if (isOnboardingPage) {
    return <>{children}</>;
  }

  // Wait until onboarding check is done before showing app shell
  if (!onboardingChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        <Header />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
      <ExpenseReminder />
    </div>
  );
}
