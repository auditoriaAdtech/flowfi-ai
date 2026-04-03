import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ChatResponse {
  reply: string;
  suggestions?: string[];
  metadata?: Record<string, any>;
}

interface Insight {
  id: string;
  type: 'warning' | 'tip' | 'alert' | 'positive';
  title: string;
  message: string;
  category: string;
  impact?: number;
}

interface SavingsRecommendation {
  id: string;
  title: string;
  description: string;
  potentialSavings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  actionSteps: string[];
}

interface InvestmentRecommendation {
  type: string;
  name: string;
  allocation: number;
  expectedReturn: number;
  risk: string;
  description: string;
}

@Injectable()
export class AiService {
  constructor(private readonly prisma: PrismaService) {}

  async chat(userId: string, message: string): Promise<ChatResponse> {
    const financialData = await this.getUserFinancialSnapshot(userId);

    // Save user message
    await this.prisma.chatMessage.create({
      data: { userId, role: 'user', content: message },
    });

    const lowerMessage = message.toLowerCase();
    let reply: string;
    let suggestions: string[] = [];

    if (
      lowerMessage.includes('can i afford') ||
      lowerMessage.includes('puedo pagar')
    ) {
      const monthlySurplus =
        financialData.monthlyIncome - financialData.monthlyExpenses;
      reply =
        monthlySurplus > 0
          ? `Based on your finances, you have a monthly surplus of $${monthlySurplus.toFixed(2)}. ` +
            `Your monthly income is $${financialData.monthlyIncome.toFixed(2)} and expenses are $${financialData.monthlyExpenses.toFixed(2)}. ` +
            `If the purchase fits within your surplus and you still maintain your emergency fund, it could be feasible. ` +
            `However, I'd recommend keeping at least 20% of your surplus for savings.`
          : `You're currently spending more than you earn by $${Math.abs(monthlySurplus).toFixed(2)} per month. ` +
            `I'd recommend focusing on reducing expenses or increasing income before making additional purchases.`;
      suggestions = [
        'How can I reduce my expenses?',
        'What is my savings rate?',
        'Show me my spending breakdown',
      ];
    } else if (
      lowerMessage.includes('debt') ||
      lowerMessage.includes('deuda')
    ) {
      const totalDebt = financialData.totalDebt;
      const debtToIncome =
        financialData.monthlyIncome > 0
          ? (totalDebt / (financialData.monthlyIncome * 12)) * 100
          : 0;
      reply =
        totalDebt > 0
          ? `Your total outstanding debt is $${totalDebt.toFixed(2)} across ${financialData.debtCount} accounts. ` +
            `Your debt-to-annual-income ratio is ${debtToIncome.toFixed(1)}%. ` +
            (debtToIncome > 40
              ? `This is quite high. I recommend the ${financialData.debtCount > 1 ? 'avalanche method (pay highest interest first)' : 'focused repayment approach'} to tackle this aggressively.`
              : `This is manageable. Keep making consistent payments and consider putting any extra income toward your highest-interest debt.`)
          : `Great news! You currently have no outstanding debts. Focus on building your emergency fund and investing for the future.`;
      suggestions = [
        'What debt payoff strategy should I use?',
        'How long until I am debt free?',
        'Show me my debt breakdown',
      ];
    } else if (
      lowerMessage.includes('save') ||
      lowerMessage.includes('saving') ||
      lowerMessage.includes('ahorr')
    ) {
      const savingsRate =
        financialData.monthlyIncome > 0
          ? ((financialData.monthlyIncome - financialData.monthlyExpenses) /
              financialData.monthlyIncome) *
            100
          : 0;
      reply =
        savingsRate > 0
          ? `Your current savings rate is ${savingsRate.toFixed(1)}%. ` +
            (savingsRate >= 20
              ? `Excellent! You're above the recommended 20% savings rate. Consider investing the excess.`
              : savingsRate >= 10
                ? `You're on a good path. Try to gradually increase this to 20% by cutting discretionary spending.`
                : `This is below the recommended 10% minimum. Let me suggest some areas where you can cut back.`) +
            ` Based on your spending patterns, you could potentially save an additional $${(financialData.monthlyExpenses * 0.1).toFixed(2)}/month by optimizing your top expense categories.`
          : `You're currently not saving any money. Your expenses ($${financialData.monthlyExpenses.toFixed(2)}) match or exceed your income ($${financialData.monthlyIncome.toFixed(2)}). Let's work on a plan to change this.`;
      suggestions = [
        'Give me specific savings tips',
        'How much emergency fund do I need?',
        'Where is my money going?',
      ];
    } else if (
      lowerMessage.includes('where') &&
      lowerMessage.includes('money')
    ) {
      const topCategories = financialData.expensesByCategory
        .slice(0, 5)
        .map(
          (c) =>
            `${c.category}: $${c.total.toFixed(2)} (${((c.total / financialData.monthlyExpenses) * 100).toFixed(1)}%)`,
        )
        .join('\n');
      reply =
        `Here's where your money is going this month:\n\n${topCategories}\n\n` +
        `Total monthly expenses: $${financialData.monthlyExpenses.toFixed(2)}. ` +
        `Your biggest spending area is ${financialData.expensesByCategory[0]?.category ?? 'N/A'}.`;
      suggestions = [
        'How can I reduce spending on ' +
          (financialData.expensesByCategory[0]?.category ?? 'food') +
          '?',
        'Set a budget for me',
        'What subscriptions am I paying for?',
      ];
    } else {
      reply =
        `Here's a summary of your finances:\n\n` +
        `Monthly Income: $${financialData.monthlyIncome.toFixed(2)}\n` +
        `Monthly Expenses: $${financialData.monthlyExpenses.toFixed(2)}\n` +
        `Total Debt: $${financialData.totalDebt.toFixed(2)}\n` +
        `Active Savings Goals: ${financialData.savingsGoalsCount}\n\n` +
        `How can I help you manage your money better?`;
      suggestions = [
        'Can I afford a big purchase?',
        'How do I get out of debt?',
        'How much should I save?',
        'Where is my money going?',
      ];
    }

    // Save assistant reply
    await this.prisma.chatMessage.create({
      data: {
        userId,
        role: 'assistant',
        content: reply,
        metadata: { suggestions },
      },
    });

    return { reply, suggestions };
  }

  async getInsights(userId: string): Promise<Insight[]> {
    const data = await this.getUserFinancialSnapshot(userId);
    const insights: Insight[] = [];

    // Spending trend analysis
    if (data.expensesByCategory.length > 0) {
      const topCategory = data.expensesByCategory[0];
      const percentage =
        data.monthlyExpenses > 0
          ? (topCategory.total / data.monthlyExpenses) * 100
          : 0;
      if (percentage > 30) {
        insights.push({
          id: 'high-category-spend',
          type: 'warning',
          title: 'High category spending',
          message: `You're spending ${percentage.toFixed(0)}% of your budget on ${topCategory.category}. Consider setting a budget limit for this category.`,
          category: topCategory.category,
          impact: topCategory.total * 0.2,
        });
      }
    }

    // Subscription detection
    const subscriptions = await this.prisma.expense.findMany({
      where: { userId, isSubscription: true },
    });
    if (subscriptions.length > 0) {
      const totalSubs = subscriptions.reduce((s, e) => s + e.amount, 0);
      insights.push({
        id: 'subscription-total',
        type: 'alert',
        title: 'Subscription summary',
        message: `You have ${subscriptions.length} active subscriptions totaling $${totalSubs.toFixed(2)}/month. Review them to find ones you no longer use.`,
        category: 'subscriptions',
        impact: totalSubs * 0.3,
      });
    }

    // Savings rate insight
    const savingsRate =
      data.monthlyIncome > 0
        ? ((data.monthlyIncome - data.monthlyExpenses) / data.monthlyIncome) *
          100
        : 0;
    if (savingsRate < 10 && data.monthlyIncome > 0) {
      insights.push({
        id: 'low-savings-rate',
        type: 'warning',
        title: 'Low savings rate',
        message: `Your savings rate is only ${savingsRate.toFixed(1)}%. Aim for at least 20% to build long-term wealth.`,
        category: 'savings',
        impact: data.monthlyIncome * 0.1,
      });
    } else if (savingsRate >= 20) {
      insights.push({
        id: 'good-savings-rate',
        type: 'positive',
        title: 'Great savings rate!',
        message: `You're saving ${savingsRate.toFixed(1)}% of your income. Keep it up!`,
        category: 'savings',
      });
    }

    // Debt ratio insight
    if (data.totalDebt > 0 && data.monthlyIncome > 0) {
      const dti = (data.monthlyDebtPayments / data.monthlyIncome) * 100;
      if (dti > 36) {
        insights.push({
          id: 'high-dti',
          type: 'warning',
          title: 'High debt-to-income ratio',
          message: `Your debt payments consume ${dti.toFixed(1)}% of your monthly income. Try to get this below 36%.`,
          category: 'debt',
          impact: data.monthlyDebtPayments,
        });
      }
    }

    // Dining out spending tip
    const diningExpenses = data.expensesByCategory.find(
      (c) =>
        c.category.toLowerCase().includes('food') ||
        c.category.toLowerCase().includes('dining') ||
        c.category.toLowerCase().includes('restaurant'),
    );
    if (diningExpenses && diningExpenses.total > data.monthlyIncome * 0.15) {
      insights.push({
        id: 'dining-savings',
        type: 'tip',
        title: 'Reduce dining expenses',
        message: `You could save $${(diningExpenses.total * 0.3).toFixed(2)}/month by reducing dining out. Try meal prepping on weekends.`,
        category: 'food',
        impact: diningExpenses.total * 0.3,
      });
    }

    // No income insight
    if (data.monthlyIncome === 0) {
      insights.push({
        id: 'no-income',
        type: 'alert',
        title: 'No income recorded',
        message:
          'You have no income recorded for this month. Make sure to log your income sources to get accurate financial insights.',
        category: 'income',
      });
    }

    return insights;
  }

  async getSavingsRecommendations(
    userId: string,
  ): Promise<SavingsRecommendation[]> {
    const data = await this.getUserFinancialSnapshot(userId);
    const recommendations: SavingsRecommendation[] = [];

    // Based on expense categories, generate specific recommendations
    const categoryMap = new Map(
      data.expensesByCategory.map((c) => [c.category.toLowerCase(), c.total]),
    );

    if (categoryMap.has('food') || categoryMap.has('groceries')) {
      const foodSpend = (categoryMap.get('food') ?? 0) + (categoryMap.get('groceries') ?? 0);
      recommendations.push({
        id: 'meal-planning',
        title: 'Start meal planning',
        description:
          'Plan your weekly meals and shop with a list to reduce food waste and impulse purchases.',
        potentialSavings: foodSpend * 0.25,
        difficulty: 'easy',
        category: 'food',
        actionSteps: [
          'Plan meals for the week every Sunday',
          'Create a shopping list before going to the store',
          'Buy in bulk for staple items',
          'Cook at home at least 5 days a week',
        ],
      });
    }

    if (categoryMap.has('entertainment') || categoryMap.has('subscriptions')) {
      const entSpend =
        (categoryMap.get('entertainment') ?? 0) +
        (categoryMap.get('subscriptions') ?? 0);
      recommendations.push({
        id: 'subscription-audit',
        title: 'Audit your subscriptions',
        description:
          'Review all your recurring subscriptions and cancel ones you rarely use.',
        potentialSavings: entSpend * 0.4,
        difficulty: 'easy',
        category: 'subscriptions',
        actionSteps: [
          'List all active subscriptions',
          'Check usage for each in the last 30 days',
          'Cancel any subscription unused for 2+ weeks',
          'Consider sharing family plans',
        ],
      });
    }

    if (categoryMap.has('transport') || categoryMap.has('transportation')) {
      const transportSpend =
        (categoryMap.get('transport') ?? 0) +
        (categoryMap.get('transportation') ?? 0);
      recommendations.push({
        id: 'transport-optimization',
        title: 'Optimize transportation costs',
        description:
          'Consider carpooling, public transit, or biking for shorter trips.',
        potentialSavings: transportSpend * 0.3,
        difficulty: 'medium',
        category: 'transportation',
        actionSteps: [
          'Use public transit for daily commute',
          'Carpool with coworkers when possible',
          'Combine errands into fewer trips',
          'Compare gas prices using apps',
        ],
      });
    }

    // Generic recommendations based on financial health
    if (data.monthlyExpenses > data.monthlyIncome * 0.8) {
      recommendations.push({
        id: 'fifty-thirty-twenty',
        title: 'Follow the 50/30/20 rule',
        description:
          'Allocate 50% of income to needs, 30% to wants, and 20% to savings and debt repayment.',
        potentialSavings: data.monthlyIncome * 0.2,
        difficulty: 'medium',
        category: 'budgeting',
        actionSteps: [
          `Cap essential expenses at $${(data.monthlyIncome * 0.5).toFixed(2)}/month`,
          `Limit discretionary spending to $${(data.monthlyIncome * 0.3).toFixed(2)}/month`,
          `Save at least $${(data.monthlyIncome * 0.2).toFixed(2)}/month`,
          'Review and adjust monthly',
        ],
      });
    }

    // Emergency fund recommendation
    if (data.savingsGoalsCount === 0) {
      recommendations.push({
        id: 'emergency-fund',
        title: 'Build an emergency fund',
        description:
          'Start saving 3-6 months of expenses in an easily accessible account.',
        potentialSavings: 0,
        difficulty: 'hard',
        category: 'savings',
        actionSteps: [
          `Target amount: $${(data.monthlyExpenses * 3).toFixed(2)} to $${(data.monthlyExpenses * 6).toFixed(2)}`,
          'Set up automatic transfers to a savings account',
          'Start with $50/week and increase gradually',
          'Keep funds in a high-yield savings account',
        ],
      });
    }

    return recommendations;
  }

  async getInvestmentAdvice(
    userId: string,
    riskProfile: string,
  ): Promise<{ recommendations: InvestmentRecommendation[]; summary: string }> {
    const data = await this.getUserFinancialSnapshot(userId);
    const monthlySurplus = data.monthlyIncome - data.monthlyExpenses;
    const investableAmount = Math.max(monthlySurplus * 0.5, 0);

    let recommendations: InvestmentRecommendation[];

    switch (riskProfile) {
      case 'conservative':
        recommendations = [
          {
            type: 'bonds',
            name: 'Government Bond Fund',
            allocation: 50,
            expectedReturn: 4.5,
            risk: 'low',
            description:
              'Stable returns through government and investment-grade corporate bonds.',
          },
          {
            type: 'savings',
            name: 'High-Yield Savings Account',
            allocation: 30,
            expectedReturn: 5.0,
            risk: 'very_low',
            description:
              'FDIC-insured account with competitive interest rates.',
          },
          {
            type: 'stocks',
            name: 'Dividend Stock ETF',
            allocation: 15,
            expectedReturn: 7.0,
            risk: 'medium',
            description:
              'Established companies with consistent dividend payments.',
          },
          {
            type: 'real_estate',
            name: 'REIT Fund',
            allocation: 5,
            expectedReturn: 6.0,
            risk: 'medium',
            description: 'Real estate investment trust for portfolio diversification.',
          },
        ];
        break;

      case 'aggressive':
        recommendations = [
          {
            type: 'stocks',
            name: 'Growth Stock ETF (S&P 500)',
            allocation: 50,
            expectedReturn: 10.0,
            risk: 'high',
            description:
              'Broad market exposure through index funds tracking top US companies.',
          },
          {
            type: 'stocks',
            name: 'International Equity Fund',
            allocation: 20,
            expectedReturn: 9.0,
            risk: 'high',
            description: 'Diversified international stock exposure for global growth.',
          },
          {
            type: 'crypto',
            name: 'Bitcoin & Ethereum Allocation',
            allocation: 15,
            expectedReturn: 15.0,
            risk: 'very_high',
            description:
              'Small allocation to major cryptocurrencies for potential high growth.',
          },
          {
            type: 'stocks',
            name: 'Tech Sector ETF',
            allocation: 15,
            expectedReturn: 12.0,
            risk: 'high',
            description: 'Focused exposure to technology sector companies.',
          },
        ];
        break;

      default: // moderate
        recommendations = [
          {
            type: 'stocks',
            name: 'Total Market Index Fund',
            allocation: 40,
            expectedReturn: 8.5,
            risk: 'medium',
            description: 'Broad stock market exposure through a diversified index fund.',
          },
          {
            type: 'bonds',
            name: 'Corporate Bond Fund',
            allocation: 25,
            expectedReturn: 5.5,
            risk: 'low',
            description:
              'Investment-grade corporate bonds for stable income.',
          },
          {
            type: 'stocks',
            name: 'International Index Fund',
            allocation: 20,
            expectedReturn: 7.5,
            risk: 'medium',
            description:
              'Global diversification through international equities.',
          },
          {
            type: 'real_estate',
            name: 'REIT Index Fund',
            allocation: 10,
            expectedReturn: 6.5,
            risk: 'medium',
            description:
              'Real estate exposure for income and diversification.',
          },
          {
            type: 'crypto',
            name: 'Blue-Chip Crypto (BTC/ETH)',
            allocation: 5,
            expectedReturn: 12.0,
            risk: 'very_high',
            description:
              'Minimal crypto allocation for potential upside.',
          },
        ];
    }

    const weightedReturn = recommendations.reduce(
      (sum, r) => sum + (r.allocation / 100) * r.expectedReturn,
      0,
    );

    const summary =
      `Based on your ${riskProfile} risk profile and a suggested monthly investment of $${investableAmount.toFixed(2)}, ` +
      `this portfolio has an expected annual return of ${weightedReturn.toFixed(1)}%. ` +
      `In 5 years, investing $${investableAmount.toFixed(2)}/month could grow to approximately ` +
      `$${(investableAmount * 60 * (1 + weightedReturn / 200)).toFixed(2)}.` +
      (data.totalDebt > 0
        ? ` Note: Consider paying off high-interest debt before investing.`
        : '');

    return { recommendations, summary };
  }

  private async getUserFinancialSnapshot(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [incomes, expenses, debts, savingsGoals, expenseGroups] =
      await Promise.all([
        this.prisma.income.findMany({
          where: {
            userId,
            date: { gte: startOfMonth, lt: endOfMonth },
          },
        }),
        this.prisma.expense.findMany({
          where: {
            userId,
            date: { gte: startOfMonth, lt: endOfMonth },
          },
        }),
        this.prisma.debt.findMany({
          where: { userId, status: 'ACTIVE' },
        }),
        this.prisma.savingsGoal.findMany({
          where: { userId, status: 'ACTIVE' },
        }),
        this.prisma.expense.groupBy({
          by: ['category'],
          where: {
            userId,
            date: { gte: startOfMonth, lt: endOfMonth },
          },
          _sum: { amount: true },
          orderBy: { _sum: { amount: 'desc' } },
        }),
      ]);

    const monthlyIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const monthlyExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalDebt = debts.reduce((sum, d) => sum + d.remainingAmount, 0);
    const monthlyDebtPayments = debts.reduce(
      (sum, d) => sum + d.minimumPayment,
      0,
    );

    const expensesByCategory = expenseGroups.map((g) => ({
      category: g.category,
      total: g._sum.amount ?? 0,
    }));

    return {
      monthlyIncome,
      monthlyExpenses,
      totalDebt,
      monthlyDebtPayments,
      debtCount: debts.length,
      savingsGoalsCount: savingsGoals.length,
      expensesByCategory,
    };
  }
}
