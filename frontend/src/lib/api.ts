const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('flowfi_token');
}

function authHeaders(): HeadersInit {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new ApiError(error.message || response.statusText, response.status, error);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// --- HTTP helpers ---

export async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: authHeaders(),
  });
  return handleResponse<T>(res);
}

export async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

export async function patch<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

export async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse<T>(res);
}

async function upload<T>(path: string, file: File, extra?: Record<string, string>): Promise<T> {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => formData.append(k, v));
  }
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  return handleResponse<T>(res);
}

// --- Auth ---

export function login(email: string, password: string) {
  return post<{ token: string; user: unknown }>('/auth/login', { email, password });
}

export function register(data: { name: string; email: string; password: string }) {
  return post<{ token: string; user: unknown }>('/auth/register', data);
}

export function getProfile() {
  return get<unknown>('/auth/profile');
}

// --- Income ---

export function getIncome(params?: Record<string, string>) {
  return get<unknown[]>('/income', params);
}

export function createIncome(data: Record<string, unknown>) {
  return post<unknown>('/income', data);
}

export function updateIncome(id: string, data: Record<string, unknown>) {
  return patch<unknown>(`/income/${id}`, data);
}

export function deleteIncome(id: string) {
  return del<void>(`/income/${id}`);
}

// --- Expenses ---

export function getExpenses(params?: Record<string, string>) {
  return get<unknown[]>('/expenses', params);
}

export function createExpense(data: Record<string, unknown>) {
  return post<unknown>('/expenses', data);
}

export function updateExpense(id: string, data: Record<string, unknown>) {
  return patch<unknown>(`/expenses/${id}`, data);
}

export function deleteExpense(id: string) {
  return del<void>(`/expenses/${id}`);
}

export function getSubscriptions() {
  return get<unknown[]>('/expenses/subscriptions');
}

export function getExpensesByCategory(params?: Record<string, string>) {
  return get<unknown[]>('/expenses/by-category', params);
}

// --- Debts ---

export function getDebts() {
  return get<unknown[]>('/debts');
}

export function createDebt(data: Record<string, unknown>) {
  return post<unknown>('/debts', data);
}

export function updateDebt(id: string, data: Record<string, unknown>) {
  return patch<unknown>(`/debts/${id}`, data);
}

export function deleteDebt(id: string) {
  return del<void>(`/debts/${id}`);
}

export function addDebtPayment(debtId: string, data: { amount: number; date: string; note?: string }) {
  return post<unknown>(`/debts/${debtId}/payments`, data);
}

export function getDebtPlan(strategy: 'snowball' | 'avalanche') {
  return get<unknown>('/debts/plan', { strategy });
}

// --- Documents ---

export function getDocuments() {
  return get<unknown[]>('/documents');
}

export function uploadDocument(file: File, type: string) {
  return upload<unknown>('/documents', file, { type });
}

export function deleteDocument(id: string) {
  return del<void>(`/documents/${id}`);
}

export function runOcr(id: string) {
  return post<unknown>(`/documents/${id}/ocr`);
}

// --- AI Coach ---

export function chatWithCoach(message: string) {
  return post<unknown>('/coach/chat', { message });
}

export function getInsights() {
  return get<unknown[]>('/coach/insights');
}

export function getSavingsTips() {
  return get<unknown[]>('/coach/savings-tips');
}

export function getInvestmentAdvice() {
  return get<unknown>('/coach/investment-advice');
}

// --- Financial Score ---

export function getScore() {
  return get<unknown>('/score');
}

export function calculateScore() {
  return post<unknown>('/score/calculate');
}

export function getScoreHistory() {
  return get<unknown[]>('/score/history');
}

// --- Marketplace ---

export function getMarketplace() {
  return get<unknown[]>('/marketplace');
}

export function getEligibleOffers() {
  return get<unknown[]>('/marketplace/eligible');
}

// --- Dashboard ---

export function getDashboard() {
  return get<unknown>('/dashboard');
}

export function getMonthlyReport(month: number, year: number) {
  return get<unknown>('/dashboard/report', { month: String(month), year: String(year) });
}

export function getProjection() {
  return get<unknown[]>('/dashboard/projection');
}

// --- Gamification ---

export function getAchievements() {
  return get<unknown[]>('/gamification/achievements');
}

export function getLevel() {
  return get<unknown>('/gamification/level');
}

export function checkAchievements() {
  return post<unknown[]>('/gamification/check');
}

// --- Savings Goals ---

export function getSavingsGoals() {
  return get<unknown[]>('/savings-goals');
}

export function createSavingsGoal(data: Record<string, unknown>) {
  return post<unknown>('/savings-goals', data);
}

export function updateSavingsGoal(id: string, data: Record<string, unknown>) {
  return patch<unknown>(`/savings-goals/${id}`, data);
}

export function deleteSavingsGoal(id: string) {
  return del<void>(`/savings-goals/${id}`);
}

export function contributeSavingsGoal(id: string, data: { amount: number; note?: string }) {
  return post<unknown>(`/savings-goals/${id}/contribute`, data);
}

// --- Investment Plans ---

export function getInvestmentPlans() {
  return get<unknown[]>('/investment-plans');
}

export function createInvestmentPlan(data: Record<string, unknown>) {
  return post<unknown>('/investment-plans', data);
}

export function updateInvestmentPlan(id: string, data: Record<string, unknown>) {
  return patch<unknown>(`/investment-plans/${id}`, data);
}

export function deleteInvestmentPlan(id: string) {
  return del<void>(`/investment-plans/${id}`);
}

// --- User Settings ---

export function updateProfile(data: Record<string, unknown>) {
  return patch<unknown>('/auth/profile', data);
}

// --- Payments / Stripe ---

/** Creates a Stripe Checkout session and returns the session URL for redirect. */
export function createCheckoutSession(priceId: string) {
  return post<{ sessionId: string; url: string }>('/payments/create-checkout', { priceId });
}

/** Creates a Stripe Customer Portal session to manage subscription. */
export function createCustomerPortal() {
  return post<{ url: string }>('/payments/customer-portal');
}

/** Gets the current subscription status for the authenticated user. */
export function getSubscriptionStatus() {
  return get<{
    tier: string;
    status: string;
    priceId: string | null;
    subscriptionId: string | null;
    customerId: string | null;
  }>('/payments/status');
}

// --- Admin ---

export function getAdminStats() {
  return get<{
    totalUsers: number;
    activeSubscriptions: number;
    subscriptionsByTier: Record<string, number>;
    mrr: number;
    totalRevenue: number;
    newUsersToday: number;
    newUsersWeek: number;
    newUsersMonth: number;
    churnRate: number;
  }>('/admin/stats');
}

export function getAdminUsers(params?: Record<string, string>) {
  return get<{
    users: Array<{
      id: string;
      email: string;
      name: string;
      avatar: string | null;
      subscriptionTier: string;
      locale: string;
      currency: string;
      createdAt: string;
      updatedAt: string;
      score: number | null;
      status: string;
      _count: {
        incomes: number;
        expenses: number;
        debts: number;
        financialScores: number;
      };
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>('/admin/users', params);
}

export function getAdminUserDetail(userId: string) {
  return get<unknown>(`/admin/users/${userId}`);
}

export function updateUserTier(userId: string, tier: string) {
  return patch<unknown>(`/admin/users/${userId}/tier`, { tier });
}

export function toggleUserStatus(userId: string, enabled: boolean) {
  return patch<unknown>(`/admin/users/${userId}/status`, { enabled });
}

export function getRevenueChart() {
  return get<Array<{ month: string; revenue: number; users: number }>>('/admin/revenue');
}

export function getGrowthMetrics() {
  return get<{
    months: Array<{ month: string; newUsers: number; totalUsers: number }>;
    conversionRate: number;
    totalUsers: number;
    paidUsers: number;
  }>('/admin/growth');
}

export function exportUsers(format: string = 'json') {
  return get<{ users: unknown[]; total: number; exportedAt: string }>('/admin/export', { format });
}
