'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import {
  User,
  DollarSign,
  CreditCard,
  Landmark,
  Target,
  FileText,
  PartyPopper,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Upload,
  Sparkles,
  TrendingUp,
  Home,
  Wifi,
  Shield,
  Car,
  Tv,
  GraduationCap,
  Heart,
  Briefcase,
  Building2,
  BarChart3,
  CircleDollarSign,
  Camera,
  Globe,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import * as api from '@/lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IncomeSource {
  id: string;
  category: string;
  amount: number;
  frequency: 'monthly' | 'biweekly' | 'weekly';
}

interface ExpenseItem {
  id: string;
  category: string;
  label: string;
  amount: number;
}

interface DebtItem {
  id: string;
  name: string;
  type: string;
  totalAmount: number;
  interestRate: number;
  minimumPayment: number;
}

interface SavingsGoal {
  name: string;
  targetAmount: number;
  deadline: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 7;

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '\u20AC' },
  { code: 'GBP', name: 'British Pound', symbol: '\u00A3' },
  { code: 'GTQ', name: 'Guatemalan Quetzal', symbol: 'Q' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/' },
  { code: 'CRC', name: 'Costa Rican Colon', symbol: '\u20A1' },
  { code: 'HNL', name: 'Honduran Lempira', symbol: 'L' },
  { code: 'NIO', name: 'Nicaraguan Cordoba', symbol: 'C$' },
  { code: 'PAB', name: 'Panamanian Balboa', symbol: 'B/.' },
  { code: 'DOP', name: 'Dominican Peso', symbol: 'RD$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '\u00A5' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '\u00A5' },
  { code: 'KRW', name: 'South Korean Won', symbol: '\u20A9' },
  { code: 'INR', name: 'Indian Rupee', symbol: '\u20B9' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'z\u0142' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'K\u010D' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '\u20BA' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '\u20A6' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E\u00A3' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH\u20B5' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '\u20AA' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '\u20B1' },
  { code: 'THB', name: 'Thai Baht', symbol: '\u0E3F' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '\u20AB' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '\u20BD' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '\u20B4' },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: '\u043B\u0432' },
  { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn' },
  { code: 'ISK', name: 'Icelandic Krona', symbol: 'kr' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '\u20A8' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '\u09F3' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs' },
  { code: 'BOB', name: 'Bolivian Boliviano', symbol: 'Bs.' },
  { code: 'PYG', name: 'Paraguayan Guarani', symbol: '\u20B2' },
  { code: 'UYU', name: 'Uruguayan Peso', symbol: '$U' },
  { code: 'VES', name: 'Venezuelan Bolivar', symbol: 'Bs.S' },
  { code: 'JMD', name: 'Jamaican Dollar', symbol: 'J$' },
  { code: 'TTD', name: 'Trinidad Dollar', symbol: 'TT$' },
  { code: 'BZD', name: 'Belize Dollar', symbol: 'BZ$' },
  { code: 'XAF', name: 'Central African CFA', symbol: 'FCFA' },
  { code: 'XOF', name: 'West African CFA', symbol: 'CFA' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'MAD' },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'TND' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BD' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'OMR' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'QR' },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'JD' },
  { code: 'LBP', name: 'Lebanese Pound', symbol: 'L\u00A3' },
];

const INCOME_CATEGORIES = [
  { value: 'salary', icon: Briefcase },
  { value: 'freelance', icon: User },
  { value: 'business', icon: Building2 },
  { value: 'investments', icon: BarChart3 },
  { value: 'rental', icon: Home },
  { value: 'other', icon: CircleDollarSign },
];

const DEFAULT_EXPENSES = [
  { category: 'rent', label: 'Rent / Mortgage', icon: Home },
  { category: 'electricity', label: 'Electricity', icon: Sparkles },
  { category: 'water', label: 'Water', icon: Globe },
  { category: 'internet', label: 'Internet', icon: Wifi },
  { category: 'phone', label: 'Phone', icon: Wifi },
  { category: 'insurance', label: 'Insurance', icon: Shield },
  { category: 'car_payment', label: 'Car Payment', icon: Car },
  { category: 'subscriptions', label: 'Subscriptions', icon: Tv },
  { category: 'loan_payments', label: 'Loan Payments', icon: CreditCard },
];

const DEBT_TYPES = [
  'credit_card',
  'student_loan',
  'personal_loan',
  'car_loan',
  'mortgage',
  'medical',
  'other',
];

const GOAL_TEMPLATES = [
  { name: 'Emergency Fund', amount: 10000 },
  { name: 'Vacation', amount: 3000 },
  { name: 'New Car', amount: 20000 },
  { name: 'Education', amount: 15000 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function toMonthly(amount: number, freq: 'monthly' | 'biweekly' | 'weekly'): number {
  if (freq === 'weekly') return amount * 4.33;
  if (freq === 'biweekly') return amount * 2.17;
  return amount;
}

function formatMoney(n: number, symbol: string): string {
  return `${symbol}${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ---------------------------------------------------------------------------
// Step icons for the progress bar
// ---------------------------------------------------------------------------

const STEP_ICONS = [User, DollarSign, CreditCard, Landmark, Target, FileText, PartyPopper];

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -300 : 300,
    opacity: 0,
  }),
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function OnboardingWizard() {
  const t = useTranslations('onboarding');
  const router = useRouter();

  // Navigation state
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  // Step 1 - Profile
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('en');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Step 2 - Income
  const [incomes, setIncomes] = useState<IncomeSource[]>([
    { id: uid(), category: 'salary', amount: 0, frequency: 'monthly' },
  ]);

  // Step 3 - Expenses
  const [expenses, setExpenses] = useState<ExpenseItem[]>(
    DEFAULT_EXPENSES.map((e) => ({ id: uid(), category: e.category, label: e.label, amount: 0 }))
  );

  // Step 4 - Debts
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [isDebtFree, setIsDebtFree] = useState(false);

  // Step 5 - Savings goal
  const [savingsGoal, setSavingsGoal] = useState<SavingsGoal>({
    name: '',
    targetAmount: 0,
    deadline: '',
  });

  // Step 6 - Document upload
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Saving state
  const [saving, setSaving] = useState(false);

  // Computed values
  const selectedCurrency = useMemo(
    () => CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0],
    [currency]
  );

  const totalMonthlyIncome = useMemo(
    () => incomes.reduce((sum, inc) => sum + toMonthly(inc.amount, inc.frequency), 0),
    [incomes]
  );

  const totalMonthlyExpenses = useMemo(
    () => expenses.reduce((sum, exp) => sum + exp.amount, 0),
    [expenses]
  );

  const totalDebt = useMemo(() => debts.reduce((sum, d) => sum + d.totalAmount, 0), [debts]);

  const totalDebtPayments = useMemo(
    () => debts.reduce((sum, d) => sum + d.minimumPayment, 0),
    [debts]
  );

  const monthlySavingsPotential = totalMonthlyIncome - totalMonthlyExpenses - totalDebtPayments;

  // Navigation
  const goNext = useCallback(() => {
    if (step < TOTAL_STEPS) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  }, [step]);

  const goBack = useCallback(() => {
    if (step > 1) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  }, [step]);

  // Save each step via API (best-effort, won't block if API not ready)
  const saveStepData = useCallback(async () => {
    setSaving(true);
    try {
      if (step === 1) {
        await api.updateProfile({ currency, language }).catch(() => {});
      } else if (step === 2) {
        for (const inc of incomes) {
          if (inc.amount > 0) {
            await api
              .createIncome({
                category: inc.category,
                amount: toMonthly(inc.amount, inc.frequency),
                description: `${inc.category} income`,
                type: 'fixed',
                interval: inc.frequency,
              })
              .catch(() => {});
          }
        }
      } else if (step === 3) {
        for (const exp of expenses) {
          if (exp.amount > 0) {
            await api
              .createExpense({
                category: exp.category,
                amount: exp.amount,
                description: exp.label,
                recurring: true,
                interval: 'monthly',
              })
              .catch(() => {});
          }
        }
      } else if (step === 4) {
        for (const debt of debts) {
          await api
            .createDebt({
              name: debt.name,
              type: debt.type,
              totalAmount: debt.totalAmount,
              remaining: debt.totalAmount,
              interestRate: debt.interestRate,
              minimumPayment: debt.minimumPayment,
            })
            .catch(() => {});
        }
      } else if (step === 5) {
        if (savingsGoal.name && savingsGoal.targetAmount > 0) {
          await api
            .createSavingsGoal({
              name: savingsGoal.name,
              targetAmount: savingsGoal.targetAmount,
              currentAmount: 0,
              deadline: savingsGoal.deadline || undefined,
            })
            .catch(() => {});
        }
      } else if (step === 6) {
        if (uploadedFile) {
          await api.uploadDocument(uploadedFile, 'receipt').catch(() => {});
        }
      }
    } finally {
      setSaving(false);
    }
  }, [step, currency, language, incomes, expenses, debts, savingsGoal, uploadedFile]);

  const handleNext = useCallback(async () => {
    await saveStepData();
    goNext();
  }, [saveStepData, goNext]);

  const handleFinish = useCallback(async () => {
    await saveStepData();
    localStorage.setItem('flowfi_onboarding_complete', 'true');
    router.push('/dashboard');
  }, [saveStepData, router]);

  // Income helpers
  const addIncome = () =>
    setIncomes((prev) => [
      ...prev,
      { id: uid(), category: 'freelance', amount: 0, frequency: 'monthly' },
    ]);

  const removeIncome = (id: string) =>
    setIncomes((prev) => prev.filter((i) => i.id !== id));

  const updateIncome = (id: string, field: keyof IncomeSource, value: unknown) =>
    setIncomes((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));

  // Expense helpers
  const addExpense = () =>
    setExpenses((prev) => [
      ...prev,
      { id: uid(), category: 'custom', label: '', amount: 0 },
    ]);

  const removeExpense = (id: string) =>
    setExpenses((prev) => prev.filter((e) => e.id !== id));

  const updateExpense = (id: string, field: keyof ExpenseItem, value: unknown) =>
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));

  // Debt helpers
  const addDebt = (type: string = 'other') =>
    setDebts((prev) => [
      ...prev,
      { id: uid(), name: '', type, totalAmount: 0, interestRate: 0, minimumPayment: 0 },
    ]);

  const removeDebt = (id: string) => setDebts((prev) => prev.filter((d) => d.id !== id));

  const updateDebt = (id: string, field: keyof DebtItem, value: unknown) =>
    setDebts((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));

  // Photo
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // File drag/drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) setUploadedFile(e.dataTransfer.files[0]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setUploadedFile(e.target.files[0]);
  };

  // ---------------------------------------------------------------------------
  // RENDER STEPS
  // ---------------------------------------------------------------------------

  const renderStep1 = () => (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold">{t('step1.title')}</h2>
        <p className="text-muted-foreground max-w-md mx-auto">{t('step1.subtitle')}</p>
      </div>

      {/* Photo upload */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-muted-foreground/30 group-hover:border-primary transition-colors">
            {photoPreview ? (
              <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <label className="absolute inset-0 cursor-pointer rounded-full">
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </label>
        </div>
        <span className="text-sm text-muted-foreground">{t('step1.photoOptional')}</span>
      </div>

      {/* Currency */}
      <div className="space-y-2 max-w-sm mx-auto">
        <label className="text-sm font-medium">{t('step1.selectCurrency')}</label>
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.symbol} {c.code} - {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Language */}
      <div className="space-y-2 max-w-sm mx-auto">
        <label className="text-sm font-medium">{t('step1.selectLanguage')}</label>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="es">Espanol</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
          <TrendingUp className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold">{t('step2.title')}</h2>
        <p className="text-muted-foreground">{t('step2.subtitle')}</p>
      </div>

      <div className="space-y-4 max-w-lg mx-auto">
        {incomes.map((inc, idx) => {
          const CatIcon = INCOME_CATEGORIES.find((c) => c.value === inc.category)?.icon || DollarSign;
          return (
            <Card key={inc.id} className="overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CatIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {t(`step2.categories.${inc.category}`)}
                    </span>
                  </div>
                  {idx > 0 && (
                    <Button size="icon" variant="ghost" onClick={() => removeIncome(inc.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <Select
                      value={inc.category}
                      onValueChange={(v) => updateIncome(inc.id, 'category', v)}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INCOME_CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {t(`step2.categories.${c.value}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      placeholder={t('step2.amount')}
                      value={inc.amount || ''}
                      onChange={(e) => updateIncome(inc.id, 'amount', Number(e.target.value))}
                      min={0}
                    />
                  </div>
                  <div className="col-span-1">
                    <Select
                      value={inc.frequency}
                      onValueChange={(v) => updateIncome(inc.id, 'frequency', v)}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">{t('step2.monthly')}</SelectItem>
                        <SelectItem value="biweekly">{t('step2.biweekly')}</SelectItem>
                        <SelectItem value="weekly">{t('step2.weekly')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        <Button variant="outline" className="w-full" onClick={addIncome}>
          <Plus className="w-4 h-4 mr-2" />
          {t('step2.addMore')}
        </Button>
      </div>

      {/* Running total */}
      <div className="text-center p-4 rounded-lg bg-green-500/10 max-w-lg mx-auto">
        <span className="text-sm text-muted-foreground">{t('step2.totalMonthly')}</span>
        <p className="text-2xl font-bold text-green-500">
          {formatMoney(totalMonthlyIncome, selectedCurrency.symbol)}
        </p>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/10 mb-4">
          <CreditCard className="w-8 h-8 text-orange-500" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold">{t('step3.title')}</h2>
        <p className="text-muted-foreground">{t('step3.subtitle')}</p>
      </div>

      <div className="space-y-3 max-w-lg mx-auto">
        {expenses.map((exp) => {
          const defExp = DEFAULT_EXPENSES.find((d) => d.category === exp.category);
          const Icon = defExp?.icon || CreditCard;
          return (
            <div key={exp.id} className="flex items-center gap-3">
              <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                {exp.category === 'custom' ? (
                  <Input
                    placeholder={t('step3.customName')}
                    value={exp.label}
                    onChange={(e) => updateExpense(exp.id, 'label', e.target.value)}
                    className="h-9 text-sm"
                  />
                ) : (
                  <span className="text-sm font-medium truncate block">
                    {t(`step3.categories.${exp.category}`)}
                  </span>
                )}
              </div>
              <div className="w-32 shrink-0">
                <Input
                  type="number"
                  placeholder="0"
                  value={exp.amount || ''}
                  onChange={(e) => updateExpense(exp.id, 'amount', Number(e.target.value))}
                  min={0}
                  className="h-9"
                />
              </div>
              {exp.category === 'custom' && (
                <Button size="icon" variant="ghost" onClick={() => removeExpense(exp.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              )}
            </div>
          );
        })}

        <Button variant="outline" className="w-full" onClick={addExpense}>
          <Plus className="w-4 h-4 mr-2" />
          {t('step3.addCustom')}
        </Button>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
        <div className="text-center p-4 rounded-lg bg-orange-500/10">
          <span className="text-sm text-muted-foreground">{t('step3.totalExpenses')}</span>
          <p className="text-xl font-bold text-orange-500">
            {formatMoney(totalMonthlyExpenses, selectedCurrency.symbol)}
          </p>
        </div>
        <div className="text-center p-4 rounded-lg bg-primary/10">
          <span className="text-sm text-muted-foreground">{t('step3.remaining')}</span>
          <p className={`text-xl font-bold ${totalMonthlyIncome - totalMonthlyExpenses >= 0 ? 'text-green-500' : 'text-destructive'}`}>
            {formatMoney(totalMonthlyIncome - totalMonthlyExpenses, selectedCurrency.symbol)}
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
          <Landmark className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold">{t('step4.title')}</h2>
        <p className="text-muted-foreground">{t('step4.subtitle')}</p>
      </div>

      {!isDebtFree && (
        <>
          {/* Quick-add debt type buttons */}
          <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
            {DEBT_TYPES.map((type) => (
              <Badge
                key={type}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-3 py-1.5"
                variant="outline"
                onClick={() => addDebt(type)}
              >
                <Plus className="w-3 h-3 mr-1" />
                {t(`step4.types.${type}`)}
              </Badge>
            ))}
          </div>

          <div className="space-y-4 max-w-lg mx-auto">
            {debts.map((debt) => (
              <Card key={debt.id} className="overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{t(`step4.types.${debt.type}`)}</Badge>
                    <Button size="icon" variant="ghost" onClick={() => removeDebt(debt.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  <Input
                    placeholder={t('step4.debtName')}
                    value={debt.name}
                    onChange={(e) => updateDebt(debt.id, 'name', e.target.value)}
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      type="number"
                      placeholder={t('step4.totalAmount')}
                      value={debt.totalAmount || ''}
                      onChange={(e) => updateDebt(debt.id, 'totalAmount', Number(e.target.value))}
                      min={0}
                    />
                    <Input
                      type="number"
                      placeholder={t('step4.interestRate')}
                      value={debt.interestRate || ''}
                      onChange={(e) => updateDebt(debt.id, 'interestRate', Number(e.target.value))}
                      min={0}
                      step={0.1}
                    />
                    <Input
                      type="number"
                      placeholder={t('step4.minPayment')}
                      value={debt.minimumPayment || ''}
                      onChange={(e) => updateDebt(debt.id, 'minimumPayment', Number(e.target.value))}
                      min={0}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary */}
          {debts.length > 0 && (
            <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
              <div className="text-center p-4 rounded-lg bg-red-500/10">
                <span className="text-sm text-muted-foreground">{t('step4.totalDebt')}</span>
                <p className="text-xl font-bold text-red-500">
                  {formatMoney(totalDebt, selectedCurrency.symbol)}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-red-500/10">
                <span className="text-sm text-muted-foreground">{t('step4.monthlyPayments')}</span>
                <p className="text-xl font-bold text-red-500">
                  {formatMoney(totalDebtPayments, selectedCurrency.symbol)}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Debt free button */}
      <div className="text-center">
        <Button
          variant={isDebtFree ? 'default' : 'outline'}
          className={isDebtFree ? 'bg-green-500 hover:bg-green-600' : ''}
          onClick={() => {
            setIsDebtFree(!isDebtFree);
            if (!isDebtFree) setDebts([]);
          }}
        >
          <PartyPopper className="w-4 h-4 mr-2" />
          {t('step4.debtFree')}
        </Button>
        {isDebtFree && (
          <p className="text-green-500 font-medium mt-3 animate-pulse">{t('step4.debtFreeCelebration')}</p>
        )}
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mb-4">
          <Target className="w-8 h-8 text-blue-500" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold">{t('step5.title')}</h2>
        <p className="text-muted-foreground">{t('step5.subtitle')}</p>
      </div>

      {/* Goal templates */}
      <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
        {GOAL_TEMPLATES.map((goal) => (
          <Card
            key={goal.name}
            className={`cursor-pointer transition-all hover:border-primary ${
              savingsGoal.name === goal.name ? 'border-primary ring-2 ring-primary/20' : ''
            }`}
            onClick={() =>
              setSavingsGoal({
                name: goal.name,
                targetAmount: goal.amount,
                deadline: savingsGoal.deadline,
              })
            }
          >
            <CardContent className="p-4 text-center">
              <p className="font-medium text-sm">{t(`step5.templates.${goal.name.toLowerCase().replace(/ /g, '_')}`)}</p>
              <p className="text-lg font-bold text-primary mt-1">
                {formatMoney(goal.amount, selectedCurrency.symbol)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Custom goal */}
      <div className="space-y-3 max-w-lg mx-auto">
        <Input
          placeholder={t('step5.goalName')}
          value={savingsGoal.name}
          onChange={(e) => setSavingsGoal((prev) => ({ ...prev, name: e.target.value }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="number"
            placeholder={t('step5.targetAmount')}
            value={savingsGoal.targetAmount || ''}
            onChange={(e) =>
              setSavingsGoal((prev) => ({ ...prev, targetAmount: Number(e.target.value) }))
            }
            min={0}
          />
          <Input
            type="date"
            value={savingsGoal.deadline}
            onChange={(e) => setSavingsGoal((prev) => ({ ...prev, deadline: e.target.value }))}
          />
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/10 mb-4">
          <FileText className="w-8 h-8 text-purple-500" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold">{t('step6.title')}</h2>
        <p className="text-muted-foreground max-w-md mx-auto">{t('step6.subtitle')}</p>
      </div>

      <div
        className={`max-w-lg mx-auto border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/30 hover:border-primary/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {uploadedFile ? (
          <div className="space-y-3">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <p className="font-medium">{uploadedFile.name}</p>
            <p className="text-sm text-muted-foreground">
              {(uploadedFile.size / 1024).toFixed(1)} KB
            </p>
            <Button variant="ghost" size="sm" onClick={() => setUploadedFile(null)}>
              <X className="w-4 h-4 mr-1" /> {t('step6.remove')}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="font-medium">{t('step6.dragDrop')}</p>
            <p className="text-sm text-muted-foreground">{t('step6.or')}</p>
            <label>
              <Button variant="outline" asChild>
                <span className="cursor-pointer">
                  {t('step6.browse')}
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={handleFileSelect}
                  />
                </span>
              </Button>
            </label>
          </div>
        )}
      </div>

      <p className="text-center text-sm text-muted-foreground max-w-md mx-auto">
        {t('step6.aiExplain')}
      </p>
    </div>
  );

  const renderStep7 = () => (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-green-500 mb-4 animate-bounce">
          <PartyPopper className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold">{t('step7.title')}</h2>
        <p className="text-muted-foreground">{t('step7.subtitle')}</p>
      </div>

      {/* Confetti-like decorative dots */}
      <div className="relative max-w-md mx-auto">
        <div className="absolute -top-4 -left-4 w-3 h-3 rounded-full bg-primary animate-ping" />
        <div className="absolute -top-2 -right-6 w-2 h-2 rounded-full bg-green-500 animate-ping delay-100" />
        <div className="absolute -bottom-3 left-8 w-2 h-2 rounded-full bg-orange-500 animate-ping delay-200" />

        <Card className="overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">{t('step7.monthlyIncome')}</span>
              <span className="font-bold text-green-500">
                {formatMoney(totalMonthlyIncome, selectedCurrency.symbol)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">{t('step7.monthlyExpenses')}</span>
              <span className="font-bold text-orange-500">
                {formatMoney(totalMonthlyExpenses, selectedCurrency.symbol)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">{t('step7.savingsPotential')}</span>
              <span
                className={`font-bold ${monthlySavingsPotential >= 0 ? 'text-green-500' : 'text-destructive'}`}
              >
                {formatMoney(monthlySavingsPotential, selectedCurrency.symbol)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">{t('step7.totalDebt')}</span>
              <span className="font-bold">
                {isDebtFree
                  ? t('step7.debtFreeLabel')
                  : formatMoney(totalDebt, selectedCurrency.symbol)}
              </span>
            </div>
            {savingsGoal.name && (
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">{t('step7.firstGoal')}</span>
                <span className="font-bold text-blue-500">{savingsGoal.name}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-center text-sm text-muted-foreground max-w-md mx-auto">
        {t('step7.scoreMessage')}
      </p>
    </div>
  );

  const steps = [renderStep1, renderStep2, renderStep3, renderStep4, renderStep5, renderStep6, renderStep7];

  // ---------------------------------------------------------------------------
  // MAIN RENDER
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b px-4 py-3">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {t('progress', { current: step, total: TOTAL_STEPS })}
            </span>
            <span className="text-sm font-medium text-primary">
              {Math.round((step / TOTAL_STEPS) * 100)}%
            </span>
          </div>
          <Progress value={(step / TOTAL_STEPS) * 100} className="h-2" />
          {/* Step indicator dots */}
          <div className="flex justify-between">
            {STEP_ICONS.map((Icon, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
                  idx + 1 === step
                    ? 'bg-primary text-primary-foreground scale-110'
                    : idx + 1 < step
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {idx + 1 < step ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex items-start justify-center px-4 py-8 md:py-12 overflow-y-auto">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {steps[step - 1]()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="sticky bottom-0 z-50 bg-background/80 backdrop-blur-md border-t px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          {step > 1 ? (
            <Button variant="outline" onClick={goBack} disabled={saving}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              {t('back')}
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {/* Skip buttons for optional steps */}
            {(step === 2 || step === 5 || step === 6) && (
              <Button variant="ghost" onClick={goNext} disabled={saving}>
                {t('skip')}
              </Button>
            )}

            {step < TOTAL_STEPS ? (
              <Button onClick={handleNext} disabled={saving}>
                {saving ? t('saving') : t('next')}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={saving}
                className="bg-gradient-to-r from-primary to-green-500 hover:opacity-90"
                size="lg"
              >
                {saving ? t('saving') : t('step7.goToDashboard')}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
