'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Brain,
  Lightbulb,
  TrendingUp,
  PiggyBank,
  AlertTriangle,
  Award,
  Loader2,
  AlertCircle,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
} from 'lucide-react';

import { cn, formatCurrency } from '@/lib/utils';
import * as api from '@/lib/api';
import { useFetch, useMutation } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import type { Insight, SavingsRecommendation, DashboardData } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChatInterface } from '@/components/chat/chat-interface';

function insightIcon(type: Insight['type']) {
  switch (type) {
    case 'TIP':
      return <Lightbulb className="h-4 w-4 text-blue-500" />;
    case 'WARNING':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'OPPORTUNITY':
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case 'ACHIEVEMENT':
      return <Award className="h-4 w-4 text-purple-500" />;
    default:
      return <Lightbulb className="h-4 w-4" />;
  }
}

function insightColor(type: Insight['type']) {
  switch (type) {
    case 'TIP':
      return 'border-blue-200 bg-blue-50/50';
    case 'WARNING':
      return 'border-yellow-200 bg-yellow-50/50';
    case 'OPPORTUNITY':
      return 'border-green-200 bg-green-50/50';
    case 'ACHIEVEMENT':
      return 'border-purple-200 bg-purple-50/50';
    default:
      return '';
  }
}

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export default function CoachPage() {
  const t = useTranslations('coach');
  const tc = useTranslations('common');

  const { user } = useAuth();

  const { data: insights, isLoading: insightsLoading } = useFetch<Insight[]>(
    () => api.getInsights() as Promise<Insight[]>,
    []
  );
  const { data: tips } = useFetch<SavingsRecommendation[]>(
    () => api.getSavingsTips() as Promise<SavingsRecommendation[]>,
    []
  );
  const { data: dashboard } = useFetch<DashboardData>(
    () => api.getDashboard() as Promise<DashboardData>,
    []
  );

  const sendMessage = useMutation<unknown, [string]>((message) =>
    api.chatWithCoach(message)
  );

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const handleSend = useCallback(
    async (message: string) => {
      const userMsg: ChatMsg = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setChatLoading(true);

      try {
        const result = (await api.chatWithCoach(message)) as {
          reply?: string;
          content?: string;
          message?: string;
        };
        const assistantMsg: ChatMsg = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result?.reply ?? result?.content ?? result?.message ?? 'I can help you with that!',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        const errMsg: ChatMsg = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setChatLoading(false);
      }
    },
    []
  );

  const suggestedTopics = t.raw('suggestions') as string[];

  return (
    <div className="flex h-[calc(100vh-10rem)] gap-6">
      {/* Sidebar */}
      <div className="hidden w-80 shrink-0 space-y-4 overflow-y-auto lg:block">
        {/* Financial Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Wallet className="h-4 w-4" />
              Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Income</span>
                  <span className="flex items-center gap-1 text-sm font-medium text-green-600">
                    <ArrowUpRight className="h-3 w-3" />
                    {formatCurrency(dashboard.totalIncome)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Expenses</span>
                  <span className="flex items-center gap-1 text-sm font-medium text-red-500">
                    <ArrowDownRight className="h-3 w-3" />
                    {formatCurrency(dashboard.totalExpenses)}
                  </span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Balance</span>
                    <span className="text-sm font-bold">
                      {formatCurrency(dashboard.monthlyBalance)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Savings Rate</span>
                  <Badge variant="outline">{Math.round(dashboard.savingsRate)}%</Badge>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-5 animate-pulse rounded bg-muted" />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        {dashboard?.score && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Financial Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-lg font-bold text-primary">
                    {dashboard.score.score}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">{dashboard.score.level}</p>
                  <p className="text-xs text-muted-foreground">Current Level</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Suggested Topics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Brain className="h-4 w-4" />
              Suggested Topics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {suggestedTopics.map((topic, i) => (
              <button
                key={i}
                onClick={() => handleSend(topic)}
                className="w-full rounded-md border px-3 py-2 text-left text-xs transition-colors hover:bg-accent"
              >
                {topic}
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col space-y-4">
        {/* AI Insights Cards */}
        {insights && insights.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {insights.slice(0, 4).map((insight) => (
              <Card
                key={insight.id}
                className={cn('border transition-shadow hover:shadow-sm', insightColor(insight.type))}
              >
                <CardContent className="flex items-start gap-3 pt-4">
                  {insightIcon(insight.type)}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium leading-tight">{insight.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {insight.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Savings Recommendations */}
        {tips && tips.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <PiggyBank className="h-4 w-4" />
                Savings Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {tips.slice(0, 4).map((tip, i) => (
                  <div
                    key={i}
                    className="shrink-0 rounded-md border bg-card p-3"
                    style={{ minWidth: 180 }}
                  >
                    <p className="text-xs font-medium">{tip.category}</p>
                    <p className="mt-1 text-lg font-bold text-green-600">
                      {formatCurrency(tip.potentialSavings)}
                    </p>
                    <p className="text-xs text-muted-foreground">potential savings</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat Interface */}
        <ChatInterface
          messages={messages}
          onSendMessage={handleSend}
          isLoading={chatLoading}
          suggestedQuestions={suggestedTopics}
          placeholder={t('placeholder')}
          title={t('title')}
          className="flex-1"
        />
      </div>
    </div>
  );
}
