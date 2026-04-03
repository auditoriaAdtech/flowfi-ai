import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CashFlowEntry {
  month: string;
  year: number;
  monthNum: number;
  income: number;
  expenses: number;
  net: number;
}

interface Alert {
  type: 'warning' | 'danger' | 'info';
  title: string;
  message: string;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardData(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Fetch current month data
    const [currentIncomes, currentExpenses, debts, budgets, savingsGoals] =
      await Promise.all([
        this.prisma.income.findMany({
          where: { userId, date: { gte: startOfMonth, lt: endOfMonth } },
        }),
        this.prisma.expense.findMany({
          where: { userId, date: { gte: startOfMonth, lt: endOfMonth } },
        }),
        this.prisma.debt.findMany({
          where: { userId, status: 'ACTIVE' },
        }),
        this.prisma.budget.findMany({ where: { userId } }),
        this.prisma.savingsGoal.findMany({
          where: { userId, status: 'ACTIVE' },
        }),
      ]);

    const totalIncome = currentIncomes.reduce((s, i) => s + i.amount, 0);
    const totalExpenses = currentExpenses.reduce((s, e) => s + e.amount, 0);
    const monthlyBalance = totalIncome - totalExpenses;

    // Cash flow for last 6 months
    const cashFlow = await this.getCashFlowHistory(userId, 6);

    // Expenses by category
    const expenseGroups = await this.prisma.expense.groupBy({
      by: ['category'],
      where: { userId, date: { gte: startOfMonth, lt: endOfMonth } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    const expensesByCategory = expenseGroups.map((g) => ({
      category: g.category,
      amount: g._sum.amount ?? 0,
      percentage:
        totalExpenses > 0
          ? Math.round(((g._sum.amount ?? 0) / totalExpenses) * 100)
          : 0,
    }));

    // Income vs expenses comparison (last 6 months)
    const incomeVsExpenses = cashFlow.map((cf) => ({
      month: cf.month,
      income: cf.income,
      expenses: cf.expenses,
    }));

    // Savings rate
    const savingsRate =
      totalIncome > 0
        ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100)
        : 0;

    // Projected savings (based on average over last 6 months)
    const avgMonthlySavings =
      cashFlow.length > 0
        ? cashFlow.reduce((s, cf) => s + cf.net, 0) / cashFlow.length
        : 0;
    const projectedSavings = {
      threeMonths: avgMonthlySavings * 3,
      sixMonths: avgMonthlySavings * 6,
      oneYear: avgMonthlySavings * 12,
    };

    // Alerts
    const alerts: Alert[] = [];

    if (monthlyBalance < 0) {
      alerts.push({
        type: 'danger',
        title: 'Negative balance',
        message: `You're spending $${Math.abs(monthlyBalance).toFixed(2)} more than you earn this month.`,
      });
    }

    // Check budgets
    for (const budget of budgets) {
      const spent =
        expensesByCategory.find((e) => e.category === budget.category)
          ?.amount ?? 0;
      if (spent > budget.amount) {
        alerts.push({
          type: 'warning',
          title: `Budget exceeded: ${budget.category}`,
          message: `You've spent $${spent.toFixed(2)} of your $${budget.amount.toFixed(2)} budget for ${budget.category}.`,
        });
      } else if (spent > budget.amount * 0.8) {
        alerts.push({
          type: 'info',
          title: `Budget alert: ${budget.category}`,
          message: `You've used ${Math.round((spent / budget.amount) * 100)}% of your ${budget.category} budget.`,
        });
      }
    }

    // Debt due soon
    for (const debt of debts) {
      if (debt.dueDate) {
        const daysUntilDue = Math.ceil(
          (debt.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (daysUntilDue <= 7 && daysUntilDue >= 0) {
          alerts.push({
            type: 'warning',
            title: `Payment due soon: ${debt.name}`,
            message: `Your $${debt.minimumPayment.toFixed(2)} payment for ${debt.name} is due in ${daysUntilDue} days.`,
          });
        }
      }
    }

    // Savings goal nearing deadline
    for (const goal of savingsGoals) {
      if (goal.deadline) {
        const daysLeft = Math.ceil(
          (goal.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        const remaining = goal.targetAmount - goal.currentAmount;
        if (daysLeft <= 30 && remaining > 0) {
          alerts.push({
            type: 'info',
            title: `Goal deadline approaching: ${goal.name}`,
            message: `You need $${remaining.toFixed(2)} more to reach your "${goal.name}" goal in ${daysLeft} days.`,
          });
        }
      }
    }

    return {
      monthlyBalance,
      totalIncome,
      totalExpenses,
      cashFlow,
      expensesByCategory,
      incomeVsExpenses,
      savingsRate,
      projectedSavings,
      alerts,
    };
  }

  async getMonthlyReport(userId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    const prevStart = new Date(year, month - 2, 1);

    const [incomes, expenses, prevExpenses, debts, debtPayments] =
      await Promise.all([
        this.prisma.income.findMany({
          where: { userId, date: { gte: startDate, lt: endDate } },
          orderBy: { date: 'desc' },
        }),
        this.prisma.expense.findMany({
          where: { userId, date: { gte: startDate, lt: endDate } },
          orderBy: { date: 'desc' },
        }),
        this.prisma.expense.findMany({
          where: { userId, date: { gte: prevStart, lt: startDate } },
        }),
        this.prisma.debt.findMany({
          where: { userId },
        }),
        this.prisma.debtPayment.findMany({
          where: {
            debt: { userId },
            date: { gte: startDate, lt: endDate },
          },
        }),
      ]);

    const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const prevTotalExpenses = prevExpenses.reduce((s, e) => s + e.amount, 0);
    const totalDebtPayments = debtPayments.reduce((s, p) => s + p.amount, 0);

    // Expense breakdown
    const categoryMap = new Map<string, number>();
    for (const expense of expenses) {
      const current = categoryMap.get(expense.category) ?? 0;
      categoryMap.set(expense.category, current + expense.amount);
    }
    const expenseBreakdown = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage:
          totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Income breakdown
    const incomeCategoryMap = new Map<string, number>();
    for (const income of incomes) {
      const current = incomeCategoryMap.get(income.category) ?? 0;
      incomeCategoryMap.set(income.category, current + income.amount);
    }
    const incomeBreakdown = Array.from(incomeCategoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    const expenseChange =
      prevTotalExpenses > 0
        ? Math.round(
            ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100,
          )
        : 0;

    return {
      month,
      year,
      summary: {
        totalIncome,
        totalExpenses,
        netSavings: totalIncome - totalExpenses,
        savingsRate:
          totalIncome > 0
            ? Math.round(
                ((totalIncome - totalExpenses) / totalIncome) * 100,
              )
            : 0,
        expenseChangeFromLastMonth: expenseChange,
        totalDebtPayments,
      },
      incomeBreakdown,
      expenseBreakdown,
      topExpenses: expenses.slice(0, 10).map((e) => ({
        description: e.description ?? e.category,
        amount: e.amount,
        category: e.category,
        date: e.date,
      })),
      debtSummary: {
        totalRemaining: debts.reduce((s, d) => s + d.remainingAmount, 0),
        activeCount: debts.filter((d) => d.status === 'ACTIVE').length,
        paidOffCount: debts.filter((d) => d.status === 'PAID_OFF').length,
        monthlyPayments: totalDebtPayments,
      },
    };
  }

  async getCashFlowProjection(userId: string, months: number) {
    const historicalCashFlow = await this.getCashFlowHistory(userId, 6);

    // Calculate averages from historical data
    const avgIncome =
      historicalCashFlow.length > 0
        ? historicalCashFlow.reduce((s, cf) => s + cf.income, 0) /
          historicalCashFlow.length
        : 0;
    const avgExpenses =
      historicalCashFlow.length > 0
        ? historicalCashFlow.reduce((s, cf) => s + cf.expenses, 0) /
          historicalCashFlow.length
        : 0;

    // Calculate trend (simple linear trend from last 6 months)
    let expenseTrend = 0;
    if (historicalCashFlow.length >= 2) {
      const first = historicalCashFlow[0]?.expenses ?? 0;
      const last =
        historicalCashFlow[historicalCashFlow.length - 1]?.expenses ?? 0;
      expenseTrend =
        (last - first) / (historicalCashFlow.length - 1);
    }

    const now = new Date();
    const projections: Array<{
      month: string;
      year: number;
      projectedIncome: number;
      projectedExpenses: number;
      projectedNet: number;
      cumulativeSavings: number;
    }> = [];

    let cumulativeSavings = 0;
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    for (let i = 1; i <= months; i++) {
      const futureDate = new Date(
        now.getFullYear(),
        now.getMonth() + i,
        1,
      );
      const projectedExpenses = Math.max(0, avgExpenses + expenseTrend * i);
      const projectedIncome = avgIncome;
      const projectedNet = projectedIncome - projectedExpenses;
      cumulativeSavings += projectedNet;

      projections.push({
        month: monthNames[futureDate.getMonth()],
        year: futureDate.getFullYear(),
        projectedIncome: Math.round(projectedIncome * 100) / 100,
        projectedExpenses: Math.round(projectedExpenses * 100) / 100,
        projectedNet: Math.round(projectedNet * 100) / 100,
        cumulativeSavings: Math.round(cumulativeSavings * 100) / 100,
      });
    }

    return {
      basedOnMonths: historicalCashFlow.length,
      averageMonthlyIncome: Math.round(avgIncome * 100) / 100,
      averageMonthlyExpenses: Math.round(avgExpenses * 100) / 100,
      monthlyExpenseTrend: Math.round(expenseTrend * 100) / 100,
      projections,
    };
  }

  private async getCashFlowHistory(
    userId: string,
    months: number,
  ): Promise<CashFlowEntry[]> {
    const now = new Date();
    const result: CashFlowEntry[] = [];
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const [incomeAgg, expenseAgg] = await Promise.all([
        this.prisma.income.aggregate({
          where: { userId, date: { gte: start, lt: end } },
          _sum: { amount: true },
        }),
        this.prisma.expense.aggregate({
          where: { userId, date: { gte: start, lt: end } },
          _sum: { amount: true },
        }),
      ]);

      const income = incomeAgg._sum.amount ?? 0;
      const expenses = expenseAgg._sum.amount ?? 0;

      result.push({
        month: monthNames[start.getMonth()],
        year: start.getFullYear(),
        monthNum: start.getMonth() + 1,
        income,
        expenses,
        net: income - expenses,
      });
    }

    return result;
  }
}
