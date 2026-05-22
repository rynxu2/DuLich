/**
 * Push Notification Service — Firebase Cloud Messaging + Notifee
 *
 * Handles:
 * - Permission requesting
 * - FCM token registration
 * - Foreground notification display (local notification via Notifee)
 * - Background message handling
 * - Notification tap → navigation
 */
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidStyle } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationsApi } from '../api/notifications';
import { Platform } from 'react-native';

const FCM_TOKEN_KEY = 'fcm_device_token';
const CHANNEL_ID = 'dulich_bookings';

class PushNotificationService {
  private navigationRef: any = null;

  setNavigationRef(ref: any) {
    this.navigationRef = ref;
  }

  /**
   * Create Android notification channel (required for Android 8+)
   */
  async createChannel() {
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Đặt Tour & Thanh Toán',
      description: 'Thông báo đặt tour, thanh toán, và nhắc nhở',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<boolean> {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('✅ Notification permission granted');
    } else {
      console.warn('⚠️ Notification permission denied');
    }
    return enabled;
  }

  /**
   * Get FCM token and register with backend
   */
  async registerToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      const oldToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);

      if (token && token !== oldToken) {
        await notificationsApi.registerDeviceToken(token, Platform.OS.toUpperCase());
        await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
        console.log('✅ FCM token registered:', token.substring(0, 20) + '...');
      }

      return token;
    } catch (error) {
      console.warn('⚠️ FCM token registration failed:', error);
      return null;
    }
  }

  /**
   * Remove FCM token from backend (on logout)
   */
  async unregisterToken() {
    try {
      const token = await AsyncStorage.getItem(FCM_TOKEN_KEY);
      if (token) {
        await notificationsApi.removeDeviceToken(token);
        await AsyncStorage.removeItem(FCM_TOKEN_KEY);
        console.log('✅ FCM token removed');
      }
    } catch (error) {
      console.warn('⚠️ FCM token removal failed:', error);
    }
  }

  /**
   * Display local notification when app is in foreground
   */
  async displayLocalNotification(title: string, body: string, data?: Record<string, string>) {
    await notifee.displayNotification({
      title,
      body,
      android: {
        channelId: CHANNEL_ID,
        smallIcon: 'ic_notification',
        color: '#0f766e',
        importance: AndroidImportance.HIGH,
        pressAction: { id: 'default' },
        style: body.length > 50
          ? { type: AndroidStyle.BIGTEXT, text: body }
          : undefined,
      },
      data,
    });
  }

  /**
   * Setup foreground message listener
   */
  setupForegroundListener() {
    return messaging().onMessage(async (remoteMessage) => {
      console.log('📩 FCM Foreground message:', remoteMessage);

      const { notification, data } = remoteMessage;
      if (notification) {
        await this.displayLocalNotification(
          notification.title || 'DuLich',
          notification.body || '',
          data as Record<string, string>,
        );
      }
    });
  }

  /**
   * Setup token refresh listener
   */
  setupTokenRefreshListener() {
    return messaging().onTokenRefresh(async (newToken) => {
      console.log('🔄 FCM token refreshed');
      await AsyncStorage.setItem(FCM_TOKEN_KEY, newToken);
      try {
        await notificationsApi.registerDeviceToken(newToken, Platform.OS.toUpperCase());
      } catch (e) {
        console.warn('⚠️ Token refresh registration failed:', e);
      }
    });
  }

  /**
   * Handle notification opened (user tapped notification)
   */
  setupNotificationOpenedListener() {
    // When app is in background and user taps notification
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('👆 Notification opened (background):', remoteMessage);
      this.handleNotificationNavigation(remoteMessage.data);
    });

    // When app was killed and opened via notification
    messaging().getInitialNotification().then((remoteMessage) => {
      if (remoteMessage) {
        console.log('👆 Notification opened (killed):', remoteMessage);
        this.handleNotificationNavigation(remoteMessage.data);
      }
    });
  }

  /**
   * Navigate based on notification data
   */
  private handleNotificationNavigation(data?: Record<string, string>) {
    if (!data || !this.navigationRef?.isReady()) return;

    const { type, referenceType, referenceId } = data;

    switch (referenceType) {
      case 'BOOKING':
        // Navigate to MyTrips or BookingDetail
        this.navigationRef.navigate('MainTab', { screen: 'MyTrips' });
        break;
      case 'PAYMENT':
        this.navigationRef.navigate('PaymentDetail', { paymentId: Number(referenceId) });
        break;
      case 'TOUR':
        this.navigationRef.navigate('TourDetail', { tourId: Number(referenceId) });
        break;
      default:
        this.navigationRef.navigate('MainTab', { screen: 'Notifications' });
    }
  }

  /**
   * Full initialization (call after login)
   */
  async initialize() {
    await this.createChannel();
    const hasPermission = await this.requestPermission();
    if (hasPermission) {
      await this.registerToken();
      this.setupForegroundListener();
      this.setupTokenRefreshListener();
      this.setupNotificationOpenedListener();
    }
  }
}

export const pushService = new PushNotificationService();

/**
 * Background message handler — MUST be registered at app level (index.js)
 */
export function setupBackgroundHandler() {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('📩 FCM Background message:', remoteMessage);
    // Android auto-displays the notification, no need to show local
  });
}
