import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create demo user
  const passwordHash = await bcrypt.hash('demo123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'demo@flowfi.ai' },
    update: {},
    create: {
      email: 'demo@flowfi.ai',
      name: 'Demo User',
      passwordHash,
      locale: 'es',
      currency: 'USD',
    },
  });

  // Seed achievements
  const achievements = [
    { name: 'First Step', nameEs: 'Primer Paso', description: 'Register your first income', descriptionEs: 'Registra tu primer ingreso', icon: 'rocket', criteria: { type: 'income_count', value: 1 } },
    { name: 'Budget Master', nameEs: 'Maestro del Presupuesto', description: 'Create budgets for 5 categories', descriptionEs: 'Crea presupuestos para 5 categorias', icon: 'target', criteria: { type: 'budget_count', value: 5 } },
    { name: 'Debt Free 30', nameEs: 'Sin Deudas 30', description: '30 days without new debt', descriptionEs: '30 dias sin nueva deuda', icon: 'trophy', criteria: { type: 'debt_free_days', value: 30 } },
    { name: 'Saver Elite', nameEs: 'Ahorrador Elite', description: 'Save 20% of income for 3 months', descriptionEs: 'Ahorra 20% de ingresos por 3 meses', icon: 'star', criteria: { type: 'savings_rate', value: 20 } },
    { name: 'Score 80+', nameEs: 'Score 80+', description: 'Reach a financial score of 80', descriptionEs: 'Alcanza un score financiero de 80', icon: 'medal', criteria: { type: 'score_above', value: 80 } },
    { name: 'Document Pro', nameEs: 'Pro Documentos', description: 'Upload 10 documents', descriptionEs: 'Sube 10 documentos', icon: 'file', criteria: { type: 'document_count', value: 10 } },
    { name: 'Goal Crusher', nameEs: 'Destructor de Metas', description: 'Complete a savings goal', descriptionEs: 'Completa una meta de ahorro', icon: 'flag', criteria: { type: 'goal_completed', value: 1 } },
    { name: 'Investor', nameEs: 'Inversionista', description: 'Create your first investment plan', descriptionEs: 'Crea tu primer plan de inversion', icon: 'trending-up', criteria: { type: 'investment_plan', value: 1 } },
  ];

  for (const a of achievements) {
    await prisma.achievement.upsert({
      where: { name: a.name },
      update: a,
      create: a,
    });
  }

  // Seed marketplace offers
  const offers = [
    { provider: 'FlowFi Credit', type: 'loan', name: 'Personal Loan', nameEs: 'Prestamo Personal', description: 'Up to $5,000 at competitive rates', descriptionEs: 'Hasta $5,000 a tasas competitivas', minScore: 60, interestRate: 12.5, url: '#', country: 'ALL' },
    { provider: 'FlowFi Credit', type: 'credit_card', name: 'FlowFi Card', nameEs: 'Tarjeta FlowFi', description: 'No annual fee, 2% cashback', descriptionEs: 'Sin anualidad, 2% cashback', minScore: 70, interestRate: 18.0, url: '#', country: 'ALL' },
    { provider: 'SafeGuard', type: 'insurance', name: 'Life Insurance Basic', nameEs: 'Seguro de Vida Basico', description: 'Coverage from $50k', descriptionEs: 'Cobertura desde $50k', minScore: 40, url: '#', country: 'ALL' },
    { provider: 'InvestMX', type: 'investment', name: 'Growth Fund', nameEs: 'Fondo de Crecimiento', description: 'Diversified equity fund, 8-12% annual', descriptionEs: 'Fondo diversificado de renta variable, 8-12% anual', minScore: 50, interestRate: 10.0, url: '#', country: 'MX' },
    { provider: 'BNPL Finance', type: 'loan', name: 'Buy Now Pay Later', nameEs: 'Compra Ahora Paga Despues', description: 'Split purchases into 4 payments', descriptionEs: 'Divide tus compras en 4 pagos', minScore: 30, interestRate: 0, url: '#', country: 'ALL' },
  ];

  for (const o of offers) {
    await prisma.marketplaceOffer.create({ data: o });
  }

  // Seed demo data
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Income
  await prisma.income.createMany({
    data: [
      { userId: user.id, amount: 3500, type: 'FIXED', category: 'salary', description: 'Monthly salary', date: thisMonth, recurring: true, recurringInterval: 'MONTHLY' },
      { userId: user.id, amount: 500, type: 'VARIABLE', category: 'freelance', description: 'Design project', date: new Date(now.getFullYear(), now.getMonth(), 15) },
    ],
  });

  // Expenses
  const expenseData = [
    { amount: 1200, category: 'housing', description: 'Rent', isSubscription: false, recurring: true, recurringInterval: 'MONTHLY' as const },
    { amount: 450, category: 'food', description: 'Groceries', isSubscription: false, recurring: false },
    { amount: 120, category: 'transportation', description: 'Gas + ride share', isSubscription: false, recurring: false },
    { amount: 15.99, category: 'entertainment', description: 'Netflix', isSubscription: true, recurring: true, recurringInterval: 'MONTHLY' as const },
    { amount: 10.99, category: 'entertainment', description: 'Spotify', isSubscription: true, recurring: true, recurringInterval: 'MONTHLY' as const },
    { amount: 85, category: 'utilities', description: 'Electricity', isSubscription: false, recurring: true, recurringInterval: 'MONTHLY' as const },
    { amount: 60, category: 'utilities', description: 'Internet', isSubscription: true, recurring: true, recurringInterval: 'MONTHLY' as const },
    { amount: 200, category: 'shopping', description: 'Clothes', isSubscription: false, recurring: false },
    { amount: 150, category: 'food', description: 'Dining out', isSubscription: false, recurring: false },
  ];

  for (const e of expenseData) {
    await prisma.expense.create({
      data: { userId: user.id, ...e, date: new Date(now.getFullYear(), now.getMonth(), Math.floor(Math.random() * 28) + 1) },
    });
  }

  // Debts
  await prisma.debt.create({
    data: {
      userId: user.id, name: 'Credit Card', totalAmount: 3000, remainingAmount: 2100,
      interestRate: 22.5, minimumPayment: 150, strategy: 'AVALANCHE',
    },
  });
  await prisma.debt.create({
    data: {
      userId: user.id, name: 'Student Loan', totalAmount: 15000, remainingAmount: 12500,
      interestRate: 6.8, minimumPayment: 250, strategy: 'SNOWBALL',
    },
  });

  // Savings goals
  await prisma.savingsGoal.create({
    data: {
      userId: user.id, name: 'Emergency Fund', targetAmount: 10000, currentAmount: 2500,
      category: 'emergency', deadline: new Date(now.getFullYear() + 1, 5, 1),
    },
  });
  await prisma.savingsGoal.create({
    data: {
      userId: user.id, name: 'Vacation', targetAmount: 3000, currentAmount: 800,
      category: 'vacation', deadline: new Date(now.getFullYear(), 11, 15),
    },
  });

  // Budgets
  const budgets = [
    { category: 'housing', amount: 1300 },
    { category: 'food', amount: 500 },
    { category: 'transportation', amount: 150 },
    { category: 'entertainment', amount: 100 },
    { category: 'utilities', amount: 200 },
    { category: 'shopping', amount: 200 },
  ];
  for (const b of budgets) {
    await prisma.budget.create({ data: { userId: user.id, ...b } });
  }

  console.log('Seed completed! Demo user: demo@flowfi.ai / demo123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
