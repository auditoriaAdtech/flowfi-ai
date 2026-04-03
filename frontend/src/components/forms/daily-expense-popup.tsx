'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Coffee,
  UtensilsCrossed,
  Car,
  Banknote,
  ShoppingBag,
  Gamepad2,
  Smartphone,
  Sparkles,
  Check,
  Trash2,
  ArrowLeft,
  Clock,
  EyeOff,
  Loader2,
  PartyPopper,
} from 'lucide-react';
import { createExpense } from '@/lib/api';

interface ExpenseEntry {
  id: string;
  category: string;
  categoryKey: string;
  emoji: string;
  amount: number;
  description: string;
  cashDetails?: string;
}

interface DailyExpensePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemindLater?: () => void;
  onDontShowToday?: () => void;
}

const CATEGORIES = [
  { key: 'coffee', emoji: '\u2615', icon: Coffee, presets: [3, 4, 5] },
  { key: 'food', emoji: '\ud83c\udf54', icon: UtensilsCrossed, presets: [5, 10, 15] },
  { key: 'transportation', emoji: '\ud83d\ude95', icon: Car, presets: [5, 10, 20] },
  { key: 'cashWithdrawal', emoji: '\ud83d\udcb5', icon: Banknote, presets: [20, 50, 100] },
  { key: 'smallPurchases', emoji: '\ud83d\uded2', icon: ShoppingBag, presets: [5, 10, 20] },
  { key: 'entertainment', emoji: '\ud83c\udfae', icon: Gamepad2, presets: [5, 10, 15] },
  { key: 'digital', emoji: '\ud83d\udcf1', icon: Smartphone, presets: [2, 5, 10] },
  { key: 'other', emoji: '\u2728', icon: Sparkles, presets: [5, 10, 20] },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]['key'];

export function DailyExpensePopup({
  open,
  onOpenChange,
  onRemindLater,
  onDontShowToday,
}: DailyExpensePopupProps) {
  const t = useTranslations('dailyExpense');

  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [cashDetails, setCashDetails] = useState('');
  const [noSpending, setNoSpending] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedCategoryData = CATEGORIES.find((c) => c.key === selectedCategory);

  const runningTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  const resetForm = useCallback(() => {
    setSelectedCategory(null);
    setAmount('');
    setDescription('');
    setCashDetails('');
  }, []);

  const handleAddExpense = useCallback(() => {
    const numAmount = parseFloat(amount);
    if (!selectedCategory || isNaN(numAmount) || numAmount <= 0) return;

    const cat = CATEGORIES.find((c) => c.key === selectedCategory);
    if (!cat) return;

    const entry: ExpenseEntry = {
      id: Date.now().toString(),
      category: selectedCategory,
      categoryKey: selectedCategory,
      emoji: cat.emoji,
      amount: numAmount,
      description: description.trim(),
      cashDetails: selectedCategory === 'cashWithdrawal' ? cashDetails.trim() : undefined,
    };

    setExpenses((prev) => [...prev, entry]);
    resetForm();
  }, [selectedCategory, amount, description, cashDetails, resetForm]);

  const handleRemoveExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const handlePresetClick = useCallback((preset: number) => {
    setAmount(preset.toString());
  }, []);

  const handleNoSpending = useCallback(() => {
    setNoSpending(true);
    setExpenses([]);
    resetForm();
  }, [resetForm]);

  const mapCategoryToApi = (key: string): string => {
    const mapping: Record<string, string> = {
      coffee: 'FOOD',
      food: 'FOOD',
      transportation: 'TRANSPORTATION',
      cashWithdrawal: 'OTHER',
      smallPurchases: 'SHOPPING',
      entertainment: 'ENTERTAINMENT',
      digital: 'SHOPPING',
      other: 'OTHER',
    };
    return mapping[key] || 'OTHER';
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      if (noSpending) {
        onOpenChange(false);
        setNoSpending(false);
        return;
      }

      for (const expense of expenses) {
        const desc = [expense.description, expense.cashDetails].filter(Boolean).join(' - ');
        await createExpense({
          amount: expense.amount,
          category: mapCategoryToApi(expense.categoryKey),
          description: desc || `${expense.emoji} ${t(expense.categoryKey as never)}`,
          date: today,
          recurring: false,
          isSubscription: false,
        });
      }

      setExpenses([]);
      resetForm();
      setNoSpending(false);
      onOpenChange(false);
    } catch {
      // Error handling - API errors are handled by the api module
    } finally {
      setSaving(false);
    }
  }, [expenses, noSpending, onOpenChange, resetForm, t]);

  const handleClose = useCallback(() => {
    setExpenses([]);
    resetForm();
    setNoSpending(false);
    onOpenChange(false);
  }, [onOpenChange, resetForm]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto data-[state=open]:slide-in-from-bottom data-[state=open]:sm:slide-in-from-bottom-0">
        <DialogHeader>
          <DialogTitle className="text-xl">{t('title')}</DialogTitle>
          <DialogDescription>{t('subtitle')}</DialogDescription>
        </DialogHeader>

        {noSpending ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <PartyPopper className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-lg font-medium text-green-600 dark:text-green-400">
              {t('congratsNoSpending')}
            </p>
          </div>
        ) : selectedCategory ? (
          <div className="space-y-4">
            <button
              onClick={resetForm}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('backToCategories')}
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{selectedCategoryData?.emoji}</span>
              <span className="font-medium">{t(selectedCategory as never)}</span>
            </div>

            {/* Amount presets */}
            <div>
              <label className="text-sm font-medium mb-2 block">{t('amount')}</label>
              <div className="flex gap-2 mb-2 flex-wrap">
                {selectedCategoryData?.presets.map((preset) => (
                  <Button
                    key={preset}
                    variant={amount === preset.toString() ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePresetClick(preset)}
                    className="min-w-[60px]"
                  >
                    ${preset}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="$0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium mb-1 block">{t('description')}</label>
              <Input
                type="text"
                placeholder={t('descriptionPlaceholder')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Cash withdrawal extra field */}
            {selectedCategory === 'cashWithdrawal' && (
              <div>
                <label className="text-sm font-medium mb-1 block text-amber-600 dark:text-amber-400">
                  {t('cashQuestion')}
                </label>
                <Input
                  type="text"
                  placeholder={t('cashPlaceholder')}
                  value={cashDetails}
                  onChange={(e) => setCashDetails(e.target.value)}
                />
              </div>
            )}

            <Button
              onClick={handleAddExpense}
              disabled={!amount || parseFloat(amount) <= 0}
              className="w-full"
            >
              {t('addItem')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Category grid */}
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{t(cat.key as never)}</span>
                  </button>
                );
              })}
            </div>

            {/* No spending button */}
            <Button
              variant="outline"
              onClick={handleNoSpending}
              className="w-full border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
            >
              <Check className="w-4 h-4 mr-2" />
              {t('noSpending')}
            </Button>
          </div>
        )}

        {/* Expense list */}
        {expenses.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-2 rounded-md bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <span>{expense.emoji}</span>
                  <div>
                    <span className="text-sm font-medium">{t(expense.categoryKey as never)}</span>
                    {expense.description && (
                      <p className="text-xs text-muted-foreground">{expense.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">${expense.amount.toFixed(2)}</span>
                  <button
                    onClick={() => handleRemoveExpense(expense.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Running total */}
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm font-medium">{t('todayTotal')}</span>
              <span className="text-base font-bold text-primary">
                ${runningTotal.toFixed(2)}{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  ({expenses.length} {expenses.length === 1 ? 'item' : 'items'})
                </span>
              </span>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {(expenses.length > 0 || noSpending) && (
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              {t('save')}
            </Button>
          )}

          <div className="flex gap-2 w-full">
            {onRemindLater && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onRemindLater();
                  handleClose();
                }}
                className="flex-1 text-muted-foreground"
              >
                <Clock className="w-3.5 h-3.5 mr-1" />
                {t('remindLater')}
              </Button>
            )}
            {onDontShowToday && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onDontShowToday();
                  handleClose();
                }}
                className="flex-1 text-muted-foreground"
              >
                <EyeOff className="w-3.5 h-3.5 mr-1" />
                {t('dontShowToday')}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
