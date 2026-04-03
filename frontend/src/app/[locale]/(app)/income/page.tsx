'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { useFetch, useMutation } from '@/hooks/useApi';
import * as api from '@/lib/api';
import { formatCurrency, formatDate, getCategoryColor } from '@/lib/utils';
import type { Income } from '@/types';
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
import {
  Plus,
  Loader2,
  AlertCircle,
  TrendingUp,
  Edit2,
  Trash2,
  RefreshCw,
  DollarSign,
  Calendar,
  Briefcase,
  Laptop,
  Building2,
  MoreHorizontal,
} from 'lucide-react';

const CATEGORIES = ['SALARY', 'FREELANCE', 'BUSINESS', 'INVESTMENTS', 'OTHER'] as const;
const TYPES = ['FIXED', 'VARIABLE'] as const;
const INTERVALS = ['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'YEARLY'] as const;

interface IncomeFormData {
  amount: string;
  category: string;
  type: string;
  description: string;
  date: string;
  recurring: boolean;
  interval: string;
}

const defaultForm: IncomeFormData = {
  amount: '',
  category: 'SALARY',
  type: 'FIXED',
  description: '',
  date: new Date().toISOString().split('T')[0],
  recurring: false,
  interval: 'MONTHLY',
};

export default function IncomePage() {
  const t = useTranslations();
  const { user } = useAuth();

  const [tab, setTab] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<IncomeFormData>(defaultForm);
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const { data: incomes, isLoading, error, refetch } = useFetch<Income[]>(
    () => api.getIncome({ month: filterMonth }) as Promise<Income[]>,
    [filterMonth]
  );

  const createMutation = useMutation<unknown, [Record<string, unknown>]>(
    (data) => api.createIncome(data)
  );
  const updateMutation = useMutation<unknown, [string, Record<string, unknown>]>(
    (id, data) => api.updateIncome(id, data)
  );
  const deleteMutation = useMutation<void, [string]>(
    (id) => api.deleteIncome(id)
  );

  const filteredIncomes = useMemo(() => {
    if (!incomes) return [];
    if (tab === 'all') return incomes;
    return incomes.filter((inc) => inc.type === tab.toUpperCase());
  }, [incomes, tab]);

  const monthlyTotal = useMemo(() => {
    if (!incomes) return 0;
    return incomes.reduce((sum, inc) => sum + inc.amount, 0);
  }, [incomes]);

  const openAdd = () => {
    setEditingId(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (income: Income) => {
    setEditingId(income.id);
    setForm({
      amount: String(income.amount),
      category: income.category,
      type: income.type,
      description: income.description,
      date: income.date.split('T')[0],
      recurring: income.recurring,
      interval: income.interval || 'MONTHLY',
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
      type: form.type,
      description: form.description,
      date: form.date,
      recurring: form.recurring,
      interval: form.recurring ? form.interval : null,
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
      // Error is captured in mutation state
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
      // Error is captured in mutation state
    }
  };

  const updateField = (field: keyof IncomeFormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'SALARY': return <Briefcase className="w-4 h-4" />;
      case 'FREELANCE': return <Laptop className="w-4 h-4" />;
      case 'BUSINESS': return <Building2 className="w-4 h-4" />;
      case 'INVESTMENTS': return <TrendingUp className="w-4 h-4" />;
      default: return <MoreHorizontal className="w-4 h-4" />;
    }
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
          <h1 className="text-2xl font-bold tracking-tight">{t('income.title')}</h1>
          <p className="text-muted-foreground">Manage your income sources</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" />
          {t('income.addIncome')}
        </Button>
      </div>

      {/* Monthly Total + Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Card className="flex-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('income.monthlyTotal')}</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {formatCurrency(monthlyTotal, user?.currency)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="sm:w-64">
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
      </div>

      {/* Tabs + List */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="fixed">{t('income.fixed')}</TabsTrigger>
          <TabsTrigger value="variable">{t('income.variable')}</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {filteredIncomes.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <DollarSign className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">{t('income.noIncome')}</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={openAdd}>
                    <Plus className="w-4 h-4 mr-1" />
                    {t('income.addIncome')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                {/* Table header */}
                <div className="hidden md:grid grid-cols-[1fr_140px_120px_120px_100px_80px] gap-4 px-6 py-3 border-b bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <span>{t('income.description')}</span>
                  <span>{t('income.category')}</span>
                  <span>Type</span>
                  <span>{t('income.date')}</span>
                  <span className="text-right">{t('income.amount')}</span>
                  <span className="text-right">Actions</span>
                </div>

                {/* Rows */}
                <div className="divide-y">
                  {filteredIncomes.map((income) => (
                    <div
                      key={income.id}
                      className="grid grid-cols-1 md:grid-cols-[1fr_140px_120px_120px_100px_80px] gap-2 md:gap-4 px-6 py-4 hover:bg-muted/30 transition-colors items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getCategoryColor(income.category.toLowerCase())}`}>
                          {getCategoryIcon(income.category)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{income.description}</p>
                          {income.recurring && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <RefreshCw className="w-3 h-3" />
                              <span>{income.interval}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <Badge variant="outline" className="text-xs">
                          {t(`income.${income.category.toLowerCase()}` as never)}
                        </Badge>
                      </div>

                      <div>
                        <Badge variant={income.type === 'FIXED' ? 'default' : 'secondary'} className="text-xs">
                          {t(`income.${income.type.toLowerCase()}` as never)}
                        </Badge>
                      </div>

                      <span className="text-sm text-muted-foreground">{formatDate(income.date)}</span>

                      <span className="text-sm font-semibold text-emerald-600 text-right tabular-nums">
                        {formatCurrency(income.amount, user?.currency)}
                      </span>

                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(income)}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => openDelete(income.id)}>
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
              {editingId ? t('income.editIncome') : t('income.addIncome')}
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
                      {t(`income.${cat.toLowerCase()}` as never)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={form.type} onValueChange={(v) => updateField('type', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`income.${type.toLowerCase()}` as never)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('income.description')}</label>
              <Input
                placeholder="e.g. Monthly salary"
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

            {/* Recurring */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="recurring"
                checked={form.recurring}
                onChange={(e) => updateField('recurring', e.target.checked)}
                className="rounded border-input"
              />
              <label htmlFor="recurring" className="text-sm font-medium">
                {t('income.recurring')}
              </label>
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
            Are you sure you want to delete this income entry? This action cannot be undone.
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
