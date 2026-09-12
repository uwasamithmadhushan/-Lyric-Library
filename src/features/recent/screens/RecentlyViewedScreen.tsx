import React from 'react';
import { View, FlatList } from 'react-native';
import { AppScreen, AppText, SongRow, AppButton } from '@/components';
import { getRecentlyViewed, clearRecentlyViewed } from '@/store/localState';
import { spacing } from '@/theme';

export default function RecentlyViewedScreen() {
  const items = getRecentlyViewed();

  return (
    <AppScreen>
      <View style={{ padding: spacing.xxl }}>
        <AppText variant="pageTitle">Recently Viewed</AppText>
        <AppText variant="pageSubtitle">Your recently opened lyrics</AppText>

        <AppButton label="Clear History" variant="tertiary" onPress={() => clearRecentlyViewed()} />

        <FlatList
          data={items}
          keyExtractor={i => i.songId}
          renderItem={({ item }) => (
            <SongRow title={item.songTitle} meta={item.artistName ?? ''} onPress={() => {}} />
          )}
        />
      </View>
    </AppScreen>
  );
}
