import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Locale hints for Americas currencies to improve Intl.NumberFormat output
const CURRENCY_LOCALE_MAP: Record<string, string> = {
  USD: 'en-US',
  CAD: 'en-CA',
  MXN: 'es-MX',
  GTQ: 'es-GT',
  HNL: 'es-HN',
  NIO: 'es-NI',
  CRC: 'es-CR',
  PAB: 'es-PA',
  COP: 'es-CO',
  VES: 'es-VE',
  PEN: 'es-PE',
  BOB: 'es-BO',
  CLP: 'es-CL',
  ARS: 'es-AR',
  UYU: 'es-UY',
  PYG: 'es-PY',
  BRL: 'pt-BR',
  DOP: 'es-DO',
  CUP: 'es-CU',
  JMD: 'en-JM',
  TTD: 'en-TT',
  BZD: 'en-BZ',
  SRD: 'nl-SR',
  GYD: 'en-GY',
  HTG: 'fr-HT',
  BSD: 'en-BS',
  BBD: 'en-BB',
  XCD: 'en-AG',
  AWG: 'nl-AW',
  ANG: 'nl-CW',
  KYD: 'en-KY',
  BMD: 'en-BM',
  FKP: 'en-FK',
};

// Currencies that typically display without decimal places
const ZERO_DECIMAL_CURRENCIES = new Set(['CLP', 'PYG', 'COP']);

export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale?: string
): string {
  const resolvedLocale = locale || CURRENCY_LOCALE_MAP[currency] || 'en-US';
  const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(currency);

  return new Intl.NumberFormat(resolvedLocale, {
    style: 'currency',
    currency,
    minimumFractionDigits: isZeroDecimal ? 0 : 2,
    maximumFractionDigits: isZeroDecimal ? 0 : 2,
  }).format(amount);
}

export function formatDate(
  date: string | Date,
  locale: string = 'en-US'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    food: 'UtensilsCrossed',
    housing: 'Home',
    transportation: 'Car',
    utilities: 'Zap',
    entertainment: 'Film',
    shopping: 'ShoppingBag',
    health: 'Heart',
    education: 'GraduationCap',
    salary: 'Briefcase',
    freelance: 'Laptop',
    business: 'Building2',
    investments: 'TrendingUp',
    emergency: 'Shield',
    vacation: 'Palmtree',
    retirement: 'Landmark',
    loan: 'Banknote',
    creditCard: 'CreditCard',
    insurance: 'ShieldCheck',
    other: 'MoreHorizontal',
  };
  return icons[category] ?? 'Circle';
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    food: 'text-orange-500 bg-orange-50',
    housing: 'text-blue-500 bg-blue-50',
    transportation: 'text-yellow-500 bg-yellow-50',
    utilities: 'text-purple-500 bg-purple-50',
    entertainment: 'text-pink-500 bg-pink-50',
    shopping: 'text-rose-500 bg-rose-50',
    health: 'text-red-500 bg-red-50',
    education: 'text-indigo-500 bg-indigo-50',
    salary: 'text-green-500 bg-green-50',
    freelance: 'text-teal-500 bg-teal-50',
    business: 'text-cyan-500 bg-cyan-50',
    investments: 'text-emerald-500 bg-emerald-50',
    emergency: 'text-amber-500 bg-amber-50',
    vacation: 'text-sky-500 bg-sky-50',
    retirement: 'text-slate-500 bg-slate-50',
    loan: 'text-red-600 bg-red-50',
    creditCard: 'text-violet-500 bg-violet-50',
    insurance: 'text-lime-500 bg-lime-50',
    other: 'text-gray-500 bg-gray-50',
  };
  return colors[category] ?? 'text-gray-500 bg-gray-50';
}
