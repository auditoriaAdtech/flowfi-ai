import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface UpdateProfileDto {
  name?: string;
  locale?: string;
  currency?: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(userId: string, data: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.locale !== undefined && { locale: data.locale }),
        ...(data.currency !== undefined && { currency: data.currency }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        locale: true,
        currency: true,
        subscriptionTier: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        locale: true,
        currency: true,
        subscriptionTier: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [incomeCount, expenseCount, debtCount, activeDebts] =
      await Promise.all([
        this.prisma.income.count({ where: { userId } }),
        this.prisma.expense.count({ where: { userId } }),
        this.prisma.debt.count({ where: { userId } }),
        this.prisma.debt.count({ where: { userId, status: 'ACTIVE' } }),
      ]);

    return {
      ...user,
      stats: {
        totalIncomes: incomeCount,
        totalExpenses: expenseCount,
        totalDebts: debtCount,
        activeDebts,
      },
    };
  }
}
