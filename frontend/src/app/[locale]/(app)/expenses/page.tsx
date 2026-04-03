'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { useFetch, useMutation } from '@/hooks/useApi';
import * as api from '@/lib/api';
import { formatCurrency, formatDate, getCategoryColor } from '@/lib/utils';
import type { Expense } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart } from '@/components/charts/bar-chart';
import {
  Plus,
  Loader2,
  AlertCircle,
  Edit2,
  Trash2,
  RefreshCw,
  DollarSign,
  Calendar,
  AlertTriangle,
  CreditCard,
  UtensilsCrossed,
  Home,
  Car,
  Zap,
  Film,
  ShoppingBag,
  Heart,
  GraduationCap,
  MoreHorizontal,
} from 'lucide-react';

const CATEGORIES = [
  'FOOD', 'HOUSING', 'TRANSPORTATION', 'UTILITIES',
  'ENTERTAINMENT', 'SHOPPING', 'HEALTH', 'EDUCATION', 'OTHER',
] as const;
const INTERVALS = ['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'YEARLY'] as const;

interface ExpenseFormData {
  amount: string;
  category: string;
  description: string;
  date: string;
  recurring: boolean;
  interval: string;
  isSubscription: boolean;
}

const defaultForm: ExpenseFormData = {
  amount: '',
  category: 'FOOD',
  description: '',
  date: new Date().toISOString().split('T')[0],
  recurring: false,
  interval: 'MONTHLY',
  isSubscription: false,
};

function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const cls = className || 'w-4 h-4';
  switch (category) {
    case 'FOOD': return <UtensilsCrossed className={cls} />;
    case 'HOUSING': return <Home className={cls} />;
    case 'TRANSPORTATION': return <Car className={cls} />;
    case 'UTILITIES': return <Zap className={cls} />;
    case 'ENTERTAINMENT': return <Film className={cls} />;
    case 'SHOPPING': return <ShoppingBag className={cls} />;
    case 'HEALTH': return <Heart className={cls} />;
    case 'EDUCATION': return <GraduationCap className={cls} />;
    default: return <MoreHorizontal className={cls} />;
  }
}

export default function ExpensesPage() {
  const t = useTranslations();
  const { user } = useAuth();

  const [tab, setTab] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExpenseFormData>(defaultForm);
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const { data: expenses, isLoading, error, refetch } = useFetch<Expense[]>(
    () => api.getExpenses({ month: filterMonth }) as Promise<Expense[]>,
    [filterMonth]
  );

  const { data: categoryData } = useFetch<{ category: string; amount: number }[]>(
    () => api.getExpensesByCategory({ month: filterMonth }) as Promise<{ category: string; amount: number }[]>,
    [filterMonth]
  );

  const { data: subscriptions } = useFetch<Expense[]>(
    () => api.getSubscriptions() as Promise<Expense[]>,
    []
  );

  const createMutation = useMutation<unknown, [Record<string, unknown>]>(
    (data) => api.createExpense(data)
  );
  const updateMutation = useMutation<unknown, [string, Record<string, unknown>]>(
    (id, data) => api.updateExpense(id, data)
  );
  const deleteMutation = useMutation<void, [string]>(
    (id) => api.deleteExpense(id)
  );

  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    if (tab === 'all') return expenses;
    if (tab === 'subscriptions') return expenses.filter((e) => e.isSubscription);
    return expenses;
  }, [expenses, tab]);

  const monthlyTotal = useMemo(() => {
    if (!expenses) return 0;
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses]);

  const subscriptionTotal = useMemo(() => {
    if (!subscriptions) return 0;
    return subscriptions.reduce((sum, s) => sum + s.amount, 0);
  }, [subscriptions]);

  const openAdd = () => {
    setEditingId(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setForm({
      amount: String(expense.amount),
      category: expense.category,
      description: expense.description,
      date: expense.date.split('T')[0],
      recurring: expense.recurring,
      interval: expense.interval || 'MONTHLY',
      isSubscription: expense.isSubscription,
    });
    setDialogOpen(true);
  };

  const openDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      amount: parseFloat(form.amount),
      category: form.category,
      description: form.description,
      date: form.date,
      recurring: form.recurring,
      interval: form.recurring ? form.interval : null,
      isSubscription: form.isSubscription,
    };

    try {
      if (editingId) {
        await updateMutation.mutate(editingId, payload);
      } else {
        await createMutation.mutate(payload);
      }
      setDialogOpen(false);
      refetch();
    } catch {
      // Error captured in mutation state
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteMutation.mutate(deletingId);
      setDeleteDialogOpen(false);
      setDeletingId(null);
      refetch();
    } catch {
      // Error captured in mutation state
    }
  };

  const updateField = (field: keyof ExpenseFormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
          <p className="text-destructive">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('expenses.title')}</h1>
          <p className="text-muted-foreground">Track and manage your spending</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" />
          {t('expenses.addExpense')}
        </Button>
      </div>

      {/* Top Cards: Monthly Total, Filter, Subscription Alert */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('expenses.monthlyTotal')}</p>
                <p className="text-3xl font-bold text-rose-600">
                  {formatCurrency(monthlyTotal, user?.currency)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-rose-50 dark:bg-rose-950 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <label className="text-sm text-muted-foreground flex items-center gap-1.5 mb-2">
              <Calendar className="w-3.5 h-3.5" />
              Filter by month
            </label>
            <Input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Money Leaks Alert */}
        {subscriptions && subscriptions.length > 0 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">{t('expenses.leaks')}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {subscriptions.length} active subscriptions totaling{' '}
                    <span className="font-semibold text-warning">
                      {formatCurrency(subscriptionTotal, user?.currency)}/mo
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {subscriptions.slice(0, 3).map((sub) => (
                      <Badge key={sub.id} variant="outline" className="text-[10px]">
                        {sub.description} - {formatCurrency(sub.amount, user?.currency)}
                      </Badge>
                    ))}
                    {subscriptions.length > 3 && (
                      <Badge variant="outline" className="text-[10px]">
                        +{subscriptions.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Expenses by Category Chart */}
      {categoryData && categoryData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">{t('expenses.byCategory')}</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={categoryData.map((item) => ({
                name: t(`expenses.categories.${item.category.toLowerCase()}` as never) || item.category,
                value: item.amount,
              }))}
              xKey="name"
              yKey="value"
              height={220}
              color="hsl(var(--destructive))"
            />
          </CardContent>
        </Card>
      )}

      {/* Tabs + Expense List */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="category">{t('expenses.byCategory')}</TabsTrigger>
          <TabsTrigger value="subscriptions">{t('expenses.subscriptions')}</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {filteredExpenses.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <ShoppingBag className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">{t('expenses.noExpenses')}</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={openAdd}>
                    <Plus className="w-4 h-4 mr-1" />
                    {t('expenses.addExpense')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                {/* Table header */}
                <div className="hidden md:grid grid-cols-[1fr_140px_120px_100px_80px] gap-4 px-6 py-3 border-b bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <span>{t('income.description')}</span>
                  <span>{t('income.category')}</span>
                  <span>{t('income.date')}</span>
                  <span className="text-right">{t('income.amount')}</span>
                  <span className="text-right">Actions</span>
                </div>

                {/* Rows */}
                <div className="divide-y">
                  {filteredExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="grid grid-cols-1 md:grid-cols-[1fr_140px_120px_100px_80px] gap-2 md:gap-4 px-6 py-4 hover:bg-muted/30 transition-colors items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getCategoryColor(expense.category.toLowerCase())}`}>
                          <CategoryIcon category={expense.category} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{expense.description}</p>
                            {expense.isSubscription && (
                              <CreditCard className="w-3.5 h-3.5 text-warning" />
                            )}
                          </div>
                          {expense.recurring && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <RefreshCw className="w-3 h-3" />
                              <span>{expense.interval}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getCategoryColor(expense.category.toLowerCase())}`}
                        >
                          {t(`expenses.categories.${expense.category.toLowerCase()}` as never)}
                        </Badge>
                      </div>

                      <span className="text-sm text-muted-foreground">{formatDate(expense.date)}</span>

                      <span className="text-sm font-semibold text-rose-600 text-right tabular-nums">
                        {formatCurrency(expense.amount, user?.currency)}
                      </span>

                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(expense)}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => openDelete(expense.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? t('expenses.editExpense') : t('expenses.addExpense')}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {(createMutation.error || updateMutation.error) && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{(createMutation.error || updateMutation.error)?.message}</span>
              </div>
            )}

            {/* Amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('income.amount')}</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => updateField('amount', e.target.value)}
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('income.category')}</label>
              <Select value={form.category} onValueChange={(v) => updateField('category', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      <div className="flex items-center gap-2">
                        <CategoryIcon category={cat} className="w-3.5 h-3.5" />
                        {t(`expenses.categories.${cat.toLowerCase()}` as never)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('income.description')}</label>
              <Input
                placeholder="e.g. Grocery shopping"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                required
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('income.date')}</label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => updateField('date', e.target.value)}
                required
              />
            </div>

            {/* Toggles row */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="exp-recurring"
                  checked={form.recurring}
                  onChange={(e) => updateField('recurring', e.target.checked)}
                  className="rounded border-input"
                />
                <label htmlFor="exp-recurring" className="text-sm font-medium">
                  {t('income.recurring')}
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="exp-subscription"
                  checked={form.isSubscription}
                  onChange={(e) => updateField('isSubscription', e.target.checked)}
                  className="rounded border-input"
                />
                <label htmlFor="exp-subscription" className="text-sm font-medium">
                  {t('expenses.subscriptions')}
                </label>
              </div>
            </div>

            {/* Interval */}
            {form.recurring && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('income.interval')}</label>
                <Select value={form.interval} onValueChange={(v) => updateField('interval', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVALS.map((interval) => (
                      <SelectItem key={interval} value={interval}>
                        {interval.charAt(0) + interval.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={createMutation.isLoading || updateMutation.isLoading}>
                {(createMutation.isLoading || updateMutation.isLoading) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('common.confirm')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this expense? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isLoading}>
              {deleteMutation.isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
