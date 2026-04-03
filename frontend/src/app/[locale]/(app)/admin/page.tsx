'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { useFetch } from '@/hooks/useApi';
import * as api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AreaChart } from '@/components/charts/area-chart';
import { BarChart } from '@/components/charts/bar-chart';
import { PieChart } from '@/components/charts/pie-chart';
import {
  Users,
  CreditCard,
  DollarSign,
  UserPlus,
  Loader2,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  TrendingUp,
  BarChart3,
} from 'lucide-react';

// --- Types ---

interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  subscriptionsByTier: Record<string, number>;
  mrr: number;
  totalRevenue: number;
  newUsersToday: number;
  newUsersWeek: number;
  newUsersMonth: number;
  churnRate: number;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  subscriptionTier: string;
  locale: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  score: number | null;
  status: string;
  _count: {
    incomes: number;
    expenses: number;
    debts: number;
    financialScores: number;
  };
}

interface UsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface RevenueItem {
  month: string;
  revenue: number;
  users: number;
  [key: string]: unknown;
}

interface GrowthData {
  months: Array<{ month: string; newUsers: number; totalUsers: number }>;
  conversionRate: number;
  totalUsers: number;
  paidUsers: number;
}

// --- Helpers ---

const TIERS = ['free', 'basic', 'pro', 'premium'] as const;

function tierBadgeClass(tier: string): string {
  switch (tier) {
    case 'free':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    case 'basic':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    case 'pro':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
    case 'premium':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300';
    default:
      return '';
  }
}

function statusBadgeClass(status: string): string {
  if (status === 'active') {
    return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
  }
  return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// --- Component ---

export default function AdminPage() {
  const t = useTranslations('admin');
  const { user } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Fetch data
  const { data: stats, isLoading: statsLoading, error: statsError } = useFetch<AdminStats>(
    () => api.getAdminStats() as Promise<AdminStats>,
    []
  );

  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useFetch<UsersResponse>(
    () => {
      const params: Record<string, string> = {
        page: String(currentPage),
        limit: String(ITEMS_PER_PAGE),
      };
      if (searchQuery) params.search = searchQuery;
      if (filterTier !== 'all') params.tier = filterTier;
      return api.getAdminUsers(params) as Promise<UsersResponse>;
    },
    [currentPage, searchQuery, filterTier]
  );

  const { data: revenueData } = useFetch<RevenueItem[]>(
    () => api.getRevenueChart() as Promise<RevenueItem[]>,
    []
  );

  const { data: growthData } = useFetch<GrowthData>(
    () => api.getGrowthMetrics() as Promise<GrowthData>,
    []
  );

  // Actions
  const handleChangeTier = useCallback(async (userId: string, newTier: string) => {
    try {
      await api.updateUserTier(userId, newTier);
      refetchUsers();
    } catch {
      // silently fail - could add toast
    }
  }, [refetchUsers]);

  const handleToggleStatus = useCallback(async (userId: string, currentlyActive: boolean) => {
    try {
      await api.toggleUserStatus(userId, !currentlyActive);
      refetchUsers();
    } catch {
      // silently fail
    }
  }, [refetchUsers]);

  const handleExport = useCallback(async () => {
    try {
      const data = await api.exportUsers('json');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently fail
    }
  }, []);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);

  const handleFilterTier = useCallback((tier: string) => {
    setFilterTier(tier);
    setCurrentPage(1);
  }, []);

  // Access check
  const isAdmin =
    user?.email?.includes('admin') || user?.email === 'demo@flowfi.ai';

  if (!isAdmin) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold">{t('accessDenied')}</h2>
        </div>
      </div>
    );
  }

  // Loading state
  if (statsLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">{t('loading')}</span>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <AlertCircle className="h-8 w-8 text-destructive mr-2" />
        <span className="text-destructive">{t('error')}</span>
      </div>
    );
  }

  // Prepare chart data
  const subscriptionPieData = stats
    ? Object.entries(stats.subscriptionsByTier).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }))
    : [];

  const totalPages = usersData?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          {t('exportUsers')}
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('totalUsers')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.totalUsers?.toLocaleString() ?? '-'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('activeSubscriptions')}
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats?.activeSubscriptions?.toLocaleString() ?? '-'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('mrr')}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats ? formatCurrency(stats.mrr) : '-'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('newUsersMonth')}
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats?.newUsersMonth?.toLocaleString() ?? '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
          <TabsTrigger value="users">{t('users')}</TabsTrigger>
          <TabsTrigger value="revenue">{t('revenue')}</TabsTrigger>
        </TabsList>

        {/* --- Overview Tab --- */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Revenue Area Chart */}
            <AreaChart
              data={revenueData ?? []}
              xAxisKey="month"
              dataKey="revenue"
              color="hsl(var(--primary))"
              title={t('revenueChart')}
              height={300}
              formatValue={(v: number) => formatCurrency(v)}
            />

            {/* User Growth Bar Chart */}
            <BarChart
              data={growthData?.months ?? []}
              xAxisKey="month"
              bars={[
                { dataKey: 'newUsers', color: 'hsl(250, 60%, 50%)', name: t('newUsers') },
              ]}
              title={t('userGrowth')}
              height={300}
            />
          </div>

          {/* Subscription Distribution Pie Chart */}
          <div className="grid gap-6 lg:grid-cols-2">
            <PieChart
              data={subscriptionPieData}
              title={t('subscriptionDistribution')}
              height={300}
              donut
            />

            {/* Quick Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">{t('quickActions')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('conversionRate')}</span>
                  <span className="text-sm font-semibold">
                    {growthData ? `${(growthData.conversionRate * 100).toFixed(1)}%` : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('paidUsers')}</span>
                  <span className="text-sm font-semibold">
                    {growthData?.paidUsers?.toLocaleString() ?? '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Churn Rate</span>
                  <span className="text-sm font-semibold">
                    {stats ? `${(stats.churnRate * 100).toFixed(2)}%` : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Revenue</span>
                  <span className="text-sm font-semibold">
                    {stats ? formatCurrency(stats.totalRevenue) : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">New Today</span>
                  <span className="text-sm font-semibold">
                    {stats?.newUsersToday ?? '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">New This Week</span>
                  <span className="text-sm font-semibold">
                    {stats?.newUsersWeek ?? '-'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- Users Tab --- */}
        <TabsContent value="users" className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('searchUsers')}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge
                className={`cursor-pointer ${filterTier === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                onClick={() => handleFilterTier('all')}
              >
                {t('allPlans')}
              </Badge>
              {TIERS.map((tier) => (
                <Badge
                  key={tier}
                  className={`cursor-pointer ${filterTier === tier ? 'bg-primary text-primary-foreground' : tierBadgeClass(tier)}`}
                  onClick={() => handleFilterTier(tier)}
                >
                  {t(tier)}
                </Badge>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('name')}</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('email')}</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('plan')}</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('status')}</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('score')}</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('joined')}</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersLoading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center">
                          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                        </td>
                      </tr>
                    ) : !usersData?.users?.length ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                          {t('noUsers')}
                        </td>
                      </tr>
                    ) : (
                      usersData.users.map((u) => {
                        const isActive = u.status === 'active';
                        return (
                          <tr key={u.id} className="border-b transition-colors hover:bg-muted/30">
                            <td className="px-4 py-3 font-medium">{u.name}</td>
                            <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className={tierBadgeClass(u.subscriptionTier)}>
                                {u.subscriptionTier}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className={statusBadgeClass(u.status)}>
                                {isActive ? t('active') : t('disabled')}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">{u.score ?? '-'}</td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {formatDate(u.createdAt)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" title={t('viewDetails')}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {/* Tier dropdown */}
                                <select
                                  className="h-8 rounded-md border bg-background px-2 text-xs"
                                  value={u.subscriptionTier}
                                  onChange={(e) => handleChangeTier(u.id, e.target.value)}
                                  title={t('changeTier')}
                                >
                                  {TIERS.map((tier) => (
                                    <option key={tier} value={tier}>
                                      {tier}
                                    </option>
                                  ))}
                                </select>
                                <Button
                                  variant={isActive ? 'destructive' : 'default'}
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => handleToggleStatus(u.id, isActive)}
                                >
                                  {isActive ? t('disable') : t('enable')}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t('page')} {currentPage} {t('of')} {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  {t('previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  {t('next')}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* --- Revenue Tab --- */}
        <TabsContent value="revenue" className="space-y-6">
          {/* Revenue KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('mrr')}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {stats ? formatCurrency(stats.mrr) : '-'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Churn Rate
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {stats ? `${(stats.churnRate * 100).toFixed(2)}%` : '-'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Revenue / User
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {stats && stats.activeSubscriptions > 0
                    ? formatCurrency(stats.mrr / stats.activeSubscriptions)
                    : '-'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {stats ? formatCurrency(stats.totalRevenue) : '-'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* MRR Trend Chart */}
          <AreaChart
            data={revenueData ?? []}
            xAxisKey="month"
            series={[
              { key: 'revenue', label: t('revenue'), color: 'hsl(var(--primary))' },
              { key: 'users', label: t('paidUsers'), color: 'hsl(180, 60%, 45%)' },
            ]}
            title={t('revenueChart')}
            height={350}
            formatValue={(v: number) => formatCurrency(v)}
          />

          {/* Top Subscribers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Top Subscribers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {usersData?.users
                  ?.filter((u) => u.subscriptionTier === 'premium' || u.subscriptionTier === 'pro')
                  .slice(0, 5)
                  .map((u) => (
                    <div key={u.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                      </div>
                      <Badge variant="outline" className={tierBadgeClass(u.subscriptionTier)}>
                        {u.subscriptionTier}
                      </Badge>
                    </div>
                  )) ?? (
                  <p className="text-sm text-muted-foreground">{t('noUsers')}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
