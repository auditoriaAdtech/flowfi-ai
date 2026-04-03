'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Receipt, X } from 'lucide-react';
import { DailyExpensePopup } from './daily-expense-popup';

const STORAGE_KEY = 'flowfi_expense_reminder_dismissed';
const REMINDER_HOUR = 18; // 6 PM

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function isDismissedToday(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === getTodayKey();
}

function dismissForToday(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, getTodayKey());
}

export function ExpenseReminder() {
  const t = useTranslations('dailyExpense');

  const [visible, setVisible] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);

  const checkShouldShow = useCallback(() => {
    if (isDismissedToday()) {
      setVisible(false);
      return;
    }
    const now = new Date();
    if (now.getHours() >= REMINDER_HOUR) {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    checkShouldShow();

    // Re-check every minute to catch when clock passes 6 PM
    const interval = setInterval(checkShouldShow, 60_000);
    return () => clearInterval(interval);
  }, [checkShouldShow]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
  }, []);

  const handleDontShowToday = useCallback(() => {
    dismissForToday();
    setVisible(false);
  }, []);

  const handleRemindLater = useCallback(() => {
    setVisible(false);
    // Show again in 30 minutes
    setTimeout(() => {
      if (!isDismissedToday()) {
        setVisible(true);
      }
    }, 30 * 60 * 1000);
  }, []);

  const handleOpenPopup = useCallback(() => {
    setPopupOpen(true);
  }, []);

  const handlePopupClose = useCallback((open: boolean) => {
    setPopupOpen(open);
    if (!open) {
      dismissForToday();
      setVisible(false);
    }
  }, []);

  if (!visible && !popupOpen) return null;

  return (
    <>
      {/* Floating reminder banner */}
      {visible && !popupOpen && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-96 z-40 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-card border border-border rounded-xl shadow-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Receipt className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{t('reminderMessage')}</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={handleOpenPopup}>
                    {t('trackNow')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleRemindLater}>
                    {t('remindLater')}
                  </Button>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expense popup dialog */}
      <DailyExpensePopup
        open={popupOpen}
        onOpenChange={handlePopupClose}
        onRemindLater={handleRemindLater}
        onDontShowToday={handleDontShowToday}
      />
    </>
  );
}
