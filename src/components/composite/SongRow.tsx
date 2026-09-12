import React, { memo, useState } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { spacing, radii, shadows } from '@/theme';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '../primitives/AppText';

interface SongRowProps {
  /** Song title */
  title: string;
  /** Metadata line (artist, album, year) */
  meta: string;
  /** Right-side action label (default: "View") */
  actionLabel?: string;
  /** Press handler for the whole row */
  onPress: () => void;
  /** Press handler for the action button (defaults to onPress) */
  onActionPress?: () => void;
  /** Whether this song is favorited */
  favorited?: boolean;
  /** Toggle favorite handler */
  onFavoriteToggle?: () => void;
}

/**
 * Song list row — single elevated card: title + meta | View + heart.
 */
export const SongRow = memo(function SongRow({
  title,
  meta,
  actionLabel = 'View',
  onPress,
  onActionPress,
  favorited = false,
  onFavoriteToggle,
}: Readonly<SongRowProps>) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.bgElevated,
          borderColor: focused ? colors.primary : colors.border,
          borderWidth: focused ? 1.5 : 1,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={({ pressed }) => [styles.info, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Open song: ${title}. Details: ${meta}.`}
      >
        <AppText variant="itemTitle" numberOfLines={1} color={colors.textPrimary}>
          {title}
        </AppText>
        <AppText variant="itemMeta" numberOfLines={1} color={colors.textTertiary}>
          {meta}
        </AppText>
      </Pressable>

      <View style={styles.rightActions}>
        <Pressable
          onPress={onActionPress ?? onPress}
          hitSlop={8}
          style={({ pressed }) => [
            styles.actionBtn,
            {
              backgroundColor: colors.bgSecondary,
              borderColor: colors.border,
            },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel} lyrics for ${title}`}
        >
          <AppText variant="actionLabel" color={colors.textSecondary}>
            {actionLabel}
          </AppText>
        </Pressable>

        <Pressable
          onPress={onFavoriteToggle}
          disabled={!onFavoriteToggle}
          hitSlop={8}
          style={({ pressed }) => [
            styles.favoriteBtn,
            pressed && styles.pressed,
            !onFavoriteToggle && styles.favoriteBtnDisabled,
          ]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !onFavoriteToggle }}
          accessibilityLabel={
            favorited ? `Remove ${title} from favorites` : `Add ${title} to favorites`
          }
        >
          <AppText
            variant="actionLabel"
            color={favorited ? colors.primary : colors.textSecondary}
            style={styles.favoriteIcon}
          >
            {favorited ? '♥' : '♡'}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  pressed: {
    opacity: 0.9,
  },
  info: {
    flex: 1,
    marginRight: spacing.md,
    gap: 2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteBtn: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteIcon: {
    fontSize: 18,
    lineHeight: 22,
  },
  favoriteBtnDisabled: {
    opacity: 0.35,
  },
});
