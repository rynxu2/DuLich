/**
 * Pricing API — Pricing Service endpoints (port 8097)
 *
 * GET    /pricing/preview       — Price preview (query params)
 * POST   /pricing/preview       — Price preview (body)
 * GET    /pricing/rules         — List all pricing rules
 * POST   /pricing/rules         — Create pricing rule
 * PUT    /pricing/rules/{id}    — Update pricing rule
 * DELETE /pricing/rules/{id}    — Delete pricing rule
 * GET    /pricing/promos        — List promo codes
 * POST   /pricing/promos        — Create promo code
 * DELETE /pricing/promos/{id}   — Delete promo code
 */
import apiClient from './client';

export type PricingRuleType = 'SEASONAL' | 'GROUP' | 'AGE' | 'EARLYBIRD' | 'LASTMINUTE' | 'PROMO';
export type ModifierType = 'PERCENTAGE' | 'FIXED';

export interface PricingRule {
  id: number;
  name: string;
  type: PricingRuleType;
  conditions: Record<string, any>;
  modifierType: ModifierType;
  modifierValue: number;
  priority: number;
  isActive: boolean;
  tourId?: number;
  validFrom?: string;
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromoCode {
  id: number;
  code: string;
  description: string;
  ruleId: number;
  maxUses: number;
  currentUses: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

export interface PricePreviewParams {
  tourId: number;
  adults: number;
  children?: number;
  departureDate?: string;
  promoCode?: string;
}

export interface AppliedRule {
  ruleName: string;
  ruleType: string;
  adjustment: number;
}

export interface PricePreviewResponse {
  basePrice: number;
  finalPrice: number;
  totalParticipants: number;
  appliedRules: AppliedRule[];
  savings: number;
  currency: string;
}

export const pricingApi = {
  /** Get price preview with dynamic pricing rules applied */
  preview: (params: PricePreviewParams) =>
    apiClient.get<PricePreviewResponse>('/pricing/preview', { params }),

  /** Preview via POST (more complex requests) */
  previewPost: (data: PricePreviewParams) =>
    apiClient.post<PricePreviewResponse>('/pricing/preview', data),

  // ── Admin: Pricing Rules ──
  listRules: () =>
    apiClient.get<PricingRule[]>('/pricing/rules'),

  createRule: (data: Partial<PricingRule>) =>
    apiClient.post<PricingRule>('/pricing/rules', data),

  updateRule: (id: number, data: Partial<PricingRule>) =>
    apiClient.put<PricingRule>(`/pricing/rules/${id}`, data),

  deleteRule: (id: number) =>
    apiClient.delete(`/pricing/rules/${id}`),

  // ── Admin: Promo Codes ──
  listPromos: () =>
    apiClient.get<PromoCode[]>('/pricing/promos'),

  createPromo: (data: Partial<PromoCode>) =>
    apiClient.post<PromoCode>('/pricing/promos', data),

  deletePromo: (id: number) =>
    apiClient.delete(`/pricing/promos/${id}`),
};
