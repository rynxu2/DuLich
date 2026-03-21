/**
 * Realtime API — Real-time Operation Service endpoints
 *
 * WebSocket: ws://HOST:8080/ws  — STOMP over SockJS
 * GET /realtime/health          — Service health
 *
 * WebSocket Topics:
 *   /topic/chat       — Group chat messages
 *   /topic/tracking   — Live GPS tracking
 *
 * Send to:
 *   /app/chat.send       — Send chat message
 *   /app/tracking.update  — Update GPS location
 */
import apiClient from './client';

export interface ChatMessage {
  userId: number;
  username: string;
  message: string;
  tourId?: number;
  bookingId?: number;
  timestamp: number;
}

export interface TrackingUpdate {
  userId: number;
  tourId: number;
  latitude: number;
  longitude: number;
  timestamp: number;
}

export const realtimeApi = {
  health: () =>
    apiClient.get('/realtime/health'),

  // WebSocket connection URL
  getWebSocketUrl: (): string => {
    const baseUrl = __DEV__
      ? 'http://10.0.2.2:8080'
      : 'http://localhost:8080';
    return `${baseUrl}/ws`;
  },
};
