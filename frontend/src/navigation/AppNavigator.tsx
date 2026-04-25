/**
 * App Navigator — Root navigation stack
 */
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { wsService } from '../services/websocket';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import { theme } from '../theme';

// Screen Imports
import TourDetailScreen from '../screens/TourDetailScreen';
import BookingScreen from '../screens/BookingScreen';
import PaymentScreen from '../screens/PaymentScreen';
import PaymentHistoryScreen from '../screens/PaymentHistoryScreen';
import PaymentDetailScreen from '../screens/PaymentDetailScreen';
import ReviewScreen from '../screens/ReviewScreen';
import ItineraryScreen from '../screens/ItineraryScreen';
import TrackingScreen from '../screens/TrackingScreen';
import ChatScreen from '../screens/ChatScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import SettingsScreen from '../screens/SettingsScreen';

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
  TourDetail: { tourId: number };
  Booking: {
    tourId: number;
    tourTitle: string;
    tourPrice: number;
    departureId?: number;
    departureDate?: string;
  };
  Payment: { bookingId: number };
  PaymentHistory: undefined;
  PaymentDetail: { paymentId: number };
  Review: { tourId: number; tourTitle: string };
  Itinerary: { bookingId: number; tourTitle: string };
  Tracking: { tourId: number };
  Chat: { roomId: string };
  Notifications: undefined;
  EditProfile: undefined;
  Feedback: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { isLoading, isAuthenticated, restoreSession } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Handle WebSocket Connection
  useEffect(() => {
    if (isAuthenticated) {
      wsService.connect();
    } else {
      wsService.disconnect();
    }
    return () => wsService.disconnect();
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="TourDetail" component={TourDetailScreen} />
            <Stack.Screen name="Booking" component={BookingScreen} />
            <Stack.Screen name="Payment" component={PaymentScreen} />
            <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
            <Stack.Screen name="PaymentDetail" component={PaymentDetailScreen} />
            <Stack.Screen name="Review" component={ReviewScreen} />
            <Stack.Screen name="Itinerary" component={ItineraryScreen} />
            <Stack.Screen name="Tracking" component={TrackingScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="Feedback" component={FeedbackScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
});
