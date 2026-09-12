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
 * Song list row — title + meta on left, action button on right.
 * Matches wireframe .song-item layout.
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
    <View style={styles.row}>
      <Pressable
        onPress={onPress}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={({ pressed }) => [
          styles.info,
          { backgroundColor: colors.bgElevated, borderColor: colors.border },
          pressed && styles.pressed,
          focused && { borderColor: colors.primary, borderWidth: 1.5 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Open song: ${title}. Details: ${meta}.`}
      >
        <AppText variant="itemTitle" numberOfLines={1}>
          {title}
        </AppText>
        <AppText variant="itemMeta" numberOfLines={1}>
          {meta}
        </AppText>
      </Pressable>

      <View style={[styles.rightActions, focused && styles.focusedActions]}>
        <Pressable
          onPress={onActionPress ?? onPress}
          hitSlop={8}
          style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel} lyrics for ${title}`}
        >
          <AppText variant="actionLabel" color={colors.primary}>
            {actionLabel}
          </AppText>
        </Pressable>

        <Pressable
          onPress={onFavoriteToggle}
          hitSlop={8}
          style={({ pressed }) => [styles.favoriteBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={favorited ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
        >
          <AppText variant="actionLabel" color={favorited ? colors.primary : colors.textSecondary}>
            {favorited ? '♥' : '♡'}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  pressed: {
    opacity: 0.9,
  },
  info: {
    flex: 1,
    marginRight: spacing.md,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  focusedActions: {
    // slight lift when row focused
    transform: [{ translateY: -2 }],
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
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
