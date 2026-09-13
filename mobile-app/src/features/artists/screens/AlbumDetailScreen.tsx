import React from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { AppScreen, AppText, SongRow, LoadingState, EmptyState, ErrorState } from '@/components';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ArtistsStackParamList } from '@/app/navigationTypes';
import { useSongs } from '@/hooks';
import { spacing } from '@/theme';
import { useTheme } from '@/hooks/useTheme';
import { useSavedStore } from '@/store';
import { toggleSavedLyric } from '@/store/savedLyricsActions';

type Props = Readonly<NativeStackScreenProps<ArtistsStackParamList, 'AlbumDetail'>>;

export default function AlbumDetailScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const { albumId, albumName, artistName } = route.params;

  const {
    data: songs = [],
    isLoading,
    isError,
    refetch,
  } = useSongs({ albumId, sort: 'title' });
  const savedMap = useSavedStore((state) => state.savedMap);

  if (isLoading) {
    return (
      <AppScreen>
        <LoadingState message="Loading album songs..." />
      </AppScreen>
    );
  }

  if (isError) {
    return (
      <AppScreen>
        <ErrorState message="Failed to load album songs" onRetry={refetch} />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        accessibilityHint="Returns to the previous screen"
      >
        <AppText variant="pageSubtitle" color={colors.textPrimary} style={styles.backChevron}>‹</AppText>
      </TouchableOpacity>

      <View style={styles.header}>
        <AppText variant="sectionTitle">{albumName}</AppText>
        <AppText variant="pageSubtitle" style={styles.subtitle}>
          {artistName} · {songs.length} songs
        </AppText>
      </View>

      {songs.length === 0 ? (
        <EmptyState title="No songs in this album" />
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <SongRow
              title={item.title}
              meta={`${item.artistName}${item.releaseYear ? ` • ${item.releaseYear}` : ''}`}
              favorited={Boolean(savedMap[item.id])}
              onFavoriteToggle={() =>
                toggleSavedLyric({
                  songId: item.id,
                  songTitle: item.title,
                  artistName: item.artistName,
                })
              }
              onPress={() =>
                navigation.navigate('Lyrics', {
                  songId: item.id,
                  songTitle: item.title,
                  artistName: item.artistName,
                })
              }
            />
          )}
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    zIndex: 10,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backChevron: {
    fontSize: 30,
    lineHeight: 32,
  },
  header: {
    paddingTop: spacing.massive,
    paddingBottom: spacing.lg,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  list: {
    paddingBottom: spacing.xxxl,
  },
});
