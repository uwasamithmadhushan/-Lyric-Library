import { useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useUIStore } from '@/store';
import {
  colors as lightColors,
  darkColors,
  gradients,
  spacing,
  radii,
  fontFamily,
  fontWeight,
  fontSize,
  lineHeight,
  textVariants,
  shadows,
  resolveBackgroundSurfaces,
} from '@/theme';
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
  const backgroundId = useUIStore((state) => state.backgroundId);
  const systemScheme = useColorScheme();

  return useMemo(() => {
    const resolvedDark =
      themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');
    const base = resolvedDark ? darkColors : lightColors;
    const surfaces = resolveBackgroundSurfaces(backgroundId, resolvedDark);

    return {
      colors: {
        ...base,
        bgPrimary: surfaces.bgPrimary,
        bgSecondary: surfaces.bgSecondary,
        bgElevated: surfaces.bgElevated,
        border: surfaces.border,
      },
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
  }, [backgroundId, systemScheme, themeMode]);
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

  return useCallback(
    <T>(factory: (t: Theme) => T): T => {
      return factory(currentTheme);
    },
    [currentTheme],
  );
}
