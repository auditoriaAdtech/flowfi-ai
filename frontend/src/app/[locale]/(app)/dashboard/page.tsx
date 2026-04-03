'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useFetch } from '@/hooks/useApi';
import * as api from '@/lib/api';
import { formatCurrency, formatDate, getCategoryColor } from '@/lib/utils';
import type { DashboardData, Insight, Income, Expense } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AreaChart } from '@/components/charts/area-chart';
import { PieChart } from '@/components/charts/pie-chart';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  MessageSquare,
  Loader2,
  AlertCircle,
  Lightbulb,
  Target,
  CreditCard,
  Sparkles,
  Activity,
  DollarSign,
} from 'lucide-react';

export default function DashboardPage() {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();

  const { data: dashboard, isLoading, error } = useFetch<DashboardData>(
    () => api.getDashboard() as Promise<DashboardData>,
    []
  );

  const { data: insights } = useFetch<Insight[]>(
    () => api.getInsights() as Promise<Insight[]>,
    []
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
          <p className="text-destructive">{t('common.error')}</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  const data = dashboard!;
  const balance = data.totalIncome - data.totalExpenses;
  const isPositive = balance >= 0;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('dashboard.welcome', { name: user?.name || '' })}
          </h1>
          <p className="text-muted-foreground">{t('dashboard.overview')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => router.push('/income')}>
            <Plus className="w-4 h-4 mr-1" />
            {t('income.addIncome')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => router.push('/expenses')}>
            <Plus className="w-4 h-4 mr-1" />
            {t('expenses.addExpense')}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => router.push('/coach')}>
            <MessageSquare className="w-4 h-4 mr-1" />
            {t('nav.coach')}
          </Button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Income */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('income.monthlyTotal')}</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(data.totalIncome, user?.currency)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600">
              <ArrowUpRight className="w-3 h-3" />
              <span>{t('nav.income')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Expenses */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('expenses.monthlyTotal')}</p>
                <p className="text-2xl font-bold text-rose-600">
                  {formatCurrency(data.totalExpenses, user?.currency)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-rose-50 dark:bg-rose-950 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-rose-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-rose-600">
              <ArrowDownRight className="w-3 h-3" />
              <span>{t('nav.expenses')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Balance */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('dashboard.monthlyBalance')}</p>
                <p className={`text-2xl font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatCurrency(balance, user?.currency)}
                </p>
              </div>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isPositive ? 'bg-emerald-50 dark:bg-emerald-950' : 'bg-rose-50 dark:bg-rose-950'}`}>
                <Wallet className={`w-5 h-5 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`} />
              </div>
            </div>
            <div className={`flex items-center gap-1 mt-2 text-xs ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              <span>{isPositive ? 'Surplus' : 'Deficit'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Savings Rate */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('dashboard.savingsRate')}</p>
                <p className="text-2xl font-bold text-primary">
                  {(data.savingsRate * 100).toFixed(1)}%
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <PiggyBank className="w-5 h-5 text-primary" />
              </div>
            </div>
            <Progress value={data.savingsRate * 100} className="mt-3 h-1.5" />
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cash Flow Area Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4" />
              {t('dashboard.cashFlow')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.cashFlow && data.cashFlow.length > 0 ? (
              <AreaChart
                data={data.cashFlow}
                xKey="month"
                series={[
                  { key: 'income', label: t('nav.income'), color: 'hsl(var(--success))' },
                  { key: 'expenses', label: t('nav.expenses'), color: 'hsl(var(--destructive))' },
                ]}
                height={280}
              />
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                {t('common.noData')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expenses by Category Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              {t('dashboard.expensesByCategory')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.expensesByCategory && data.expensesByCategory.length > 0 ? (
              <PieChart
                data={data.expensesByCategory.map((item) => ({
                  name: item.category,
                  value: item.amount,
                }))}
                height={240}
              />
            ) : (
              <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">
                {t('common.noData')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions + Side Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Transactions */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push('/expenses')}>
              View all
            </Button>
          </CardHeader>
          <CardContent>
            {data.recentTransactions && data.recentTransactions.length > 0 ? (
              <div className="space-y-1">
                {data.recentTransactions.slice(0, 7).map((txn) => {
                  const isIncome = 'type' in txn && ((txn as Income).type === 'FIXED' || (txn as Income).type === 'VARIABLE');
                  const cat = txn.category.toLowerCase();
                  return (
                    <div key={txn.id} className="flex items-center justify-between py-2.5 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${getCategoryColor(cat)}`}>
                          {txn.category.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{txn.description}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(txn.date)}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-semibold tabular-nums ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isIncome ? '+' : '-'}{formatCurrency(txn.amount, user?.currency)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <DollarSign className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">{t('common.noData')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Financial Score Gauge */}
          {data.score && (
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/score')}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">{t('score.title')}</p>
                  <Badge variant="outline" className="text-xs">{data.score.level}</Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/30" />
                      <circle
                        cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4"
                        strokeDasharray={`${(data.score.score / 100) * 176} 176`}
                        strokeLinecap="round" className="text-primary"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">{data.score.score}</span>
                  </div>
                  <div className="space-y-1.5 flex-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('score.savingsRate')}</span>
                      <span className="font-medium">{(data.score.savingsRate * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('score.debtToIncome')}</span>
                      <span className="font-medium">{(data.score.debtToIncome * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('score.spendingDiscipline')}</span>
                      <span className="font-medium">{(data.score.spendingDiscipline * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Debts */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/debts')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium">{t('debts.title')}</p>
              </div>
              <p className="text-xs text-muted-foreground mb-1">{t('debts.totalDebt')}</p>
              <p className="text-lg font-bold">{formatCurrency(data.monthlyBalance || 0, user?.currency)}</p>
            </CardContent>
          </Card>

          {/* Projected Savings */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium">{t('dashboard.projectedSavings')}</p>
              </div>
              <p className="text-lg font-bold text-primary">{formatCurrency(data.projectedSavings || 0, user?.currency)}</p>
              <p className="text-xs text-muted-foreground mt-1">Next 12 months</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Insights */}
      {insights && insights.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">AI Insights</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {insights.slice(0, 4).map((insight) => (
              <Card
                key={insight.id}
                className={`border-l-4 ${
                  insight.type === 'WARNING' ? 'border-l-warning'
                    : insight.type === 'OPPORTUNITY' ? 'border-l-success'
                    : insight.type === 'ACHIEVEMENT' ? 'border-l-primary'
                    : 'border-l-info'
                }`}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{insight.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{insight.description}</p>
                    </div>
                  </div>
                  {insight.priority === 'HIGH' && (
                    <Badge variant="destructive" className="mt-2 text-[10px]">High Priority</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
