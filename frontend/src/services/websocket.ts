import { Client } from '@stomp/stompjs';
// @ts-ignore
import SockJS from 'sockjs-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TextEncoder Polyfill for STOMP over React Native
const { TextEncoder, TextDecoder } = require('text-encoding');
// @ts-ignore
if (typeof global.TextEncoder === 'undefined') {
  // @ts-ignore
  global.TextEncoder = TextEncoder;
}
// @ts-ignore
if (typeof global.TextDecoder === 'undefined') {
  // @ts-ignore
  global.TextDecoder = TextDecoder;
}

const WS_BASE_URL = __DEV__
  ? 'http://10.0.2.2:8080/ws'
  : 'http://localhost:8080/ws';

class WebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, any> = new Map();
  private isConnected = false;

  public async connect() {
    if (this.isConnected && this.client?.active) return;

    const token = await AsyncStorage.getItem('auth_token');

    this.client = new Client({
      webSocketFactory: () => new SockJS(WS_BASE_URL),
      connectHeaders: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      debug: (str) => {
        // console.log('[STOMP]: ', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      this.isConnected = true;
      console.log('✅ STOMP WebSocket Connected');
      this.restoreSubscriptions();
    };

    this.client.onStompError = (frame) => {
      console.error('❌ STOMP Broker Error: ', frame.headers['message']);
      console.error('Details: ', frame.body);
    };

    this.client.onWebSocketClose = () => {
      this.isConnected = false;
      console.log('⚠️ STOMP WebSocket Disconnected');
    };

    this.client.activate();
  }

  public disconnect() {
    if (this.client && this.client.active) {
      this.client.deactivate();
      this.isConnected = false;
      console.log('✅ STOMP WebSocket Disconnected gracefully');
    }
  }

  public subscribe(destination: string, callback: (message: any) => void): string {
    const subId = `${destination}_${Date.now()}`;
    
    // Store subscription intent in case of reconnects
    this.subscriptions.set(subId, { destination, callback });

    if (this.isConnected && this.client) {
      this.doSubscribe(subId, destination, callback);
    }
    
    return subId;
  }

  public unsubscribe(subId: string) {
    const sub = this.subscriptions.get(subId);
    if (sub && sub.stompSubscription) {
      sub.stompSubscription.unsubscribe();
    }
    this.subscriptions.delete(subId);
  }

  public publish(destination: string, body: any) {
    if (this.isConnected && this.client) {
      this.client.publish({
        destination,
        body: typeof body === 'string' ? body : JSON.stringify(body),
      });
    } else {
      console.warn('⚠️ STOMP client not connected, cannot publish.');
    }
  }

  private restoreSubscriptions() {
    this.subscriptions.forEach((sub, subId) => {
      this.doSubscribe(subId, sub.destination, sub.callback);
    });
  }

  private doSubscribe(subId: string, destination: string, callback: (msg: any) => void) {
    const stompSub = this.client!.subscribe(destination, (message) => {
      try {
        const body = JSON.parse(message.body);
        callback(body);
      } catch {
        callback(message.body);
      }
    });
    
    // Update map with active stomp subscription object so we can unsubscribe later
    const existing = this.subscriptions.get(subId);
    if (existing) {
      existing.stompSubscription = stompSub;
    }
  }
}

export const wsService = new WebSocketService();
