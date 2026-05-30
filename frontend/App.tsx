/**
 * DuLịch App — Travel Booking Mobile Application
 *
 * Root component wrapping the app with:
 * - SafeAreaProvider for safe area insets
 * - PaperProvider for Material Design components
 * - AuthProvider for global auth state management
 * - AppNavigator for navigation (Auth ↔ Main flow)
 *
 * @format
 */
import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppNavigator from './src/navigation/AppNavigator';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5 minutes — data stays fresh
      gcTime: 10 * 60 * 1000,       // 10 minutes — cache kept in memory
      refetchOnWindowFocus: false,   // Mobile app: no window focus events
      retry: 2,                      // Retry failed requests twice
    },
  },
});

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PaperProvider>
          <StatusBar
            barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            backgroundColor="transparent"
            translucent
          />
          <AppNavigator />
        </PaperProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
