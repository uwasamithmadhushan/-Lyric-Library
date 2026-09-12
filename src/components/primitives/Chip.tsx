import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { spacing, radii } from '@/theme';
import { AppText } from './AppText';
import { useTheme } from '@/hooks/useTheme';

interface ChipProps {
  /** Chip label */
  label: string;
  /** Whether this chip is selected */
  active?: boolean;
  /** Press handler */
  onPress: () => void;
  /** Additional styles */
  style?: ViewStyle;
}

/**
 * Filter chip / pill button — matches wireframe filter-tab styling.
 * Active state: purple bg + white text. Inactive: white bg + gray border.
 *
 * Usage:
 *   <Chip label="A-Z" active={sort === 'a-z'} onPress={() => setSort('a-z')} />
 */
export function Chip({ label, active = false, onPress, style }: Readonly<ChipProps>) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: active ? colors.primary : colors.bgElevated, borderColor: active ? colors.primary : colors.border },
        pressed && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      <AppText
        variant="chipLabel"
        color={active ? colors.white : colors.textSecondary}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: 1,
    minWidth: 64,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
