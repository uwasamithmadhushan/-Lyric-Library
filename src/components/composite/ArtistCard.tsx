import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, radii, shadows, gradients } from '@/theme';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '../primitives/AppText';

interface ArtistCardProps {
  /** Artist display name */
  name: string;
  /** Number of songs */
  songCount: number;
  /** First letter for avatar */
  initial: string;
  /** Use alternate gradient (gradient2 vs gradient1) */
  alternateGradient?: boolean;
  /** Press handler (navigate to detail) */
  onPress: () => void;
  /** Whether artist is favorited */
  favorited?: boolean;
  /** Toggle favorite handler */
  onFavoriteToggle?: () => void;
}

/**
 * Artist grid card — avatar circle + name + song count.
 * Matches wireframe .artist-card layout.
 */
export const ArtistCard = memo(function ArtistCard({
  name,
  songCount,
  initial,
  alternateGradient = false,
  onPress,
  favorited = false,
  onFavoriteToggle,
}: Readonly<ArtistCardProps>) {
  const { colors } = useTheme();
  const selectedGradient = alternateGradient
    ? gradients.gradient2
    : gradients.gradient1;

  const [focused, setFocused] = React.useState(false);

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={onPress}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: colors.bgElevated, borderColor: colors.border },
          pressed && styles.pressed,
          focused && { borderColor: colors.primary, borderWidth: 1.25, transform: [{ translateY: -2 }] },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${songCount} songs`}
      >
        <LinearGradient
          colors={[...selectedGradient.colors]}
          start={selectedGradient.start}
          end={selectedGradient.end}
          style={styles.avatar}
        >
          <AppText variant="avatarLetterSmall" color={colors.white}>
            {initial}
          </AppText>
        </LinearGradient>
        <AppText variant="cardTitle" center numberOfLines={1}>
          {name}
        </AppText>
        <AppText variant="cardCaption" center numberOfLines={1}>
          {songCount} songs
        </AppText>
      </Pressable>

      <AppText
        variant="actionLabel"
        color={favorited ? colors.primary : colors.textTertiary}
        onPress={onFavoriteToggle}
        accessibilityRole="button"
        accessibilityLabel={favorited ? `Unfavorite ${name}` : `Add ${name} to favorites`}
        style={[styles.favBtn, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}
      >
        {favorited ? '♥' : '♡'}
      </AppText>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: 'relative',
  },
  card: {
    flex: 1,
    aspectRatio: 0.9,
    borderRadius: radii.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    margin: spacing.xs,
    ...shadows.card,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm + 2,
  },
  favBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    zIndex: 2,
  },
});
