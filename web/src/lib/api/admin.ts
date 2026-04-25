/**
 * Admin API — Admin Service endpoints
 *
 * GET /admin/health         — Service health
 * GET /admin/system/status  — Full system status
 */
import apiClient from '../api';

export interface SystemStatus {
  services: number;
  infrastructure: {
    rabbitmq: string;
    redis: string;
    elasticsearch: string;
    postgres: string;
  };
}

export const adminApi = {
  health: () =>
    apiClient.get('/admin/health'),

  systemStatus: () =>
    apiClient.get<SystemStatus>('/admin/system/status'),
};
