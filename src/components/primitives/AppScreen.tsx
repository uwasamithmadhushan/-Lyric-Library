import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '@/theme';
import { useTheme } from '@/hooks/useTheme';

interface AppScreenProps {
  children: ReactNode;
  /** Override background color (default: bgPrimary) */
  backgroundColor?: string;
  /** Add horizontal padding (default: true) */
  padded?: boolean;
  /** Additional styles */
  style?: ViewStyle;
}

/**
 * Base screen wrapper — handles safe area insets and consistent background.
 *
 * Usage:
 *   <AppScreen>
 *     <AppText variant="pageTitle">Artists</AppText>
 *   </AppScreen>
 */
export function AppScreen({
  children,
  backgroundColor,
  padded = true,
  style,
}: Readonly<AppScreenProps>) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const dynamicStyles = StyleSheet.create({
    container: {
      backgroundColor: backgroundColor ?? colors.bgPrimary,
      paddingTop: insets.top + spacing.md,
      paddingBottom: insets.bottom + spacing.md,
    },
  });

  return (
    <View
      style={[
        styles.container,
        padded ? styles.padded : styles.unpadded,
        dynamicStyles.container,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.xxl,
  },
  unpadded: {
    paddingHorizontal: 0,
  },
});
