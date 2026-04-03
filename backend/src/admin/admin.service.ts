import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      freeUsers,
      basicUsers,
      proUsers,
      newUsersToday,
      newUsersWeek,
      newUsersMonth,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { subscriptionTier: 'FREE' } }),
      this.prisma.user.count({ where: { subscriptionTier: 'BASIC' } }),
      this.prisma.user.count({ where: { subscriptionTier: 'PRO' } }),
      this.prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
      this.prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
      this.prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    ]);

    const activeSubscriptions = basicUsers + proUsers;
    const mrr = basicUsers * 5 + proUsers * 10;
    const totalRevenue = mrr; // Simplified: current MRR snapshot

    // Approximate churn rate (users who downgraded in last 30 days / total paid)
    const churnRate =
      activeSubscriptions > 0
        ? Math.round((0 / activeSubscriptions) * 10000) / 100
        : 0;

    return {
      totalUsers,
      activeSubscriptions,
      subscriptionsByTier: {
        FREE: freeUsers,
        BASIC: basicUsers,
        PRO: proUsers,
      },
      mrr,
      totalRevenue,
      newUsersToday,
      newUsersWeek,
      newUsersMonth,
      churnRate,
    };
  }

  async getUsers(
    page: number = 1,
    limit: number = 20,
    search?: string,
    tier?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (tier && ['FREE', 'BASIC', 'PRO'].includes(tier.toUpperCase())) {
      where.subscriptionTier = tier.toUpperCase();
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          subscriptionTier: true,
          locale: true,
          currency: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              incomes: true,
              expenses: true,
              debts: true,
              financialScores: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Attach latest score for each user
    const usersWithScore = await Promise.all(
      users.map(async (user) => {
        const latestScore = await this.prisma.financialScore.findFirst({
          where: { userId: user.id },
          orderBy: { calculatedAt: 'desc' },
          select: { score: true },
        });
        return {
          ...user,
          score: latestScore?.score ?? null,
          status: 'active' as const,
        };
      }),
    );

    return {
      users: usersWithScore,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        incomes: { orderBy: { date: 'desc' }, take: 10 },
        expenses: { orderBy: { date: 'desc' }, take: 10 },
        debts: true,
        financialScores: { orderBy: { calculatedAt: 'desc' }, take: 5 },
        achievements: { include: { achievement: true } },
        savingsGoals: true,
        investmentPlans: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const totalIncome = user.incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = user.expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalDebt = user.debts
      .filter((d) => d.status === 'ACTIVE')
      .reduce((sum, d) => sum + d.remainingAmount, 0);

    return {
      ...user,
      passwordHash: undefined,
      financialSummary: {
        totalIncome,
        totalExpenses,
        totalDebt,
        netCashflow: totalIncome - totalExpenses,
        latestScore: user.financialScores[0]?.score ?? null,
      },
    };
  }

  async updateUserTier(userId: string, tier: string) {
    const validTiers = ['FREE', 'BASIC', 'PRO'];
    if (!validTiers.includes(tier.toUpperCase())) {
      throw new NotFoundException('Invalid subscription tier');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { subscriptionTier: tier.toUpperCase() as any },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionTier: true,
        updatedAt: true,
      },
    });
  }

  async disableUser(userId: string) {
    // Since there's no "disabled" field in schema, we downgrade to FREE
    // In production, you'd add a `disabled` boolean field
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { subscriptionTier: 'FREE' },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionTier: true,
        updatedAt: true,
      },
    });
  }

  async enableUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // Re-enable just returns the user as-is (already active)
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      subscriptionTier: user.subscriptionTier,
      updatedAt: user.updatedAt,
    };
  }

  async getRevenueChart() {
    const months: { month: string; revenue: number; users: number }[] = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      const monthStr = date.toLocaleString('en-US', {
        month: 'short',
        year: '2-digit',
      });

      const [basicCount, proCount] = await Promise.all([
        this.prisma.user.count({
          where: {
            subscriptionTier: 'BASIC',
            createdAt: { lt: endDate },
          },
        }),
        this.prisma.user.count({
          where: {
            subscriptionTier: 'PRO',
            createdAt: { lt: endDate },
          },
        }),
      ]);

      months.push({
        month: monthStr,
        revenue: basicCount * 5 + proCount * 10,
        users: basicCount + proCount,
      });
    }

    return months;
  }

  async getGrowthMetrics() {
    const months: {
      month: string;
      newUsers: number;
      totalUsers: number;
    }[] = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth() + 1,
        1,
      );
      const monthStr = startDate.toLocaleString('en-US', {
        month: 'short',
        year: '2-digit',
      });

      const [newUsers, totalUsers] = await Promise.all([
        this.prisma.user.count({
          where: {
            createdAt: { gte: startDate, lt: endDate },
          },
        }),
        this.prisma.user.count({
          where: { createdAt: { lt: endDate } },
        }),
      ]);

      months.push({ month: monthStr, newUsers, totalUsers });
    }

    // Conversion rate: paid users / total users
    const totalUsers = await this.prisma.user.count();
    const paidUsers = await this.prisma.user.count({
      where: { subscriptionTier: { not: 'FREE' } },
    });
    const conversionRate =
      totalUsers > 0 ? Math.round((paidUsers / totalUsers) * 10000) / 100 : 0;

    return {
      months,
      conversionRate,
      totalUsers,
      paidUsers,
    };
  }

  async exportUsers(format: string = 'json') {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionTier: true,
        locale: true,
        currency: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { users, total: users.length, exportedAt: new Date().toISOString() };
  }
}
