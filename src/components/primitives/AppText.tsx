import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { colors as lightColors, textVariants, TextVariant } from '@/theme';
import { useTheme } from '@/hooks/useTheme';

interface AppTextProps extends TextProps {
  /** Typography variant — see theme/typography.ts for available variants */
  variant?: TextVariant;
  /** Override color (default: textPrimary, or textTertiary for meta variants) */
  color?: string;
  /** Center text */
  center?: boolean;
  children: React.ReactNode;
}

/**
 * Themed text component — enforces typography standards.
 * Always use this instead of raw <Text>.
 *
 * Usage:
 *   <AppText variant="pageTitle">Artists</AppText>
 *   <AppText variant="itemMeta" color={colors.textTertiary}>47 songs</AppText>
 */
export function AppText({
  variant = 'pageSubtitle',
  color,
  center,
  style,
  children,
  ...rest
}: AppTextProps) {
  const { colors } = useTheme();
  const variantStyle = textVariants[variant];

  const resolvedColor = color ?? getDefaultColor(variant, colors);

  const composedStyle: TextStyle = {
    ...variantStyle,
    color: resolvedColor,
    textAlign: center ? 'center' : undefined,
  };

  return (
    <Text
      style={[composedStyle, style]}
      accessibilityRole={variant === 'pageTitle' ? 'header' : undefined}
      {...rest}
    >
      {children}
    </Text>
  );
}

/** Maps certain variants to appropriate default colors */
type PaletteColors = typeof lightColors;

function getDefaultColor(variant: TextVariant, palette: PaletteColors): string {
  switch (variant) {
    case 'itemMeta':
    case 'cardCaption':
    case 'verseLabel':
    case 'sectionHeader':
    case 'preview':
      return palette.textTertiary;
    case 'pageSubtitle':
      return palette.textSecondary;
    default:
      return palette.textPrimary;
  }
}
