import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { spacing, radii } from '@/theme';
import { AppText } from './AppText';
import { useTheme } from '@/hooks/useTheme';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary';

interface AppButtonProps {
  /** Button label */
  label: string;
  /** Visual variant */
  variant?: ButtonVariant;
  /** Press handler */
  onPress: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state (shows spinner, disables press) */
  loading?: boolean;
  /** Additional container styles */
  style?: ViewStyle;
}

/**
 * Themed button with 3 variants matching wireframe action buttons.
 *
 * Usage:
 *   <AppButton label="Save" variant="primary" onPress={handleSave} />
 *   <AppButton label="Share" variant="secondary" onPress={handleShare} />
 */
export function AppButton({
  label,
  variant = 'primary',
  onPress,
  disabled = false,
  loading = false,
  style,
}: AppButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;
  const [focused, setFocused] = useState(false);

  let backgroundColor = colors.transparent;
  if (variant === 'primary') {
    backgroundColor = colors.primary;
  } else if (variant === 'secondary') {
    backgroundColor = colors.primaryLight;
  }

  const shadowStyle = {
    boxShadow: focused
      ? '0px 4px 16px rgba(0,0,0,0.12)'
      : '0px 4px 8px rgba(0,0,0,0.06)',
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor,
          borderColor: colors.border,
          borderWidth: variant === 'tertiary' ? 1 : 0,
        },
        shadowStyle,
        pressed && !isDisabled && styles.pressed,
        focused && !isDisabled && styles.focused,
        isDisabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.white : colors.primary}
        />
      ) : (
        <AppText
          variant="actionLabel"
          color={variant === 'primary' ? colors.white : colors.primary}
        >
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  pressed: {
    transform: [{ scale: 0.995 }],
  },
  focused: {
    transform: [{ scale: 1.01 }],
  },
  disabled: {
    opacity: 0.5,
  },
});
