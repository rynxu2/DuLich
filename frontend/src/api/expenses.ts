/**
 * Expenses API — Expense Service endpoints (port 8096)
 *
 * POST   /expenses              — Create expense
 * GET    /expenses/{id}         — Get expense detail
 * PUT    /expenses/{id}         — Update expense
 * DELETE /expenses/{id}         — Delete expense
 * GET    /expenses/tour/{tourId} — Get expenses by tour
 * GET    /expenses/guide/{guideId} — Get expenses by guide
 * GET    /expenses/pending      — Get pending expenses
 * PUT    /expenses/{id}/approve — Approve expense
 * PUT    /expenses/{id}/reject  — Reject expense
 */
import apiClient from './client';

export type ExpenseCategory = 'FOOD' | 'TRANSPORT' | 'ACCOMMODATION' | 'TICKETS' | 'UNEXPECTED';
export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ExpenseAttachment {
  id: number;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

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
  status: ExpenseStatus;
  approvedBy?: number;
  approvedAt?: string;
  rejectedReason?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  attachments: ExpenseAttachment[];
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

  getById: (id: number) =>
    apiClient.get<Expense>(`/expenses/${id}`),

  update: (id: number, data: Partial<CreateExpenseData>) =>
    apiClient.put<Expense>(`/expenses/${id}`, data),

  delete: (id: number) =>
    apiClient.delete(`/expenses/${id}`),

  getByTour: (tourId: number) =>
    apiClient.get<Expense[]>(`/expenses/tour/${tourId}`),

  getByGuide: (guideId: number) =>
    apiClient.get<Expense[]>(`/expenses/guide/${guideId}`),

  getPending: () =>
    apiClient.get<Expense[]>('/expenses/pending'),

  approve: (id: number) =>
    apiClient.put<Expense>(`/expenses/${id}/approve`),

  reject: (id: number, reason?: string) =>
    apiClient.put<Expense>(`/expenses/${id}/reject`, { reason }),
};
