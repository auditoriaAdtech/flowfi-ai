import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecurringInterval } from '@prisma/client';

interface CreateExpenseDto {
  amount: number;
  currency?: string;
  category: string;
  subcategory?: string;
  description?: string;
  date: string;
  isSubscription?: boolean;
  recurring?: boolean;
  recurringInterval?: RecurringInterval;
}

interface UpdateExpenseDto {
  amount?: number;
  currency?: string;
  category?: string;
  subcategory?: string;
  description?: string;
  date?: string;
  isSubscription?: boolean;
  recurring?: boolean;
  recurringInterval?: RecurringInterval;
}

interface ExpenseFilters {
  month?: number;
  year?: number;
  category?: string;
}

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: {
        userId,
        amount: data.amount,
        currency: data.currency,
        category: data.category,
        subcategory: data.subcategory,
        description: data.description,
        date: new Date(data.date),
        isSubscription: data.isSubscription ?? false,
        recurring: data.recurring ?? false,
        recurringInterval: data.recurringInterval,
      },
    });
  }

  async findAll(userId: string, filters: ExpenseFilters = {}) {
    const where: any = { userId };

    if (filters.month && filters.year) {
      const startDate = new Date(filters.year, filters.month - 1, 1);
      const endDate = new Date(filters.year, filters.month, 1);
      where.date = { gte: startDate, lt: endDate };
    } else if (filters.year) {
      const startDate = new Date(filters.year, 0, 1);
      const endDate = new Date(filters.year + 1, 0, 1);
      where.date = { gte: startDate, lt: endDate };
    }

    if (filters.category) {
      where.category = filters.category;
    }

    return this.prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }
    if (expense.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return expense;
  }

  async update(userId: string, id: string, data: UpdateExpenseDto) {
    await this.findOne(userId, id);

    return this.prisma.expense.update({
      where: { id },
      data: {
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.subcategory !== undefined && { subcategory: data.subcategory }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.date !== undefined && { date: new Date(data.date) }),
        ...(data.isSubscription !== undefined && {
          isSubscription: data.isSubscription,
        }),
        ...(data.recurring !== undefined && { recurring: data.recurring }),
        ...(data.recurringInterval !== undefined && {
          recurringInterval: data.recurringInterval,
        }),
      },
    });
  }

  async delete(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.expense.delete({ where: { id } });
  }

  async getMonthlyTotal(userId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const result = await this.prisma.expense.aggregate({
      where: {
        userId,
        date: { gte: startDate, lt: endDate },
      },
      _sum: { amount: true },
    });

    return {
      total: result._sum.amount ?? 0,
      month,
      year,
    };
  }

  async getByCategory(userId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const expenses = await this.prisma.expense.groupBy({
      by: ['category'],
      where: {
        userId,
        date: { gte: startDate, lt: endDate },
      },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    return expenses.map((e) => ({
      category: e.category,
      total: e._sum.amount ?? 0,
      count: e._count.id,
    }));
  }

  async detectSubscriptions(userId: string) {
    return this.prisma.expense.findMany({
      where: {
        userId,
        OR: [{ isSubscription: true }, { recurring: true }],
      },
      orderBy: { amount: 'desc' },
    });
  }
}
