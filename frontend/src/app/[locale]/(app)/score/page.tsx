'use client';

import { useTranslations } from 'next-intl';
import {
  RefreshCw,
  TrendingUp,
  Shield,
  CreditCard,
  CheckCircle,
  ShoppingBag,
  Target,
  Loader2,
  AlertCircle,
  Lock,
  Trophy,
  Star,
  Zap,
} from 'lucide-react';

import { cn, formatDate } from '@/lib/utils';
import * as api from '@/lib/api';
import { useFetch, useMutation } from '@/hooks/useApi';
import type { FinancialScore, UserAchievement } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AreaChartComponent } from '@/components/charts/area-chart';

function scoreColor(score: number): string {
  if (score < 40) return '#ef4444';
  if (score < 60) return '#eab308';
  if (score < 80) return '#22c55e';
  return '#3b82f6';
}

function scoreLabel(score: number, t: (key: string) => string): string {
  if (score < 40) return t('poor');
  if (score < 60) return t('fair');
  if (score < 80) return t('good');
  return t('excellent');
}

function ScoreRing({ score, size = 180 }: { score: number; size?: number }) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = scoreColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={12}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold" style={{ color }}>
          {score}
        </span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
    </div>
  );
}

const factorIcons: Record<string, React.ReactNode> = {
  savingsRate: <Shield className="h-5 w-5 text-blue-500" />,
  debtToIncome: <CreditCard className="h-5 w-5 text-red-500" />,
  paymentConsistency: <CheckCircle className="h-5 w-5 text-green-500" />,
  spendingDiscipline: <ShoppingBag className="h-5 w-5 text-purple-500" />,
  budgetAdherence: <Target className="h-5 w-5 text-orange-500" />,
};

const factorWeights: Record<string, number> = {
  savingsRate: 25,
  debtToIncome: 20,
  paymentConsistency: 20,
  spendingDiscipline: 20,
  budgetAdherence: 15,
};

const factorTips: Record<string, string> = {
  savingsRate: 'Aim to save at least 20% of your monthly income.',
  debtToIncome: 'Keep your debt payments below 36% of your gross income.',
  paymentConsistency: 'Pay all bills on time to build consistency.',
  spendingDiscipline: 'Track expenses and avoid impulse purchases.',
  budgetAdherence: 'Stick to your monthly budget for each category.',
};

const levelIcons: Record<string, React.ReactNode> = {
  Beginner: <Star className="h-5 w-5" />,
  Saver: <Shield className="h-5 w-5" />,
  Investor: <TrendingUp className="h-5 w-5" />,
  Expert: <Zap className="h-5 w-5" />,
  Master: <Trophy className="h-5 w-5" />,
};

const levelThresholds = [
  { name: 'Beginner', min: 0 },
  { name: 'Saver', min: 30 },
  { name: 'Investor', min: 50 },
  { name: 'Expert', min: 75 },
  { name: 'Master', min: 90 },
];

export default function ScorePage() {
  const t = useTranslations('score');
  const tg = useTranslations('gamification');
  const tc = useTranslations('common');

  const { data: scoreData, isLoading, error, refetch } = useFetch<FinancialScore>(
    () => api.getScore() as Promise<FinancialScore>,
    []
  );
  const { data: history } = useFetch<FinancialScore[]>(
    () => api.getScoreHistory() as Promise<FinancialScore[]>,
    []
  );
  const { data: achievements } = useFetch<UserAchievement[]>(
    () => api.getAchievements() as Promise<UserAchievement[]>,
    []
  );
  const { data: levelData } = useFetch<Record<string, unknown>>(
    () => api.getLevel() as Promise<Record<string, unknown>>,
    []
  );

  const recalculate = useMutation(() => api.calculateScore());

  const handleRecalculate = async () => {
    await recalculate.mutate();
    refetch();
  };

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-10 w-36 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex justify-center py-12">
          <div className="h-44 w-44 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
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
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Button onClick={refetch}>Retry</Button>
      </div>
    );
  }

  const score = scoreData?.score ?? 0;
  const factors = [
    { key: 'savingsRate', value: scoreData?.savingsRate ?? 0 },
    { key: 'debtToIncome', value: scoreData?.debtToIncome ?? 0 },
    { key: 'paymentConsistency', value: scoreData?.paymentConsistency ?? 0 },
    { key: 'spendingDiscipline', value: scoreData?.spendingDiscipline ?? 0 },
    { key: 'budgetAdherence', value: scoreData?.budgetAdherence ?? 0 },
  ];

  const currentLevel = scoreData?.level ?? 'Beginner';
  const currentLevelIdx = levelThresholds.findIndex((l) => l.name === currentLevel);
  const nextLevel = levelThresholds[currentLevelIdx + 1];
  const progressToNext = nextLevel
    ? ((score - levelThresholds[currentLevelIdx].min) /
        (nextLevel.min - levelThresholds[currentLevelIdx].min)) *
      100
    : 100;

  const historyData = (history ?? []).map((h) => ({
    date: formatDate(h.calculatedAt),
    score: h.score,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Button onClick={handleRecalculate} disabled={recalculate.isLoading}>
          {recalculate.isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Recalculate
        </Button>
      </div>

      {/* Score Display */}
      <Card>
        <CardContent className="flex flex-col items-center py-8">
          <ScoreRing score={score} />
          <h2
            className="mt-4 text-2xl font-bold"
            style={{ color: scoreColor(score) }}
          >
            {scoreLabel(score, t)}
          </h2>
          <p className="text-sm text-muted-foreground">{t('yourScore')}</p>
        </CardContent>
      </Card>

      {/* Breakdown Cards */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">{t('breakdown')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {factors.map((factor) => (
            <Card key={factor.key}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {factorIcons[factor.key]}
                    <CardTitle className="text-sm">
                      {t(factor.key as 'savingsRate' | 'debtToIncome' | 'paymentConsistency' | 'spendingDiscipline' | 'budgetAdherence')}
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {factorWeights[factor.key]}% weight
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold">{Math.round(factor.value)}</span>
                  <span className="mb-1 text-sm text-muted-foreground">/100</span>
                </div>
                <Progress value={factor.value} className="h-2" />
                <p className="text-xs text-muted-foreground">{factorTips[factor.key]}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Score History */}
      {historyData.length > 0 && (
        <AreaChartComponent
          data={historyData}
          dataKey="score"
          xAxisKey="date"
          title={t('history')}
          color={scoreColor(score)}
          height={250}
        />
      )}

      {/* Level / Gamification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {levelIcons[currentLevel] ?? <Star className="h-5 w-5" />}
            {tg('level')}: {currentLevel}
          </CardTitle>
          <CardDescription>
            {nextLevel
              ? `${Math.round(progressToNext)}% progress to ${nextLevel.name}`
              : 'Maximum level reached!'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={Math.min(progressToNext, 100)} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{currentLevel}</span>
              <span>{nextLevel?.name ?? 'MAX'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">{tg('achievements')}</h2>
        {achievements && achievements.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {achievements.map((ua) => (
              <Card key={ua.id} className="border-primary/20 bg-primary/5">
                <CardContent className="flex items-center gap-3 pt-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{ua.achievement.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {ua.achievement.description}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {tg('unlocked')}: {formatDate(ua.unlockedAt)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {/* Example locked achievements */}
            {[1, 2, 3].map((i) => (
              <Card key={`locked-${i}`} className="opacity-50">
                <CardContent className="flex items-center gap-3 pt-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{tg('locked')}</p>
                    <p className="text-xs text-muted-foreground">Keep improving to unlock!</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="opacity-50">
                <CardContent className="flex items-center gap-3 pt-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{tg('locked')}</p>
                    <p className="text-xs text-muted-foreground">Keep improving to unlock!</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
