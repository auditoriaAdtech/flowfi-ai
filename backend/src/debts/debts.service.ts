import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DebtStatus, DebtStrategy } from '@prisma/client';

interface CreateDebtDto {
  name: string;
  totalAmount: number;
  remainingAmount: number;
  interestRate: number;
  minimumPayment: number;
  dueDate?: string;
  strategy?: DebtStrategy;
}

interface UpdateDebtDto {
  name?: string;
  totalAmount?: number;
  remainingAmount?: number;
  interestRate?: number;
  minimumPayment?: number;
  dueDate?: string;
  strategy?: DebtStrategy;
  status?: DebtStatus;
}

interface AddPaymentDto {
  amount: number;
  date: string;
  note?: string;
}

interface PaymentPlanEntry {
  month: number;
  date: string;
  paymentAmount: number;
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
}

@Injectable()
export class DebtsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: CreateDebtDto) {
    return this.prisma.debt.create({
      data: {
        userId,
        name: data.name,
        totalAmount: data.totalAmount,
        remainingAmount: data.remainingAmount,
        interestRate: data.interestRate,
        minimumPayment: data.minimumPayment,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        strategy: data.strategy ?? 'SNOWBALL',
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.debt.findMany({
      where: { userId },
      include: { payments: { orderBy: { date: 'desc' }, take: 5 } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const debt = await this.prisma.debt.findUnique({
      where: { id },
      include: { payments: { orderBy: { date: 'desc' } } },
    });
    if (!debt) {
      throw new NotFoundException('Debt not found');
    }
    if (debt.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return debt;
  }

  async update(userId: string, id: string, data: UpdateDebtDto) {
    await this.findOne(userId, id);

    return this.prisma.debt.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.totalAmount !== undefined && {
          totalAmount: data.totalAmount,
        }),
        ...(data.remainingAmount !== undefined && {
          remainingAmount: data.remainingAmount,
        }),
        ...(data.interestRate !== undefined && {
          interestRate: data.interestRate,
        }),
        ...(data.minimumPayment !== undefined && {
          minimumPayment: data.minimumPayment,
        }),
        ...(data.dueDate !== undefined && { dueDate: new Date(data.dueDate) }),
        ...(data.strategy !== undefined && { strategy: data.strategy }),
        ...(data.status !== undefined && { status: data.status }),
      },
      include: { payments: { orderBy: { date: 'desc' } } },
    });
  }

  async delete(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.debt.delete({ where: { id } });
  }

  async addPayment(userId: string, debtId: string, data: AddPaymentDto) {
    const debt = await this.findOne(userId, debtId);

    const newRemaining = Math.max(0, debt.remainingAmount - data.amount);
    const newStatus: DebtStatus =
      newRemaining === 0 ? 'PAID_OFF' : debt.status;

    const [payment] = await this.prisma.$transaction([
      this.prisma.debtPayment.create({
        data: {
          debtId,
          amount: data.amount,
          date: new Date(data.date),
          note: data.note,
        },
      }),
      this.prisma.debt.update({
        where: { id: debtId },
        data: {
          remainingAmount: newRemaining,
          status: newStatus,
        },
      }),
    ]);

    return payment;
  }

  async getPaymentPlan(
    userId: string,
    debtId: string,
    strategy: DebtStrategy,
  ): Promise<PaymentPlanEntry[]> {
    const debt = await this.findOne(userId, debtId);
    const plan: PaymentPlanEntry[] = [];

    let balance = debt.remainingAmount;
    const monthlyRate = debt.interestRate / 100 / 12;
    const monthlyPayment = Math.max(
      debt.minimumPayment,
      balance * 0.02 + balance * monthlyRate,
    );
    const now = new Date();
    let month = 0;

    while (balance > 0.01 && month < 360) {
      month++;
      const interestCharge = balance * monthlyRate;
      const payment = Math.min(monthlyPayment, balance + interestCharge);
      const principalPaid = payment - interestCharge;
      balance = Math.max(0, balance - principalPaid);

      const paymentDate = new Date(
        now.getFullYear(),
        now.getMonth() + month,
        1,
      );

      plan.push({
        month,
        date: paymentDate.toISOString().split('T')[0],
        paymentAmount: Math.round(payment * 100) / 100,
        principalPaid: Math.round(principalPaid * 100) / 100,
        interestPaid: Math.round(interestCharge * 100) / 100,
        remainingBalance: Math.round(balance * 100) / 100,
      });
    }

    return plan;
  }

  async getAllDebtsWithPayments(userId: string) {
    return this.prisma.debt.findMany({
      where: { userId },
      include: {
        payments: { orderBy: { date: 'desc' } },
      },
      orderBy: [{ status: 'asc' }, { remainingAmount: 'asc' }],
    });
  }
}
