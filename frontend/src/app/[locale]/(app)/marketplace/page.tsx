'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Store,
  CreditCard,
  Banknote,
  ShieldCheck,
  TrendingUp,
  Star,
  ExternalLink,
  AlertCircle,
  Filter,
  CheckCircle,
  XCircle,
} from 'lucide-react';

import { cn, formatCurrency } from '@/lib/utils';
import * as api from '@/lib/api';
import { useFetch } from '@/hooks/useApi';
import type { MarketplaceOffer, FinancialScore } from '@/types';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function typeIcon(type: MarketplaceOffer['type']) {
  switch (type) {
    case 'LOAN':
      return <Banknote className="h-4 w-4" />;
    case 'CREDIT_CARD':
      return <CreditCard className="h-4 w-4" />;
    case 'INSURANCE':
      return <ShieldCheck className="h-4 w-4" />;
    case 'INVESTMENT':
      return <TrendingUp className="h-4 w-4" />;
    default:
      return <Store className="h-4 w-4" />;
  }
}

function typeBadgeColor(type: MarketplaceOffer['type']) {
  switch (type) {
    case 'LOAN':
      return 'bg-blue-100 text-blue-700';
    case 'CREDIT_CARD':
      return 'bg-purple-100 text-purple-700';
    case 'INSURANCE':
      return 'bg-green-100 text-green-700';
    case 'INVESTMENT':
      return 'bg-orange-100 text-orange-700';
    default:
      return '';
  }
}

export default function MarketplacePage() {
  const t = useTranslations('marketplace');
  const tc = useTranslations('common');

  const { data: allOffers, isLoading: allLoading, error: allError, refetch } = useFetch<MarketplaceOffer[]>(
    () => api.getMarketplace() as Promise<MarketplaceOffer[]>,
    []
  );
  const { data: eligibleOffers } = useFetch<MarketplaceOffer[]>(
    () => api.getEligibleOffers() as Promise<MarketplaceOffer[]>,
    []
  );
  const { data: scoreData } = useFetch<FinancialScore>(
    () => api.getScore() as Promise<FinancialScore>,
    []
  );

  const [filterType, setFilterType] = useState<string>('ALL');

  const userScore = scoreData?.score ?? 0;

  const filterOffers = (offers: MarketplaceOffer[]) =>
    filterType === 'ALL' ? offers : offers.filter((o) => o.type === filterType);

  const matchPercentage = (offer: MarketplaceOffer) => {
    if (offer.minScore <= 0) return 100;
    return Math.min(100, Math.round((userScore / offer.minScore) * 100));
  };

  // Loading
  if (allLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        <div className="h-24 animate-pulse rounded-lg bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  // Error
  if (allError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">{tc('error')}</p>
        <Button onClick={refetch}>Retry</Button>
      </div>
    );
  }

  const OfferCard = ({ offer, eligible }: { offer: MarketplaceOffer; eligible: boolean }) => {
    const match = matchPercentage(offer);
    return (
      <Card className={cn('flex flex-col transition-shadow hover:shadow-md', !eligible && 'opacity-75')}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                {typeIcon(offer.type)}
              </div>
              <div>
                <CardTitle className="text-sm">{offer.title}</CardTitle>
                <CardDescription className="text-xs">{offer.provider}</CardDescription>
              </div>
            </div>
            <Badge className={typeBadgeColor(offer.type)}>
              {t(offer.type === 'CREDIT_CARD' ? 'creditCard' : offer.type.toLowerCase() as 'loan' | 'insurance' | 'investment')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-3">
          <p className="line-clamp-2 text-sm text-muted-foreground">{offer.description}</p>
          <div className="flex items-center justify-between text-sm">
            {offer.interestRate != null && (
              <div>
                <span className="text-muted-foreground">{t('interestRate')}: </span>
                <span className="font-semibold">{offer.interestRate}%</span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">{t('minScore')}: </span>
              <span className="font-semibold">{offer.minScore}</span>
            </div>
          </div>
          {/* Match indicator */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t('matchScore')}</span>
              <span className={cn('font-medium', match >= 100 ? 'text-green-600' : match >= 70 ? 'text-yellow-600' : 'text-red-500')}>
                {match}%
              </span>
            </div>
            <Progress
              value={match}
              className={cn(
                'h-1.5',
                match >= 100 ? '[&>div]:bg-green-500' : match >= 70 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-red-400'
              )}
            />
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          {eligible ? (
            <Button asChild className="w-full" size="sm">
              <a href={offer.url || '#'} target="_blank" rel="noopener noreferrer">
                {t('apply')}
                <ExternalLink className="ml-2 h-3 w-3" />
              </a>
            </Button>
          ) : (
            <Button variant="outline" className="w-full" size="sm" disabled>
              <XCircle className="mr-2 h-3 w-3" />
              {t('notEligible')}
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      {/* User Score Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <span className="text-xl font-bold text-primary">{userScore}</span>
          </div>
          <div>
            <p className="text-sm font-medium">Your Financial Score</p>
            <p className="text-xs text-muted-foreground">
              Higher score unlocks better offers
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Star className="h-4 w-4 fill-primary text-primary" />
            <span className="text-sm font-medium">{scoreData?.level ?? 'Beginner'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="LOAN">{t('loan')}</SelectItem>
            <SelectItem value="CREDIT_CARD">{t('creditCard')}</SelectItem>
            <SelectItem value="INSURANCE">{t('insurance')}</SelectItem>
            <SelectItem value="INVESTMENT">{t('investment')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="eligible">
        <TabsList>
          <TabsTrigger value="eligible">
            <CheckCircle className="mr-2 h-4 w-4" />
            {t('eligible')}
          </TabsTrigger>
          <TabsTrigger value="all">
            <Store className="mr-2 h-4 w-4" />
            {t('allOffers')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="eligible">
          {eligibleOffers && filterOffers(eligibleOffers).length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filterOffers(eligibleOffers).map((offer) => (
                <OfferCard key={offer.id} offer={offer} eligible={true} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-16">
              <Store className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No eligible offers found. Improve your score to unlock more.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="all">
          {allOffers && filterOffers(allOffers).length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filterOffers(allOffers).map((offer) => {
                const eligible = userScore >= offer.minScore;
                return <OfferCard key={offer.id} offer={offer} eligible={eligible} />;
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-16">
              <Store className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">{tc('noData')}</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
