/**
 * MainTabs — Premium bottom tab bar with active dot indicator
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
        tabBarIcon: ({ focused }) => {
          const cfg = TAB_CONFIG[route.name];
          return (
            <View style={styles.iconWrap}>
              {focused && <View style={styles.activeIndicator} />}
              <View style={[styles.iconCircle, focused && styles.iconCircleActive]}>
                <Icon
                  name={focused ? cfg.iconActive : cfg.icon}
                  size={22}
                  color={focused ? theme.colors.primary : theme.colors.textLight}
                />
              </View>
            </View>
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
    ...theme.shadows.xl,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
  },
  tabItem: {
    gap: 2,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
  },
  iconCircle: {
    width: 36,
    height: 32,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleActive: {
    backgroundColor: theme.colors.primaryMuted,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: theme.colors.textLight,
    marginTop: 1,
  },
  tabLabelActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
