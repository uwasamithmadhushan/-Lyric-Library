import React from 'react';
import { View, TextInput, StyleSheet, Pressable, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { spacing, radii, shadows, textVariants } from '@/theme';
import { useTheme } from '@/hooks/useTheme';

interface AppSearchBarProps {
  /** Current value */
  value: string;
  /** Change handler */
  onChangeText: (text: string) => void;
  /** Placeholder when empty */
  placeholder?: string;
  /** Whether the bar is focused/active (styled differently per wireframe) */
  active?: boolean;
  /** Called when the input gains focus */
  onFocus?: () => void;
  /** Called when the input loses focus */
  onBlur?: () => void;
}

/**
 * Search bar matching wireframe style — either passive (border, icons) or active (purple border, shadow).
 *
 * Usage:
 *   <AppSearchBar value={query} onChangeText={setQuery} placeholder="Search artists..." />
 */
export function AppSearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  active = false,
  onFocus,
  onBlur,
}: Readonly<AppSearchBarProps>) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.bgElevated, borderColor: active ? colors.primary : colors.border },
        active ? styles.containerActive : styles.containerInactive,
      ]}
    >
      <Feather name="search" size={18} color={colors.textTertiary} />

      <TextInput
        style={[
          styles.input,
          {
            color: colors.textPrimary,
            // RN Web can inherit black text from the browser UA stylesheet in dark mode.
            ...(Platform.OS === 'web'
              ? ({ caretColor: colors.primary, outlineStyle: 'none' } as object)
              : null),
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        selectionColor={colors.primary}
        onFocus={onFocus}
        onBlur={onBlur}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        accessibilityLabel={placeholder}
      />

      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={8}
          accessibilityLabel="Clear search"
          accessibilityRole="button"
        >
          <View style={styles.clearBtn}>
            <View
              style={[styles.clearLine, styles.clearLine1, { backgroundColor: colors.textSecondary }]}
            />
            <View
              style={[styles.clearLine, styles.clearLine2, { backgroundColor: colors.textSecondary }]}
            />
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.xl,
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: spacing.md,
  },
  containerInactive: {
    borderWidth: 3,
    ...shadows.card,
  },
  containerActive: {
    borderWidth: 3,
    ...shadows.searchActive,
  },

  input: {
    flex: 1,
    ...textVariants.searchInput,
    padding: 0,
    margin: 0,
  },
  clearBtn: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearLine: {
    position: 'absolute',
    width: 14,
    height: 2,
    borderRadius: 1,
  },
  clearLine1: {
    transform: [{ rotate: '45deg' }],
  },
  clearLine2: {
    transform: [{ rotate: '-45deg' }],
  },
});
