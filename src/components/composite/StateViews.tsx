import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { spacing, shadows } from '@/theme';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '../primitives/AppText';
import { AppButton } from '../primitives/AppButton';

// ─── Loading State ───────────────────────────────────────────────

export function LoadingState({ message = 'Loading...' }: Readonly<{ message?: string }>) {
  const { colors } = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <AppText variant="pageSubtitle" color={colors.textTertiary} style={styles.message}>
        {message}
      </AppText>
    </View>
  );
}

// ─── Empty State ─────────────────────────────────────────────────

interface EmptyStateProps {
  title: string;
  subtitle?: string;
}

export function EmptyState({ title, subtitle }: Readonly<EmptyStateProps>) {
  return (
    <View style={styles.center}>
      <AppText variant="detailTitle" center>
        {title}
      </AppText>
      {subtitle && (
        <AppText variant="pageSubtitle" center style={styles.message}>
          {subtitle}
        </AppText>
      )}
    </View>
  );
}

// ─── Error State ─────────────────────────────────────────────────

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Something went wrong',
  onRetry,
}: Readonly<ErrorStateProps>) {
  return (
    <View style={styles.center}>
      <AppText variant="detailTitle" center>
        Oops!
      </AppText>
      <AppText variant="pageSubtitle" center style={styles.message}>
        {message}
      </AppText>
      {onRetry && (
        <AppButton label="Try Again" variant="primary" onPress={onRetry} style={styles.retryBtn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
  },
  message: {
    marginTop: spacing.md,
  },
  retryBtn: {
    marginTop: spacing.xxl,
    ...shadows.card,
  },
});
