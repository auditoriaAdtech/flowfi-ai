import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IncomeType, RecurringInterval } from '@prisma/client';

interface CreateIncomeDto {
  amount: number;
  currency?: string;
  type: IncomeType;
  category: string;
  description?: string;
  date: string;
  recurring?: boolean;
  recurringInterval?: RecurringInterval;
}

interface UpdateIncomeDto {
  amount?: number;
  currency?: string;
  type?: IncomeType;
  category?: string;
  description?: string;
  date?: string;
  recurring?: boolean;
  recurringInterval?: RecurringInterval;
}

interface IncomeFilters {
  month?: number;
  year?: number;
  type?: IncomeType;
}

@Injectable()
export class IncomeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: CreateIncomeDto) {
    return this.prisma.income.create({
      data: {
        userId,
        amount: data.amount,
        currency: data.currency,
        type: data.type,
        category: data.category,
        description: data.description,
        date: new Date(data.date),
        recurring: data.recurring ?? false,
        recurringInterval: data.recurringInterval,
      },
    });
  }

  async findAll(userId: string, filters: IncomeFilters = {}) {
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

    if (filters.type) {
      where.type = filters.type;
    }

    return this.prisma.income.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const income = await this.prisma.income.findUnique({ where: { id } });
    if (!income) {
      throw new NotFoundException('Income not found');
    }
    if (income.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return income;
  }

  async update(userId: string, id: string, data: UpdateIncomeDto) {
    await this.findOne(userId, id);

    return this.prisma.income.update({
      where: { id },
      data: {
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.date !== undefined && { date: new Date(data.date) }),
        ...(data.recurring !== undefined && { recurring: data.recurring }),
        ...(data.recurringInterval !== undefined && {
          recurringInterval: data.recurringInterval,
        }),
      },
    });
  }

  async delete(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.income.delete({ where: { id } });
  }

  async getMonthlyTotal(userId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const result = await this.prisma.income.aggregate({
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
}
