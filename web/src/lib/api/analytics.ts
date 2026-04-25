/**
 * Analytics API — Analytics Service endpoints
 *
 * GET /analytics/revenue  — Revenue data
 * GET /analytics/kpi      — KPI dashboard data
 * GET /analytics/health   — Service health
 */
import apiClient from '../api';

export interface RevenueData {
  totalRevenue: number;
  monthlyRevenue: number;
  currency: string;
}

export interface KPIData {
  totalBookings: number;
  conversionRate: number;
  averageRating: number;
}

export const analyticsApi = {
  getRevenue: () =>
    apiClient.get<RevenueData>('/analytics/revenue'),

  getKPI: () =>
    apiClient.get<KPIData>('/analytics/kpi'),

  health: () =>
    apiClient.get('/analytics/health'),
};
