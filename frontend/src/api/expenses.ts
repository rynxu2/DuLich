/**
 * Expenses API — Expense Service endpoints
 *
 * POST   /expenses              — Create expense
 * GET    /expenses              — List all
 * GET    /expenses/pending      — Get pending expenses
 * GET    /expenses/tour/{tourId} — Get expenses by tour
 * PUT    /expenses/{id}/approve — Approve expense
 * PUT    /expenses/{id}/reject  — Reject expense
 */
import apiClient from './client';

export type ExpenseCategory =
  | 'TRANSPORT'
  | 'ACCOMMODATION'
  | 'MEALS'
  | 'ENTRANCE_FEE'
  | 'GUIDE_FEE'
  | 'EQUIPMENT'
  | 'INSURANCE'
  | 'EMERGENCY'
  | 'OTHER';

export interface Expense {
  id: number;
  tourId: number;
  bookingId?: number;
  guideId?: number;
  itineraryDay?: number;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseData {
  tourId: number;
  bookingId?: number;
  guideId?: number;
  itineraryDay?: number;
  category: ExpenseCategory;
  amount: number;
  description: string;
}

export const expensesApi = {
  create: (data: CreateExpenseData) =>
    apiClient.post<Expense>('/expenses', data),

  list: () =>
    apiClient.get<Expense[]>('/expenses'),

  getPending: () =>
    apiClient.get<Expense[]>('/expenses/pending'),

  getByTour: (tourId: number) =>
    apiClient.get<Expense[]>(`/expenses/tour/${tourId}`),

  getById: (id: number) =>
    apiClient.get<Expense>(`/expenses/${id}`),

  delete: (id: number) =>
    apiClient.delete(`/expenses/${id}`),
};

export const CATEGORY_LABELS: Record<ExpenseCategory, { label: string; emoji: string }> = {
  TRANSPORT: { label: 'Di chuyển', emoji: '🚗' },
  ACCOMMODATION: { label: 'Lưu trú', emoji: '🏨' },
  MEALS: { label: 'Ăn uống', emoji: '🍜' },
  ENTRANCE_FEE: { label: 'Vé tham quan', emoji: '🎟' },
  GUIDE_FEE: { label: 'Phí HDV', emoji: '👤' },
  EQUIPMENT: { label: 'Thiết bị', emoji: '🎒' },
  INSURANCE: { label: 'Bảo hiểm', emoji: '🛡' },
  EMERGENCY: { label: 'Phát sinh', emoji: '⚡' },
  OTHER: { label: 'Khác', emoji: '📦' },
};
