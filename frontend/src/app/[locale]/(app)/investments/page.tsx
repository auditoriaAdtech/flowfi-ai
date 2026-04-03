'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Plus,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  DollarSign,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Clock,
  ShieldCheck,
  Flame,
  Scale,
} from 'lucide-react';

import { cn, formatCurrency } from '@/lib/utils';
import { useFetch, useMutation } from '@/hooks/useApi';
import * as api from '@/lib/api';
import type { InvestmentPlan } from '@/types';
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
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
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
import { PieChartComponent } from '@/components/charts/pie-chart';
import { AreaChartComponent } from '@/components/charts/area-chart';

// Investment API helpers
const getInvestmentPlans = () => api.get<InvestmentPlan[]>('/investment-plans');
const createInvestmentPlan = (data: Record<string, unknown>) =>
  api.post<InvestmentPlan>('/investment-plans', data);

const allocationColors: Record<string, string> = {
  stocks: '#3b82f6',
  bonds: '#10b981',
  crypto: '#f59e0b',
  'real estate': '#8b5cf6',
  cash: '#6b7280',
  etfs: '#06b6d4',
  commodities: '#ec4899',
};

function riskIcon(risk: InvestmentPlan['riskProfile']) {
  switch (risk) {
    case 'CONSERVATIVE':
      return <ShieldCheck className="h-4 w-4 text-blue-500" />;
    case 'MODERATE':
      return <Scale className="h-4 w-4 text-yellow-500" />;
    case 'AGGRESSIVE':
      return <Flame className="h-4 w-4 text-red-500" />;
    default:
      return <TrendingUp className="h-4 w-4" />;
  }
}

function riskBadgeColor(risk: InvestmentPlan['riskProfile']) {
  switch (risk) {
    case 'CONSERVATIVE':
      return 'bg-blue-100 text-blue-700';
    case 'MODERATE':
      return 'bg-yellow-100 text-yellow-700';
    case 'AGGRESSIVE':
      return 'bg-red-100 text-red-700';
    default:
      return '';
  }
}

export default function InvestmentsPage() {
  const t = useTranslations('investments');
  const tc = useTranslations('common');

  const { data: plans, isLoading, error, refetch } = useFetch<InvestmentPlan[]>(
    () => getInvestmentPlans(),
    []
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  // Form
  const [formName, setFormName] = useState('');
  const [formRisk, setFormRisk] = useState<string>('MODERATE');
  const [formMonthly, setFormMonthly] = useState('');
  const [formHorizon, setFormHorizon] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const createPlan = useMutation<InvestmentPlan, [Record<string, unknown>]>((data) =>
    createInvestmentPlan(data)
  );

  const totalMonthly = plans?.reduce((s, p) => s + p.monthlyAmount, 0) ?? 0;
  const projectedTotal = plans?.reduce((s, p) => {
    const months = p.horizonMonths;
    const monthly = p.monthlyAmount;
    const r = p.expectedReturn / 100 / 12;
    if (r <= 0) return s + monthly * months;
    return s + monthly * ((Math.pow(1 + r, months) - 1) / r);
  }, 0) ?? 0;

  const resetForm = () => {
    setFormName('');
    setFormRisk('MODERATE');
    setFormMonthly('');
    setFormHorizon('');
    setFormNotes('');
  };

  const handleCreate = async () => {
    await createPlan.mutate({
      name: formName,
      riskProfile: formRisk,
      monthlyAmount: parseFloat(formMonthly),
      horizonMonths: parseInt(formHorizon),
      notes: formNotes || undefined,
    });
    setCreateOpen(false);
    resetForm();
    refetch();
  };

  const getAllocationData = (plan: InvestmentPlan) =>
    Object.entries(plan.allocation).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: value as number,
      color: allocationColors[name.toLowerCase()] ?? '#6b7280',
    }));

  const getProjectionData = (plan: InvestmentPlan) => {
    const data = [];
    const r = plan.expectedReturn / 100 / 12;
    for (let m = 0; m <= plan.horizonMonths; m += Math.max(1, Math.floor(plan.horizonMonths / 12))) {
      const value =
        r > 0
          ? plan.monthlyAmount * ((Math.pow(1 + r, m) - 1) / r)
          : plan.monthlyAmount * m;
      data.push({ month: `M${m}`, value: Math.round(value) });
    }
    return data;
  };

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
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
        <Button onClick={refetch}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('createPlan')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('createPlan')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium">Plan Name</label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Growth Portfolio" />
              </div>
              <div>
                <label className="text-sm font-medium">{t('riskProfile')}</label>
                <Select value={formRisk} onValueChange={setFormRisk}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONSERVATIVE">{t('conservative')}</SelectItem>
                    <SelectItem value="MODERATE">{t('moderate')}</SelectItem>
                    <SelectItem value="AGGRESSIVE">{t('aggressive')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{t('monthlyAmount')}</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formMonthly}
                    onChange={(e) => setFormMonthly(e.target.value)}
                    placeholder="500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('horizon')} (months)</label>
                  <Input
                    type="number"
                    value={formHorizon}
                    onChange={(e) => setFormHorizon(e.target.value)}
                    placeholder="60"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Input
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Optional notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={!formName || !formMonthly || !formHorizon || createPlan.isLoading}>
                {createPlan.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {tc('save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('monthlyAmount')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalMonthly)}</p>
            <p className="text-xs text-muted-foreground">total across all plans</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Projected Portfolio Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(projectedTotal)}</p>
            <p className="text-xs text-muted-foreground">estimated at maturity</p>
          </CardContent>
        </Card>
      </div>

      {/* Plans List */}
      {!plans || plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
          <p className="text-center text-muted-foreground">{t('noPlans')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => {
            const isExpanded = expandedPlan === plan.id;
            const allocData = getAllocationData(plan);
            const projData = getProjectionData(plan);

            return (
              <Card key={plan.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {riskIcon(plan.riskProfile)}
                      <div>
                        <CardTitle className="text-lg">
                          {(plan as any).name
                            ? String((plan as any).name)
                            : `${plan.riskProfile} Plan`}
                        </CardTitle>
                        <CardDescription>
                          {formatCurrency(plan.monthlyAmount)}/mo | {plan.horizonMonths} months |{' '}
                          {t('expectedReturn')}: {plan.expectedReturn}%
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={riskBadgeColor(plan.riskProfile)}>
                        {t(plan.riskProfile.toLowerCase() as 'conservative' | 'moderate' | 'aggressive')}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-6 border-t pt-4">
                    {/* Allocation + Projection side by side */}
                    <div className="grid gap-6 lg:grid-cols-2">
                      {/* Allocation Pie */}
                      {allocData.length > 0 && (
                        <div>
                          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                            <PieChartIcon className="h-4 w-4" />
                            {t('allocation')}
                          </h4>
                          <PieChartComponent data={allocData} donut height={220} />
                        </div>
                      )}

                      {/* Projected Growth */}
                      {projData.length > 1 && (
                        <div>
                          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                            <TrendingUp className="h-4 w-4" />
                            {t('projections')}
                          </h4>
                          <AreaChartComponent
                            data={projData}
                            dataKey="value"
                            xAxisKey="month"
                            color="#22c55e"
                            height={220}
                            formatValue={(v) => formatCurrency(v)}
                          />
                        </div>
                      )}
                    </div>

                    {/* AI Recommendations */}
                    {plan.recommendations && plan.recommendations.length > 0 && (
                      <div>
                        <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                          <Lightbulb className="h-4 w-4 text-yellow-500" />
                          {t('recommendations')}
                        </h4>
                        <div className="space-y-2">
                          {plan.recommendations.map((rec, i) => (
                            <div
                              key={i}
                              className="rounded-md border bg-muted/30 px-3 py-2 text-sm"
                            >
                              {rec}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
