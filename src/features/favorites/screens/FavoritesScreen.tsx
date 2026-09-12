import React from 'react';
import { View } from 'react-native';
import { AppScreen, AppText, SongRow } from '@/components';
import { useSavedStore } from '@/store';
import { spacing } from '@/theme';

/**
 * Legacy Favorites screen — mirrors Saved Lyrics collection.
 */
export default function FavoritesScreen() {
  const savedOrder = useSavedStore((state) => state.savedOrder);
  const savedMap = useSavedStore((state) => state.savedMap);
  const removeLyric = useSavedStore((state) => state.removeLyric);

  const list = savedOrder.map((id) => savedMap[id]).filter(Boolean);

  return (
    <AppScreen>
      <View style={{ padding: spacing.xxl }}>
        <AppText variant="pageTitle">Favorites</AppText>
        <AppText variant="pageSubtitle">Same as your Saved Lyrics collection</AppText>

        <AppText variant="sectionHeader">Songs</AppText>
        {list.length === 0 ? (
          <AppText variant="pageSubtitle">
            No saved lyrics yet. Tap ♥ on any song to save it here.
          </AppText>
        ) : (
          list.map((item) =>
            item ? (
              <SongRow
                key={item.songId}
                title={item.songTitle}
                meta={item.artistName}
                actionLabel="Remove"
                favorited
                onFavoriteToggle={() => removeLyric(item.songId)}
                onActionPress={() => removeLyric(item.songId)}
                onPress={() => undefined}
              />
            ) : null,
          )
        )}
      </View>
    </AppScreen>
  );
}
