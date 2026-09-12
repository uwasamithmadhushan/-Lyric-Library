import { useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useUIStore } from '@/store';
import { colors as lightColors, darkColors, gradients, spacing, radii, fontFamily, fontWeight, fontSize, lineHeight, textVariants, shadows } from '@/theme';
import type { Theme } from '@/theme';

/**
 * Hook to access the app theme.
 * All component/screen code should pull design values from here.
 *
 * Usage:
 *   const { colors, spacing, textVariants } = useTheme();
 */
export function useTheme(): Theme {
  const themeMode = useUIStore((state) => state.themeMode);
  const systemScheme = useColorScheme();

  return useMemo(() => {
    const resolvedDark = themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');

    return {
      colors: resolvedDark ? darkColors : lightColors,
      gradients,
      spacing,
      radii,
      fontFamily,
      fontWeight,
      fontSize,
      lineHeight,
      textVariants,
      shadows,
    } as Theme;
  }, [systemScheme, themeMode]);
}

/**
 * Hook that returns a function to create theme-aware styles.
 *
 * Usage:
 *   const makeStyles = useThemedStyles();
 *   const styles = makeStyles((t) => ({
 *     container: { backgroundColor: t.colors.bgPrimary, padding: t.spacing.lg },
 *   }));
 */
export function useThemedStyles() {
  const currentTheme = useTheme();

  return useCallback(<T>(factory: (t: Theme) => T): T => {
    return factory(currentTheme);
  }, [currentTheme]);
}
