import React, { useState, useMemo } from 'react';
import { View, StyleSheet, SectionList, useWindowDimensions, Platform, FlatList } from 'react-native';
import { AppScreen, AppText, AppSearchBar, Chip, SongRow, LoadingState, EmptyState } from '@/components';
import { useSavedStore } from '@/store';
import { toggleSavedLyric } from '@/store/savedLyricsActions';
import { useSongs } from '@/hooks/queries/useSongs';
import { groupByInitial } from '@/utils/groupers';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SongsStackParamList } from '@/app/navigationTypes';
import type { SongSortMode, Song } from '@/types';
import { spacing } from '@/theme';
import { useTheme } from '@/hooks/useTheme';

/**
 * Songs Browse Screen.
 *
 * Features:
 *  - Search bar + sort/filter chips (A-Z / Popular / Recent / Genre)
 *  - Grouped SectionList with sticky headers
 *  - Navigate to LyricsScreen on song tap
 */

/**
 * Supported sort modes for SongsScreen
 */
type SongSortKey = SongSortMode;

const SORT_OPTIONS: { key: SongSortKey; label: string }[] = [
  { key: 'title', label: 'A-Z' },
  { key: 'popular', label: 'Popular' },
  { key: 'recent', label: 'Recent' },
  { key: 'genre', label: 'Genre' },
];


/**
 * SongsScreen displays a searchable, filterable, grouped list of songs.
 * - Search bar at top
 * - Filter chips for sort modes
 * - Grouped list by first letter with sticky section headers
 * - SongRow for each song, navigates to LyricsScreen
 * - Loading/empty states
 */
export default function SongsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<SongsStackParamList>>();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 375;
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SongSortKey>('title');
  const savedMap = useSavedStore((state) => state.savedMap);
  const screenStyle = { ...styles.container, paddingHorizontal: width * 0.04 };

  const { data: songs, isLoading, isError } = useSongs({ sort, query });

  // Dedupe by id in case repository returns overlapping entries
  const filteredSongs = useMemo(() => {
    const list = songs ?? [];
    const seen = new Set<string>();
    return list.filter((song) => {
      if (!song.id || seen.has(song.id)) return false;
      seen.add(song.id);
      return true;
    });
  }, [songs]);
  // group songs by first letter while preserving the original Song object so we can act on favorites
  const grouped = useMemo(() => {
    if (!filteredSongs.length) return [] as { title: string; data: Song[] }[];
    // ensure title is string for grouping
    const prepared: Song[] = filteredSongs.map((s: Song) => ({ ...s, title: s.title || '' }));
    const groupedObj = groupByInitial(prepared as unknown as Array<Record<string, string>>, 'title');
    return Object.keys(groupedObj)
      .sort((a, b) => a.localeCompare(b))
      .map((letter) => ({ title: letter, data: groupedObj[letter] as unknown as Song[] }));
  }, [filteredSongs]);

  return (
    <AppScreen style={screenStyle}>
      <AppText variant="pageSubtitle" style={[styles.subtitle, isSmallScreen && styles.subtitleSmall]}>
        Browse all available lyrics
      </AppText>

      <View style={styles.searchBar}>
        <AppSearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search songs or artists..."
          active={!!query}
        />
      </View>

      <View style={styles.chipRowWrapper}> 
        {/* Horizontal filter chips for sort modes, scrollable */}
        <FlatList
          data={SORT_OPTIONS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.key}
          renderItem={({ item }) => (
            <Chip
              label={item.label}
              active={sort === item.key}
              onPress={() => setSort(item.key)}
              style={styles.chip}
            />
          )}
          contentContainerStyle={styles.chipRow}
        />
      </View>

      {isLoading && (
        <LoadingState message="Loading songs..." />
      )}
      {!isLoading && isError && (
        <EmptyState title="Failed to load songs." />
      )}
      {!isLoading && !isError && (
        <SectionList
          sections={grouped}
          keyExtractor={item => item.id}
          renderSectionHeader={({ section: { title } }) => (
            <View style={[styles.sectionHeaderContainer, { backgroundColor: colors.bgPrimary }]}>
              <AppText variant="sectionHeader" color={colors.textTertiary} style={styles.sectionHeader}>{title}</AppText>
            </View>
          )}
          renderItem={({ item }) => (
            <SongRow
              title={item.title}
              meta={item.artistName}
              favorited={Boolean(savedMap[item.id])}
              onFavoriteToggle={() =>
                toggleSavedLyric({
                  songId: item.id,
                  songTitle: item.title,
                  artistName: item.artistName,
                })
              }
              onPress={() => navigation.navigate('Lyrics', {
                songId: item.id,
                songTitle: item.title,
                artistName: item.artistName,
              })}
            />
          )}
          contentContainerStyle={grouped.length === 0 ? styles.emptyList : styles.songList}
          ListEmptyComponent={<EmptyState title="No songs found." />}
          stickySectionHeadersEnabled={true}
          showsVerticalScrollIndicator={false}
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  subtitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  subtitleSmall: {
    fontSize: 14,
  },
  searchBar: {
    marginBottom: 12,
  },  chipRowWrapper: {
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 0,
    minHeight: 40,
  },
  chip: {
    marginRight: 4,
    minWidth: 72,
    borderRadius: 20,
  },
  sectionHeader: {
    marginLeft: spacing.sm,
  },
  sectionHeaderContainer: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
    zIndex: 2,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  songList: {
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
});
