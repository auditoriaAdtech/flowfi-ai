import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ScoreBreakdown {
  savingsRate: number;
  debtToIncome: number;
  paymentConsistency: number;
  spendingDiscipline: number;
  budgetAdherence: number;
}

@Injectable()
export class ScoreService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateScore(userId: string) {
    const breakdown = await this.computeBreakdown(userId);
    const score = Math.round(
      breakdown.savingsRate * 0.25 +
        breakdown.debtToIncome * 0.25 +
        breakdown.paymentConsistency * 0.2 +
        breakdown.spendingDiscipline * 0.15 +
        breakdown.budgetAdherence * 0.15,
    );

    const clampedScore = Math.max(0, Math.min(100, score));

    const record = await this.prisma.financialScore.create({
      data: {
        userId,
        score: clampedScore,
        breakdown: breakdown as any,
      },
    });

    return {
      score: record.score,
      breakdown,
      calculatedAt: record.calculatedAt,
      id: record.id,
    };
  }

  async getCurrentScore(userId: string) {
    const latest = await this.prisma.financialScore.findFirst({
      where: { userId },
      orderBy: { calculatedAt: 'desc' },
    });

    if (!latest) {
      return this.calculateScore(userId);
    }

    return {
      score: latest.score,
      breakdown: latest.breakdown,
      calculatedAt: latest.calculatedAt,
      id: latest.id,
    };
  }

  async getScoreHistory(userId: string) {
    return this.prisma.financialScore.findMany({
      where: { userId },
      orderBy: { calculatedAt: 'desc' },
      take: 12,
      select: {
        id: true,
        score: true,
        breakdown: true,
        calculatedAt: true,
      },
    });
  }

  async getScoreBreakdown(userId: string) {
    const breakdown = await this.computeBreakdown(userId);
    return {
      breakdown,
      weights: {
        savingsRate: 0.25,
        debtToIncome: 0.25,
        paymentConsistency: 0.2,
        spendingDiscipline: 0.15,
        budgetAdherence: 0.15,
      },
      descriptions: {
        savingsRate:
          'Percentage of income saved each month. Higher is better.',
        debtToIncome:
          'Ratio of debt payments to income. Lower debt means a higher score.',
        paymentConsistency:
          'How consistently you make debt payments on time.',
        spendingDiscipline:
          'How well you control discretionary spending month over month.',
        budgetAdherence:
          'How closely your actual spending matches your budget limits.',
      },
    };
  }

  private async computeBreakdown(userId: string): Promise<ScoreBreakdown> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      currentIncomes,
      currentExpenses,
      prevExpenses,
      activeDebts,
      debtPayments,
      budgets,
    ] = await Promise.all([
      this.prisma.income.findMany({
        where: { userId, date: { gte: startOfMonth, lt: endOfMonth } },
      }),
      this.prisma.expense.findMany({
        where: { userId, date: { gte: startOfMonth, lt: endOfMonth } },
      }),
      this.prisma.expense.findMany({
        where: { userId, date: { gte: startOfPrevMonth, lt: startOfMonth } },
      }),
      this.prisma.debt.findMany({
        where: { userId, status: 'ACTIVE' },
        include: { payments: { orderBy: { date: 'desc' }, take: 3 } },
      }),
      this.prisma.debtPayment.findMany({
        where: {
          debt: { userId },
          date: { gte: startOfPrevMonth },
        },
      }),
      this.prisma.budget.findMany({
        where: { userId },
      }),
    ]);

    const monthlyIncome = currentIncomes.reduce((s, i) => s + i.amount, 0);
    const monthlyExpenses = currentExpenses.reduce((s, e) => s + e.amount, 0);
    const prevMonthExpenses = prevExpenses.reduce((s, e) => s + e.amount, 0);

    // 1. Savings rate score (0-100)
    let savingsRateScore = 0;
    if (monthlyIncome > 0) {
      const rate =
        ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100;
      if (rate >= 30) savingsRateScore = 100;
      else if (rate >= 20) savingsRateScore = 85;
      else if (rate >= 10) savingsRateScore = 65;
      else if (rate >= 5) savingsRateScore = 45;
      else if (rate > 0) savingsRateScore = 25;
      else savingsRateScore = 0;
    }

    // 2. Debt-to-income ratio score (0-100)
    let debtToIncomeScore = 100;
    if (monthlyIncome > 0 && activeDebts.length > 0) {
      const totalDebtPayments = activeDebts.reduce(
        (s, d) => s + d.minimumPayment,
        0,
      );
      const dti = (totalDebtPayments / monthlyIncome) * 100;
      if (dti <= 10) debtToIncomeScore = 100;
      else if (dti <= 20) debtToIncomeScore = 85;
      else if (dti <= 36) debtToIncomeScore = 65;
      else if (dti <= 50) debtToIncomeScore = 40;
      else debtToIncomeScore = 15;
    }

    // 3. Payment consistency score (0-100)
    let paymentConsistencyScore = 80; // default if no debts
    if (activeDebts.length > 0) {
      const debtsWithRecentPayments = activeDebts.filter(
        (d) => d.payments.length > 0,
      ).length;
      paymentConsistencyScore = Math.round(
        (debtsWithRecentPayments / activeDebts.length) * 100,
      );
    }

    // 4. Spending discipline score (0-100) - compare current vs previous month
    let spendingDisciplineScore = 70; // default
    if (prevMonthExpenses > 0 && monthlyExpenses > 0) {
      const changeRate =
        ((monthlyExpenses - prevMonthExpenses) / prevMonthExpenses) * 100;
      if (changeRate <= -10) spendingDisciplineScore = 100; // spending decreased
      else if (changeRate <= 0) spendingDisciplineScore = 85;
      else if (changeRate <= 10) spendingDisciplineScore = 65;
      else if (changeRate <= 25) spendingDisciplineScore = 40;
      else spendingDisciplineScore = 20;
    }

    // 5. Budget adherence score (0-100)
    let budgetAdherenceScore = 50; // default if no budgets set
    if (budgets.length > 0) {
      const categoryTotals = new Map<string, number>();
      for (const expense of currentExpenses) {
        const current = categoryTotals.get(expense.category) ?? 0;
        categoryTotals.set(expense.category, current + expense.amount);
      }

      let withinBudget = 0;
      for (const budget of budgets) {
        const spent = categoryTotals.get(budget.category) ?? 0;
        if (spent <= budget.amount) {
          withinBudget++;
        }
      }
      budgetAdherenceScore = Math.round(
        (withinBudget / budgets.length) * 100,
      );
    }

    return {
      savingsRate: savingsRateScore,
      debtToIncome: debtToIncomeScore,
      paymentConsistency: paymentConsistencyScore,
      spendingDiscipline: spendingDisciplineScore,
      budgetAdherence: budgetAdherenceScore,
    };
  }
}
