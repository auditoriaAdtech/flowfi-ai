'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Plus,
  PiggyBank,
  Shield,
  Palmtree,
  GraduationCap,
  Landmark,
  Target,
  Calendar,
  Loader2,
  AlertCircle,
  PartyPopper,
  Edit2,
  Clock,
} from 'lucide-react';

import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { useFetch, useMutation } from '@/hooks/useApi';
import * as api from '@/lib/api';
import type { SavingsGoal } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Savings API helpers
const getSavingsGoals = () => api.get<SavingsGoal[]>('/savings-goals');
const createSavingsGoal = (data: Record<string, unknown>) => api.post<SavingsGoal>('/savings-goals', data);
const updateSavingsGoal = (id: string, data: Record<string, unknown>) => api.patch<SavingsGoal>(`/savings-goals/${id}`, data);
const contributeSavingsGoal = (id: string, data: { amount: number; note?: string }) =>
  api.post<unknown>(`/savings-goals/${id}/contribute`, data);

function categoryIcon(category: SavingsGoal['category']) {
  switch (category) {
    case 'EMERGENCY':
      return <Shield className="h-5 w-5 text-red-500" />;
    case 'VACATION':
      return <Palmtree className="h-5 w-5 text-cyan-500" />;
    case 'EDUCATION':
      return <GraduationCap className="h-5 w-5 text-indigo-500" />;
    case 'RETIREMENT':
      return <Landmark className="h-5 w-5 text-slate-500" />;
    case 'CUSTOM':
    default:
      return <Target className="h-5 w-5 text-purple-500" />;
  }
}

function daysUntil(date: string | null | undefined): number | null {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function SavingsPage() {
  const t = useTranslations('savings');
  const tc = useTranslations('common');

  const { data: goals, isLoading, error, refetch } = useFetch<SavingsGoal[]>(
    () => getSavingsGoals(),
    []
  );

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [contributeGoal, setContributeGoal] = useState<SavingsGoal | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formTarget, setFormTarget] = useState('');
  const [formCategory, setFormCategory] = useState<string>('EMERGENCY');
  const [formDeadline, setFormDeadline] = useState('');

  // Contribute form
  const [contribAmount, setContribAmount] = useState('');
  const [contribNote, setContribNote] = useState('');

  const createGoal = useMutation<SavingsGoal, [Record<string, unknown>]>((data) => createSavingsGoal(data));
  const updateGoal = useMutation<SavingsGoal, [string, Record<string, unknown>]>((id, data) => updateSavingsGoal(id, data));
  const contribute = useMutation<unknown, [string, { amount: number; note?: string }]>(
    (id, data) => contributeSavingsGoal(id, data)
  );

  const activeGoals = goals?.filter((g) => g.status === 'ACTIVE') ?? [];
  const completedGoals = goals?.filter((g) => g.status === 'COMPLETED') ?? [];
  const totalSaved = goals?.reduce((s, g) => s + g.currentAmount, 0) ?? 0;

  const resetForm = () => {
    setFormName('');
    setFormTarget('');
    setFormCategory('EMERGENCY');
    setFormDeadline('');
  };

  const handleCreate = async () => {
    await createGoal.mutate({
      name: formName,
      targetAmount: parseFloat(formTarget),
      category: formCategory,
      deadline: formDeadline || null,
    });
    setAddDialogOpen(false);
    resetForm();
    refetch();
  };

  const handleEdit = async () => {
    if (!editingGoal) return;
    await updateGoal.mutate(editingGoal.id, {
      name: formName,
      targetAmount: parseFloat(formTarget),
      category: formCategory,
      deadline: formDeadline || null,
    });
    setEditingGoal(null);
    resetForm();
    refetch();
  };

  const handleContribute = async () => {
    if (!contributeGoal) return;
    await contribute.mutate(contributeGoal.id, {
      amount: parseFloat(contribAmount),
      note: contribNote || undefined,
    });
    setContributeGoal(null);
    setContribAmount('');
    setContribNote('');
    refetch();
  };

  const openEdit = (goal: SavingsGoal) => {
    setFormName(goal.name);
    setFormTarget(String(goal.targetAmount));
    setFormCategory(goal.category);
    setFormDeadline(goal.deadline?.split('T')[0] ?? '');
    setEditingGoal(goal);
  };

  const pct = (g: SavingsGoal) =>
    Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">{tc('error')}</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Button onClick={refetch}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('addGoal')}
            </Button>
          </DialogTrigger>
          <GoalFormContent
            title={t('addGoal')}
            formName={formName}
            setFormName={setFormName}
            formTarget={formTarget}
            setFormTarget={setFormTarget}
            formCategory={formCategory}
            setFormCategory={setFormCategory}
            formDeadline={formDeadline}
            setFormDeadline={setFormDeadline}
            onSubmit={handleCreate}
            isLoading={createGoal.isLoading}
            t={t}
            tc={tc}
          />
        </Dialog>
      </div>

      {/* Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Saved</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalSaved)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('goals')} In Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeGoals.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('completed')}</CardTitle>
            <PartyPopper className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{completedGoals.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Goals */}
      {activeGoals.length === 0 && completedGoals.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <PiggyBank className="h-8 w-8 text-primary" />
          </div>
          <p className="text-center text-muted-foreground">{t('noGoals')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeGoals.map((goal) => {
            const days = daysUntil(goal.deadline);
            return (
              <Card key={goal.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {categoryIcon(goal.category)}
                      <CardTitle className="text-base">{goal.name}</CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(goal)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>
                    {t(goal.category.toLowerCase() as 'emergency' | 'vacation' | 'education' | 'retirement' | 'custom')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold">{pct(goal)}%</span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                    </span>
                  </div>
                  <Progress value={pct(goal)} className="h-2" />
                  {days !== null && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {days === 0
                        ? 'Deadline is today'
                        : `${days} days remaining`}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setContributeGoal(goal)}
                  >
                    <Plus className="mr-2 h-3 w-3" />
                    {t('contribute')}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">{t('completed')}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completedGoals.map((goal) => (
              <Card key={goal.id} className="border-green-200 bg-green-50/30">
                <CardContent className="flex items-center gap-3 pt-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <PartyPopper className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">{goal.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(goal.targetAmount)} reached!
                    </p>
                  </div>
                  <Badge className="ml-auto bg-green-100 text-green-700">{t('completed')}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingGoal} onOpenChange={(open) => { if (!open) { setEditingGoal(null); resetForm(); } }}>
        <GoalFormContent
          title={t('editGoal')}
          formName={formName}
          setFormName={setFormName}
          formTarget={formTarget}
          setFormTarget={setFormTarget}
          formCategory={formCategory}
          setFormCategory={setFormCategory}
          formDeadline={formDeadline}
          setFormDeadline={setFormDeadline}
          onSubmit={handleEdit}
          isLoading={updateGoal.isLoading}
          t={t}
          tc={tc}
        />
      </Dialog>

      {/* Contribute Dialog */}
      <Dialog open={!!contributeGoal} onOpenChange={(open) => { if (!open) setContributeGoal(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('contribute')}</DialogTitle>
            <DialogDescription>{contributeGoal?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="number"
                step="0.01"
                value={contribAmount}
                onChange={(e) => setContribAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Note</label>
              <Input
                value={contribNote}
                onChange={(e) => setContribNote(e.target.value)}
                placeholder="Optional note"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContributeGoal(null)}>
              {tc('cancel')}
            </Button>
            <Button onClick={handleContribute} disabled={!contribAmount || contribute.isLoading}>
              {contribute.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('contribute')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GoalFormContent({
  title,
  formName,
  setFormName,
  formTarget,
  setFormTarget,
  formCategory,
  setFormCategory,
  formDeadline,
  setFormDeadline,
  onSubmit,
  isLoading,
  t,
  tc,
}: {
  title: string;
  formName: string;
  setFormName: (v: string) => void;
  formTarget: string;
  setFormTarget: (v: string) => void;
  formCategory: string;
  setFormCategory: (v: string) => void;
  formDeadline: string;
  setFormDeadline: (v: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  t: (key: string) => string;
  tc: (key: string) => string;
}) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4">
        <div>
          <label className="text-sm font-medium">Name</label>
          <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Emergency Fund" />
        </div>
        <div>
          <label className="text-sm font-medium">{t('targetAmount')}</label>
          <Input type="number" step="0.01" value={formTarget} onChange={(e) => setFormTarget(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">Category</label>
          <Select value={formCategory} onValueChange={setFormCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EMERGENCY">{t('emergency')}</SelectItem>
              <SelectItem value="VACATION">{t('vacation')}</SelectItem>
              <SelectItem value="EDUCATION">{t('education')}</SelectItem>
              <SelectItem value="RETIREMENT">{t('retirement')}</SelectItem>
              <SelectItem value="CUSTOM">{t('custom')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">{t('deadline')}</label>
          <Input type="date" value={formDeadline} onChange={(e) => setFormDeadline(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={onSubmit} disabled={!formName || !formTarget || isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {tc('save')}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
