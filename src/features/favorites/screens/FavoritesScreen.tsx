import React, { useState } from 'react';
import { View } from 'react-native';
import { AppScreen, AppText, SongRow } from '@/components';
import { getFavorites, removeFavorite } from '@/store/localState';
import { spacing } from '@/theme';

export default function FavoritesScreen() {
  const [list, setList] = useState(getFavorites());

  function handleRemove(id: string) {
    removeFavorite(id);
    setList(getFavorites());
  }

  return (
    <AppScreen>
      <View style={{ padding: spacing.xxl }}>
        <AppText variant="pageTitle">Favorites</AppText>
        <AppText variant="pageSubtitle">Saved songs and artists</AppText>

        <AppText variant="sectionHeader">Songs</AppText>
        {list.length === 0 ? (
          <AppText variant="pageSubtitle">No favorite lyrics yet. Save your favorite songs to access them quickly.</AppText>
        ) : (
          list.map(s => (
            <SongRow key={s.id} title={s.title} meta={s.artistName ?? ''} actionLabel="Remove" onPress={() => {}} onActionPress={() => handleRemove(s.id)} />
          ))
        )}
      </View>
    </AppScreen>
  );
}
