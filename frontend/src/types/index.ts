export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  currency: string;
  language: string;
  subscription: 'FREE' | 'PRO' | 'PREMIUM';
  createdAt: string;
  updatedAt: string;
}

export interface Income {
  id: string;
  userId: string;
  amount: number;
  category: 'SALARY' | 'FREELANCE' | 'BUSINESS' | 'INVESTMENTS' | 'OTHER';
  type: 'FIXED' | 'VARIABLE';
  description: string;
  date: string;
  recurring: boolean;
  interval?: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'YEARLY' | null;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: 'FOOD' | 'HOUSING' | 'TRANSPORTATION' | 'UTILITIES' | 'ENTERTAINMENT' | 'SHOPPING' | 'HEALTH' | 'EDUCATION' | 'OTHER';
  description: string;
  date: string;
  recurring: boolean;
  interval?: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'YEARLY' | null;
  isSubscription: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Debt {
  id: string;
  userId: string;
  name: string;
  totalAmount: number;
  remainingAmount: number;
  interestRate: number;
  minimumPayment: number;
  dueDate: string;
  status: 'ACTIVE' | 'PAID_OFF' | 'DEFAULTED';
  payments: DebtPayment[];
  createdAt: string;
  updatedAt: string;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  date: string;
  note?: string | null;
  createdAt: string;
}

export interface Document {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  type: 'INVOICE' | 'RECEIPT' | 'STATEMENT' | 'OTHER';
  ocrText?: string | null;
  ocrData?: Record<string, unknown> | null;
  classification?: string | null;
  processed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  context?: Record<string, unknown> | null;
  createdAt: string;
}

export interface FinancialScore {
  id: string;
  userId: string;
  score: number;
  savingsRate: number;
  debtToIncome: number;
  paymentConsistency: number;
  spendingDiscipline: number;
  budgetAdherence: number;
  level: string;
  calculatedAt: string;
}

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  threshold: number;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  achievement: Achievement;
  unlockedAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  amount: number;
  month: number;
  year: number;
  spent: number;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceOffer {
  id: string;
  provider: string;
  type: 'LOAN' | 'CREDIT_CARD' | 'INSURANCE' | 'INVESTMENT';
  title: string;
  description: string;
  interestRate?: number | null;
  minScore: number;
  requirements?: Record<string, unknown> | null;
  url: string;
  logoUrl?: string | null;
  active: boolean;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  category: 'EMERGENCY' | 'VACATION' | 'EDUCATION' | 'RETIREMENT' | 'CUSTOM';
  targetAmount: number;
  currentAmount: number;
  deadline?: string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  contributions: SavingsContribution[];
  createdAt: string;
  updatedAt: string;
}

export interface SavingsContribution {
  id: string;
  savingsGoalId: string;
  amount: number;
  date: string;
  note?: string | null;
  createdAt: string;
}

export interface InvestmentPlan {
  id: string;
  userId: string;
  riskProfile: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  monthlyAmount: number;
  horizonMonths: number;
  allocation: Record<string, number>;
  expectedReturn: number;
  projections: Record<string, unknown>;
  recommendations: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, unknown> | null;
  createdAt: string;
}

export interface DashboardData {
  monthlyBalance: number;
  totalIncome: number;
  totalExpenses: number;
  savingsRate: number;
  cashFlow: { month: string; income: number; expenses: number }[];
  expensesByCategory: { category: string; amount: number; percentage: number }[];
  recentTransactions: (Income | Expense)[];
  alerts: Notification[];
  score?: FinancialScore | null;
  projectedSavings: number;
}

export interface MonthlyReport {
  month: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  savings: number;
  savingsRate: number;
  topCategories: { category: string; amount: number }[];
  incomeBreakdown: { category: string; amount: number }[];
  debtPayments: number;
  scoreChange: number;
}

export interface CashFlowProjection {
  month: string;
  projectedIncome: number;
  projectedExpenses: number;
  projectedSavings: number;
  confidence: number;
}

export interface ScoreBreakdown {
  overall: number;
  savingsRate: number;
  debtToIncome: number;
  paymentConsistency: number;
  spendingDiscipline: number;
  budgetAdherence: number;
  level: string;
  tips: string[];
}

export interface Insight {
  id: string;
  type: 'TIP' | 'WARNING' | 'OPPORTUNITY' | 'ACHIEVEMENT';
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  actionUrl?: string | null;
}

export interface SavingsRecommendation {
  category: string;
  currentSpend: number;
  recommendedSpend: number;
  potentialSavings: number;
  tips: string[];
}
