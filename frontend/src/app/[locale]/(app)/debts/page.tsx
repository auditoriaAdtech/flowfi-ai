'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Plus,
  CreditCard,
  Calendar,
  TrendingDown,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Trash2,
  Edit2,
  Receipt,
  Snowflake,
  Mountain,
} from 'lucide-react';

import { cn, formatCurrency, formatDate } from '@/lib/utils';
import * as api from '@/lib/api';
import { useFetch, useMutation } from '@/hooks/useApi';
import type { Debt, DebtPayment } from '@/types';
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

function SkeletonCard() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-2">
        <div className="h-5 w-32 rounded bg-muted" />
        <div className="h-4 w-24 rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-20 rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

export default function DebtsPage() {
  const t = useTranslations('debts');
  const tc = useTranslations('common');

  const { data: debts, isLoading, error, refetch } = useFetch<Debt[]>(() => api.getDebts() as Promise<Debt[]>, []);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [paymentDialogDebt, setPaymentDialogDebt] = useState<Debt | null>(null);
  const [expandedDebt, setExpandedDebt] = useState<string | null>(null);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [planStrategy, setPlanStrategy] = useState<'snowball' | 'avalanche'>('snowball');
  const [strategyCompareOpen, setStrategyCompareOpen] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formTotal, setFormTotal] = useState('');
  const [formRemaining, setFormRemaining] = useState('');
  const [formRate, setFormRate] = useState('');
  const [formMinPayment, setFormMinPayment] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formStrategy, setFormStrategy] = useState<string>('snowball');

  // Payment form
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNote, setPaymentNote] = useState('');

  const createDebt = useMutation<unknown, [Record<string, unknown>]>(
    (data) => api.createDebt(data)
  );
  const updateDebt = useMutation<unknown, [string, Record<string, unknown>]>(
    (id, data) => api.updateDebt(id, data)
  );
  const deleteDebt = useMutation<void, [string]>((id) => api.deleteDebt(id));
  const addPayment = useMutation<unknown, [string, { amount: number; date: string; note?: string }]>(
    (debtId, data) => api.addDebtPayment(debtId, data)
  );

  const { data: snowballPlan } = useFetch(() => api.getDebtPlan('snowball'), []);
  const { data: avalanchePlan } = useFetch(() => api.getDebtPlan('avalanche'), []);

  const activeDebts = debts?.filter((d) => d.status === 'ACTIVE') ?? [];
  const totalDebt = activeDebts.reduce((s, d) => s + d.remainingAmount, 0);
  const monthlyPayments = activeDebts.reduce((s, d) => s + d.minimumPayment, 0);
  const totalInterest = activeDebts.reduce(
    (s, d) => s + d.remainingAmount * (d.interestRate / 100),
    0
  );

  const resetForm = () => {
    setFormName('');
    setFormTotal('');
    setFormRemaining('');
    setFormRate('');
    setFormMinPayment('');
    setFormDueDate('');
    setFormStrategy('snowball');
  };

  const handleAddDebt = async () => {
    await createDebt.mutate({
      name: formName,
      totalAmount: parseFloat(formTotal),
      remainingAmount: parseFloat(formRemaining),
      interestRate: parseFloat(formRate),
      minimumPayment: parseFloat(formMinPayment),
      dueDate: formDueDate,
      strategy: formStrategy,
    });
    setAddDialogOpen(false);
    resetForm();
    refetch();
  };

  const handleEditDebt = async () => {
    if (!editingDebt) return;
    await updateDebt.mutate(editingDebt.id, {
      name: formName,
      totalAmount: parseFloat(formTotal),
      remainingAmount: parseFloat(formRemaining),
      interestRate: parseFloat(formRate),
      minimumPayment: parseFloat(formMinPayment),
      dueDate: formDueDate,
    });
    setEditingDebt(null);
    resetForm();
    refetch();
  };

  const handleDeleteDebt = async (id: string) => {
    await deleteDebt.mutate(id);
    refetch();
  };

  const handleAddPayment = async () => {
    if (!paymentDialogDebt) return;
    await addPayment.mutate(paymentDialogDebt.id, {
      amount: parseFloat(paymentAmount),
      date: paymentDate,
      note: paymentNote || undefined,
    });
    setPaymentDialogDebt(null);
    setPaymentAmount('');
    setPaymentNote('');
    refetch();
  };

  const openEdit = (debt: Debt) => {
    setFormName(debt.name);
    setFormTotal(String(debt.totalAmount));
    setFormRemaining(String(debt.remainingAmount));
    setFormRate(String(debt.interestRate));
    setFormMinPayment(String(debt.minimumPayment));
    setFormDueDate(debt.dueDate.split('T')[0]);
    setEditingDebt(debt);
  };

  const paidPercent = (d: Debt) =>
    Math.round(((d.totalAmount - d.remainingAmount) / d.totalAmount) * 100);

  const statusBadge = (status: Debt['status']) => {
    if (status === 'PAID_OFF')
      return <Badge className="bg-green-100 text-green-700">{t('paidOff')}</Badge>;
    if (status === 'DEFAULTED')
      return <Badge variant="destructive">Defaulted</Badge>;
    return <Badge variant="secondary">Active</Badge>;
  };

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-40 animate-pulse rounded bg-muted" />
          <div className="h-10 w-32 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />
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

  // Empty
  if (!debts || debts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('title')}</h1>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CreditCard className="h-8 w-8 text-primary" />
          </div>
          <p className="text-center text-muted-foreground">{t('noDebts')}</p>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('addDebt')}
              </Button>
            </DialogTrigger>
            <DebtFormDialog
              title={t('addDebt')}
              formName={formName}
              setFormName={setFormName}
              formTotal={formTotal}
              setFormTotal={setFormTotal}
              formRemaining={formRemaining}
              setFormRemaining={setFormRemaining}
              formRate={formRate}
              setFormRate={setFormRate}
              formMinPayment={formMinPayment}
              setFormMinPayment={setFormMinPayment}
              formDueDate={formDueDate}
              setFormDueDate={setFormDueDate}
              formStrategy={formStrategy}
              setFormStrategy={setFormStrategy}
              onSubmit={handleAddDebt}
              isLoading={createDebt.isLoading}
              t={t}
              tc={tc}
            />
          </Dialog>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStrategyCompareOpen(true)}>
            <TrendingDown className="mr-2 h-4 w-4" />
            {t('strategy')}
          </Button>
          <Button variant="outline" onClick={() => setPlanDialogOpen(true)}>
            <Calendar className="mr-2 h-4 w-4" />
            {t('paymentPlan')}
          </Button>
          <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('addDebt')}
              </Button>
            </DialogTrigger>
            <DebtFormDialog
              title={t('addDebt')}
              formName={formName}
              setFormName={setFormName}
              formTotal={formTotal}
              setFormTotal={setFormTotal}
              formRemaining={formRemaining}
              setFormRemaining={setFormRemaining}
              formRate={formRate}
              setFormRate={setFormRate}
              formMinPayment={formMinPayment}
              setFormMinPayment={setFormMinPayment}
              formDueDate={formDueDate}
              setFormDueDate={setFormDueDate}
              formStrategy={formStrategy}
              setFormStrategy={setFormStrategy}
              onSubmit={handleAddDebt}
              isLoading={createDebt.isLoading}
              t={t}
              tc={tc}
            />
          </Dialog>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('totalDebt')}</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(totalDebt)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('minimumPayment')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(monthlyPayments)}</p>
            <p className="text-xs text-muted-foreground">/month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('dueDate')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {activeDebts.length > 0 ? (
              <p className="text-2xl font-bold">
                {formatDate(
                  activeDebts.reduce((nearest, d) =>
                    new Date(d.dueDate) < new Date(nearest.dueDate) ? d : nearest
                  ).dueDate
                )}
              </p>
            ) : (
              <p className="text-2xl font-bold">--</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('totalInterest')}</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalInterest)}</p>
            <p className="text-xs text-muted-foreground">/year est.</p>
          </CardContent>
        </Card>
      </div>

      {/* Debt List */}
      <div className="space-y-4">
        {debts.map((debt) => (
          <Card key={debt.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{debt.name}</CardTitle>
                    {statusBadge(debt.status)}
                  </div>
                  <CardDescription className="mt-1">
                    {t('interestRate')}: {debt.interestRate}% | {t('minimumPayment')}:{' '}
                    {formatCurrency(debt.minimumPayment)} | {t('dueDate')}:{' '}
                    {formatDate(debt.dueDate)}
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(debt)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteDebt(debt.id)}
                    disabled={deleteDebt.isLoading}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {formatCurrency(debt.totalAmount - debt.remainingAmount)} / {formatCurrency(debt.totalAmount)}
                </span>
                <span className="font-medium">{paidPercent(debt)}%</span>
              </div>
              <Progress value={paidPercent(debt)} className="h-2" />
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {t('remaining')}: <span className="font-semibold text-foreground">{formatCurrency(debt.remainingAmount)}</span>
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaymentDialogDebt(debt)}
                  >
                    <Receipt className="mr-1 h-3 w-3" />
                    {t('addPayment')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setExpandedDebt(expandedDebt === debt.id ? null : debt.id)
                    }
                  >
                    {expandedDebt === debt.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    {t('payments')}
                  </Button>
                </div>
              </div>
            </CardContent>

            {/* Expanded payment history */}
            {expandedDebt === debt.id && (
              <div className="border-t bg-muted/30 px-6 py-4">
                <h4 className="mb-3 text-sm font-semibold">{t('payments')}</h4>
                {debt.payments && debt.payments.length > 0 ? (
                  <div className="space-y-2">
                    {debt.payments.map((p: DebtPayment) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-md bg-background px-3 py-2 text-sm"
                      >
                        <div>
                          <span className="font-medium">{formatCurrency(p.amount)}</span>
                          {p.note && (
                            <span className="ml-2 text-muted-foreground">- {p.note}</span>
                          )}
                        </div>
                        <span className="text-muted-foreground">{formatDate(p.date)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Edit Debt Dialog */}
      <Dialog open={!!editingDebt} onOpenChange={(open) => { if (!open) { setEditingDebt(null); resetForm(); } }}>
        <DebtFormDialog
          title={t('editDebt')}
          formName={formName}
          setFormName={setFormName}
          formTotal={formTotal}
          setFormTotal={setFormTotal}
          formRemaining={formRemaining}
          setFormRemaining={setFormRemaining}
          formRate={formRate}
          setFormRate={setFormRate}
          formMinPayment={formMinPayment}
          setFormMinPayment={setFormMinPayment}
          formDueDate={formDueDate}
          setFormDueDate={setFormDueDate}
          formStrategy={formStrategy}
          setFormStrategy={setFormStrategy}
          onSubmit={handleEditDebt}
          isLoading={updateDebt.isLoading}
          t={t}
          tc={tc}
        />
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={!!paymentDialogDebt} onOpenChange={(open) => { if (!open) setPaymentDialogDebt(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('addPayment')}</DialogTitle>
            <DialogDescription>
              {paymentDialogDebt?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Note</label>
              <Input
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="Optional note"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogDebt(null)}>
              {tc('cancel')}
            </Button>
            <Button
              onClick={handleAddPayment}
              disabled={!paymentAmount || addPayment.isLoading}
            >
              {addPayment.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tc('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Plan Dialog */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('paymentPlan')}</DialogTitle>
          </DialogHeader>
          <div className="mb-4">
            <Select value={planStrategy} onValueChange={(v) => setPlanStrategy(v as 'snowball' | 'avalanche')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="snowball">{t('snowball')}</SelectItem>
                <SelectItem value="avalanche">{t('avalanche')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="max-h-96 overflow-auto">
            {(planStrategy === 'snowball' ? snowballPlan : avalanchePlan) ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-2 text-left">Month</th>
                    <th className="px-2 py-2 text-left">Debt</th>
                    <th className="px-2 py-2 text-right">Payment</th>
                    <th className="px-2 py-2 text-right">Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(planStrategy === 'snowball' ? snowballPlan : avalanchePlan)
                    ? ((planStrategy === 'snowball' ? snowballPlan : avalanchePlan) as Record<string, unknown>[]).map(
                        (row: Record<string, unknown>, i: number) => (
                          <tr key={i} className="border-b">
                            <td className="px-2 py-2">{String(row.month ?? i + 1)}</td>
                            <td className="px-2 py-2">{String(row.debtName ?? '--')}</td>
                            <td className="px-2 py-2 text-right">
                              {formatCurrency(Number(row.payment ?? 0))}
                            </td>
                            <td className="px-2 py-2 text-right">
                              {formatCurrency(Number(row.remaining ?? 0))}
                            </td>
                          </tr>
                        )
                      )
                    : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-muted-foreground">
                          {tc('noData')}
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            ) : (
              <p className="py-6 text-center text-muted-foreground">{tc('loading')}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Strategy Comparison Dialog */}
      <Dialog open={strategyCompareOpen} onOpenChange={setStrategyCompareOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('strategy')}</DialogTitle>
            <DialogDescription>
              Compare snowball vs avalanche strategies
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Snowflake className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-base">{t('snowball')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {snowballPlan && typeof snowballPlan === 'object' && !Array.isArray(snowballPlan) ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('totalInterest')}:</span>
                      <span className="font-semibold">
                        {formatCurrency(Number((snowballPlan as Record<string, unknown>).totalInterest ?? 0))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('monthsToPayoff')}:</span>
                      <span className="font-semibold">
                        {String((snowballPlan as Record<string, unknown>).monthsToPayoff ?? '--')}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">Pay smallest debts first for quick wins.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Mountain className="h-5 w-5 text-orange-500" />
                  <CardTitle className="text-base">{t('avalanche')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {avalanchePlan && typeof avalanchePlan === 'object' && !Array.isArray(avalanchePlan) ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('totalInterest')}:</span>
                      <span className="font-semibold">
                        {formatCurrency(Number((avalanchePlan as Record<string, unknown>).totalInterest ?? 0))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('monthsToPayoff')}:</span>
                      <span className="font-semibold">
                        {String((avalanchePlan as Record<string, unknown>).monthsToPayoff ?? '--')}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">Pay highest-interest debts first to save money.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Debt Form Dialog Content ---
function DebtFormDialog({
  title,
  formName,
  setFormName,
  formTotal,
  setFormTotal,
  formRemaining,
  setFormRemaining,
  formRate,
  setFormRate,
  formMinPayment,
  setFormMinPayment,
  formDueDate,
  setFormDueDate,
  formStrategy,
  setFormStrategy,
  onSubmit,
  isLoading,
  t,
  tc,
}: {
  title: string;
  formName: string;
  setFormName: (v: string) => void;
  formTotal: string;
  setFormTotal: (v: string) => void;
  formRemaining: string;
  setFormRemaining: (v: string) => void;
  formRate: string;
  setFormRate: (v: string) => void;
  formMinPayment: string;
  setFormMinPayment: (v: string) => void;
  formDueDate: string;
  setFormDueDate: (v: string) => void;
  formStrategy: string;
  setFormStrategy: (v: string) => void;
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
          <label className="text-sm font-medium">{t('name')}</label>
          <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Car Loan" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">{t('totalAmount')}</label>
            <Input type="number" step="0.01" value={formTotal} onChange={(e) => setFormTotal(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">{t('remaining')}</label>
            <Input type="number" step="0.01" value={formRemaining} onChange={(e) => setFormRemaining(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">{t('interestRate')} (%)</label>
            <Input type="number" step="0.01" value={formRate} onChange={(e) => setFormRate(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">{t('minimumPayment')}</label>
            <Input type="number" step="0.01" value={formMinPayment} onChange={(e) => setFormMinPayment(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">{t('dueDate')}</label>
          <Input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">{t('strategy')}</label>
          <Select value={formStrategy} onValueChange={setFormStrategy}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="snowball">{t('snowball')}</SelectItem>
              <SelectItem value="avalanche">{t('avalanche')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={onSubmit} disabled={!formName || !formTotal || isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {tc('save')}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
