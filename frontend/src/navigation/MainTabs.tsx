/**
 * MainTabs — Clean bottom tab bar with labels (Traveloka/Airbnb style)
 */
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import MyTripsScreen from '../screens/MyTripsScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { theme } from '../theme';

export type MainTabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  MyTripsTab: undefined;
  FavoritesTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_CONFIG: Record<string, { icon: string; iconActive: string; label: string }> = {
  HomeTab:      { icon: 'compass-outline',       iconActive: 'compass',       label: 'Khám phá' },
  SearchTab:    { icon: 'magnify',               iconActive: 'magnify',       label: 'Tìm kiếm' },
  MyTripsTab:   { icon: 'bag-suitcase-outline',  iconActive: 'bag-suitcase',  label: 'Chuyến đi' },
  FavoritesTab: { icon: 'heart-outline',         iconActive: 'heart',         label: 'Yêu thích' },
  ProfileTab:   { icon: 'account-outline',       iconActive: 'account',       label: 'Cá nhân' },
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, size }) => {
          const cfg = TAB_CONFIG[route.name];
          return (
            <Icon
              name={focused ? cfg.iconActive : cfg.icon}
              size={focused ? 25 : 23}
              color={focused ? theme.colors.primary : theme.colors.textLight}
            />
          );
        },
        tabBarLabel: ({ focused }) => {
          const cfg = TAB_CONFIG[route.name];
          return (
            <Text style={[
              styles.tabLabel,
              focused && styles.tabLabelActive,
            ]}>
              {cfg.label}
            </Text>
          );
        },
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
      })}>
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="SearchTab" component={SearchScreen} />
      <Tab.Screen name="MyTripsTab" component={MyTripsScreen} />
      <Tab.Screen name="FavoritesTab" component={FavoritesScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    height: Platform.OS === 'ios' ? 84 : 62,
    paddingBottom: Platform.OS === 'ios' ? 24 : 6,
    paddingTop: 6,
    elevation: 0,
  },
  tabItem: {
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: theme.colors.textLight,
    marginTop: 1,
  },
  tabLabelActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});
