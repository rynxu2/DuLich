/**
 * Main Tabs — Bottom tab navigation for authenticated users
 * 
 * Tabs: Home | My Trips | Notifications | Profile
 * Each tab has nested stack navigators for sub-screens.
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import HomeScreen from '../screens/HomeScreen';
import TourDetailScreen from '../screens/TourDetailScreen';
import BookingScreen from '../screens/BookingScreen';
import MyTripsScreen from '../screens/MyTripsScreen';
import ItineraryScreen from '../screens/ItineraryScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReviewScreen from '../screens/ReviewScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import { theme } from '../theme';

// Home stack with nested tour details
export type HomeStackParamList = {
  HomeMain: undefined;
  TourDetail: { tourId: number };
  Booking: {
    tourId: number;
    tourTitle: string;
    tourPrice: number;
    departureId?: number;
    departureDate?: string;
  };
  Review: { tourId: number; tourTitle: string };
};

const HomeStackNav = createNativeStackNavigator<HomeStackParamList>();

function HomeStack() {
  return (
    <HomeStackNav.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <HomeStackNav.Screen name="HomeMain" component={HomeScreen} />
      <HomeStackNav.Screen name="TourDetail" component={TourDetailScreen} />
      <HomeStackNav.Screen name="Booking" component={BookingScreen} />
      <HomeStackNav.Screen name="Review" component={ReviewScreen} />
    </HomeStackNav.Navigator>
  );
}

// Trips stack
export type TripsStackParamList = {
  TripsMain: undefined;
  Itinerary: { bookingId: number; tourTitle: string };
};

const TripsStackNav = createNativeStackNavigator<TripsStackParamList>();

function TripsStack() {
  return (
    <TripsStackNav.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <TripsStackNav.Screen name="TripsMain" component={MyTripsScreen} />
      <TripsStackNav.Screen name="Itinerary" component={ItineraryScreen} />
    </TripsStackNav.Navigator>
  );
}

// Profile stack — includes edit profile, favorites, feedback
export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  Favorites: undefined;
  Feedback: undefined;
};

const ProfileStackNav = createNativeStackNavigator<ProfileStackParamList>();

function ProfileStack() {
  return (
    <ProfileStackNav.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <ProfileStackNav.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStackNav.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStackNav.Screen name="Favorites" component={FavoritesScreen} />
      <ProfileStackNav.Screen name="Feedback" component={FeedbackScreen} />
    </ProfileStackNav.Navigator>
  );
}

// Main tab navigator
export type MainTabParamList = {
  Home: undefined;
  MyTrips: undefined;
  Notifications: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            Home: 'compass-outline',
            MyTrips: 'bag-suitcase-outline',
            Notifications: 'bell-outline',
            Profile: 'account-outline',
          };
          return <Icon name={icons[route.name]} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textLight,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      })}>
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ tabBarLabel: 'Khám Phá' }}
      />
      <Tab.Screen
        name="MyTrips"
        component={TripsStack}
        options={{ tabBarLabel: 'Chuyến Đi' }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ tabBarLabel: 'Thông Báo' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{ tabBarLabel: 'Cá Nhân' }}
      />
    </Tab.Navigator>
  );
}
