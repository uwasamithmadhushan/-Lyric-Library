import React from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { QueryProvider } from '@/app/providers/QueryProvider';
import { AppNavigator } from '@/app/AppNavigator';
import { useTheme } from '@/hooks/useTheme';
import { useUIStore } from '@/store';

/**
 * App root — wraps providers around the navigator.
 * Interns should NOT modify this file unless instructed.
 */
export default function App() {
  const { colors } = useTheme();
  const themeMode = useUIStore((state) => state.themeMode);
  const isDark = themeMode === 'dark';

  return (
    <SafeAreaProvider>
      <QueryProvider>
        <NavigationContainer
          theme={isDark ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.bgPrimary, card: colors.bgElevated, text: colors.textPrimary, border: colors.border, primary: colors.primary, notification: colors.accent } } : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.bgPrimary, card: colors.bgElevated, text: colors.textPrimary, border: colors.border, primary: colors.primary, notification: colors.accent } }}
        >
          <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.bgPrimary} />
          <AppNavigator />
        </NavigationContainer>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
