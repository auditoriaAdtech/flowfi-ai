import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface LevelInfo {
  level: number;
  name: string;
  totalAchievements: number;
  nextLevelAt: number | null;
  progress: number;
}

const LEVEL_THRESHOLDS = [
  { level: 1, name: 'Beginner', minAchievements: 0 },
  { level: 2, name: 'Saver', minAchievements: 3 },
  { level: 3, name: 'Investor', minAchievements: 7 },
  { level: 4, name: 'Expert', minAchievements: 12 },
  { level: 5, name: 'Master', minAchievements: 20 },
];

@Injectable()
export class GamificationService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserAchievements(userId: string) {
    return this.prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { unlockedAt: 'desc' },
    });
  }

  async getUserLevel(userId: string): Promise<LevelInfo> {
    const count = await this.prisma.userAchievement.count({
      where: { userId },
    });

    let currentLevel = LEVEL_THRESHOLDS[0];
    for (const threshold of LEVEL_THRESHOLDS) {
      if (count >= threshold.minAchievements) {
        currentLevel = threshold;
      } else {
        break;
      }
    }

    const nextLevel = LEVEL_THRESHOLDS.find(
      (t) => t.level === currentLevel.level + 1,
    );

    const progress = nextLevel
      ? Math.round(
          ((count - currentLevel.minAchievements) /
            (nextLevel.minAchievements - currentLevel.minAchievements)) *
            100,
        )
      : 100;

    return {
      level: currentLevel.level,
      name: currentLevel.name,
      totalAchievements: count,
      nextLevelAt: nextLevel?.minAchievements ?? null,
      progress: Math.min(100, Math.max(0, progress)),
    };
  }

  async checkAndAwardAchievements(userId: string) {
    const achievements = await this.prisma.achievement.findMany();
    const existing = await this.prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    });
    const existingIds = new Set(existing.map((e) => e.achievementId));

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [incomes, expenses, debts, savingsGoals, scores] =
      await Promise.all([
        this.prisma.income.findMany({
          where: { userId, date: { gte: startOfMonth, lt: endOfMonth } },
        }),
        this.prisma.expense.findMany({
          where: { userId, date: { gte: startOfMonth, lt: endOfMonth } },
        }),
        this.prisma.debt.findMany({ where: { userId } }),
        this.prisma.savingsGoal.findMany({ where: { userId } }),
        this.prisma.financialScore.findMany({
          where: { userId },
          orderBy: { calculatedAt: 'desc' },
          take: 5,
        }),
      ]);

    const monthlyIncome = incomes.reduce((s, i) => s + i.amount, 0);
    const monthlyExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const savingsRate =
      monthlyIncome > 0
        ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
        : 0;
    const paidOffDebts = debts.filter((d) => d.status === 'PAID_OFF').length;
    const completedGoals = savingsGoals.filter(
      (g) => g.status === 'COMPLETED',
    ).length;
    const latestScore = scores.length > 0 ? scores[0].score : 0;

    const userContext = {
      savingsRate,
      paidOffDebts,
      completedGoals,
      latestScore,
      totalExpenses: monthlyExpenses,
      totalDebts: debts.length,
      activeDebts: debts.filter((d) => d.status === 'ACTIVE').length,
      scoreTrend:
        scores.length >= 2 ? scores[0].score - scores[1].score : 0,
    };

    const newlyAwarded: Array<{ achievementId: string; name: string }> = [];

    for (const achievement of achievements) {
      if (existingIds.has(achievement.id)) continue;

      const criteria = achievement.criteria as Record<string, any>;
      let earned = false;

      switch (criteria.type) {
        case 'savings_rate':
          earned = userContext.savingsRate >= (criteria.value ?? 20);
          break;
        case 'debt_paid_off':
          earned = userContext.paidOffDebts >= (criteria.value ?? 1);
          break;
        case 'goal_completed':
          earned = userContext.completedGoals >= (criteria.value ?? 1);
          break;
        case 'score_above':
          earned = userContext.latestScore >= (criteria.value ?? 80);
          break;
        case 'debt_free':
          earned =
            userContext.activeDebts === 0 && userContext.totalDebts > 0;
          break;
        case 'budget_streak':
          // Simplified: award if expenses are under control
          earned =
            userContext.savingsRate > 0 &&
            userContext.totalExpenses > 0;
          break;
        case 'score_improvement':
          earned = userContext.scoreTrend >= (criteria.value ?? 10);
          break;
        default:
          break;
      }

      if (earned) {
        await this.prisma.userAchievement.create({
          data: { userId, achievementId: achievement.id },
        });
        newlyAwarded.push({
          achievementId: achievement.id,
          name: achievement.name,
        });
      }
    }

    return {
      checked: achievements.length,
      newlyAwarded,
      totalAchievements: existingIds.size + newlyAwarded.length,
    };
  }
}
