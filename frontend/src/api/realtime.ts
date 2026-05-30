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

  getWebSocketUrl: (): string => {
    return 'https://7ffa-2405-4802-1f94-5c10-61bd-95b3-fcbf-a0cd.ngrok-free.app/ws';
  },
};
