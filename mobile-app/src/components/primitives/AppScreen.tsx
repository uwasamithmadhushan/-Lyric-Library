import React, { ReactNode, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  ImageBackground,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '@/theme';
import { useTheme } from '@/hooks/useTheme';
import { useUIStore } from '@/store';

interface AppScreenProps {
  children: ReactNode;
  /** Override background color (default: bgPrimary) */
  backgroundColor?: string;
  /** Add horizontal padding (default: true) */
  padded?: boolean;
  /** Additional styles */
  style?: StyleProp<ViewStyle>;
}

/**
 * Base screen wrapper — handles safe area insets and consistent background.
 * Supports preset colors + optional user photo (with dark/light wash).
 */
export function AppScreen({
  children,
  backgroundColor,
  padded = true,
  style,
}: Readonly<AppScreenProps>) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const themeMode = useUIStore((state) => state.themeMode);
  const backgroundId = useUIStore((state) => state.backgroundId);
  const customBackgroundUri = useUIStore((state) => state.customBackgroundUri);
  const systemScheme = useColorScheme();

  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');
  const useCustomImage =
    backgroundId === 'custom' && Boolean(customBackgroundUri);

  const overlayColor = useMemo(
    () => (isDark ? 'rgba(11, 18, 32, 0.72)' : 'rgba(251, 253, 255, 0.62)'),
    [isDark],
  );

  const contentSurfaceStyle = useMemo(
    () => ({
      backgroundColor: useCustomImage
        ? 'transparent'
        : (backgroundColor ?? colors.bgPrimary),
      paddingTop: insets.top + spacing.md,
      paddingBottom: insets.bottom + spacing.md,
    }),
    [
      useCustomImage,
      backgroundColor,
      colors.bgPrimary,
      insets.top,
      insets.bottom,
    ],
  );

  const overlayStyle = useMemo(
    () => [styles.overlay, { backgroundColor: overlayColor }],
    [overlayColor],
  );

  const content = (
    <View
      style={[
        styles.container,
        padded ? styles.padded : styles.unpadded,
        contentSurfaceStyle,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!useCustomImage || !customBackgroundUri) {
    return content;
  }

  return (
    <ImageBackground
      source={{ uri: customBackgroundUri }}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={overlayStyle} />
      {content}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  padded: {
    paddingHorizontal: spacing.xxl,
  },
  unpadded: {
    paddingHorizontal: 0,
  },
});
