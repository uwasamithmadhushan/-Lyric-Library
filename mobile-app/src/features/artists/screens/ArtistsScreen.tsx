import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
  Pressable,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppScreen, AppText, AppSearchBar, Chip, ArtistCard, AppButton } from '@/components';
import { LoadingState, ErrorState, EmptyState } from '@/components/composite/StateViews';
import { useArtists } from '@/hooks';
import { useTheme } from '@/hooks/useTheme';
import { enrichArtistImage } from '@/services/deezer/deezerApi';
import { mapPool } from '@/data/catalog/featuredCatalog';
import { useSavedStore } from '@/store';
import { toggleSavedArtist } from '@/store/savedLyricsActions';
import { spacing, radii } from '@/theme';
import type { ArtistsStackParamList } from '@/app/navigationTypes';
import type { Artist } from '@/types';

type Props = NativeStackScreenProps<ArtistsStackParamList, 'ArtistsList'>;

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const PAGE_SIZE = 30;
const EMPTY_ARTISTS: Artist[] = [];
const SEARCH_DEBOUNCE_MS = 350;
const MIN_SEARCH_CHARS = 2;
const MAX_SUGGESTIONS = 8;

function getArtistGridColumns(width: number): number {
  if (width >= 1200) return 5;
  if (width >= 900) return 4;
  if (width >= 600) return 3;
  return 2;
}

function avatarInitial(name: string): string {
  const cleaned = name.replace(/^[^A-Za-z0-9]+/, '');
  return (cleaned.charAt(0) || name.charAt(0) || '?').toUpperCase();
}

/**
 * Artists Browse Screen — searchable grid with suggestions, A–Z filters, pagination.
 */
export default function ArtistsScreen({ navigation }: Readonly<Props>) {
  const { colors } = useTheme();
  const isFocused = useIsFocused();
  const { width } = useWindowDimensions();
  const numColumns = getArtistGridColumns(width);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [page, setPage] = useState(1);
  const [displayArtists, setDisplayArtists] = useState<Artist[]>([]);
  const artistMap = useSavedStore((state) => state.artistMap);

  // Debounce typed name before hitting iTunes.
  useEffect(() => {
    const trimmed = searchInput.trim();
    if (!trimmed) {
      setDebouncedQuery('');
      return undefined;
    }
    const timer = setTimeout(() => setDebouncedQuery(trimmed), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const activeSearch = debouncedQuery.length >= MIN_SEARCH_CHARS ? debouncedQuery : '';
  const browseAll = !activeSearch && !selectedLetter;
  const isTypingSearch = searchInput.trim().length > 0;

  const { data, isLoading, isFetching, isError, refetch } = useArtists({
    query: activeSearch || undefined,
    startsWith: !activeSearch && selectedLetter ? selectedLetter : undefined,
    browseAll,
  });
  const artists = data ?? EMPTY_ARTISTS;

  const suggestions = useMemo(() => {
    const typed = searchInput.trim().toLowerCase();
    if (typed.length < MIN_SEARCH_CHARS) return EMPTY_ARTISTS;
    // Repository already matches artist name OR song title.
    return artists.slice(0, MAX_SUGGESTIONS);
  }, [artists, searchInput]);

  const showSuggestions =
    isSearchActive && searchInput.trim().length >= MIN_SEARCH_CHARS;

  const totalArtists = artists.length;
  const totalPages = Math.max(1, Math.ceil(totalArtists / PAGE_SIZE) || 1);

  useEffect(() => {
    setPage(1);
  }, [activeSearch, selectedLetter]);

  useEffect(() => {
    setPage((current) => (current > totalPages ? totalPages : current));
  }, [totalPages]);

  const pageArtists = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return artists.slice(start, start + PAGE_SIZE);
  }, [artists, page]);

  const pageArtistKey = useMemo(
    () => pageArtists.map((artist) => artist.id).join('|'),
    [pageArtists],
  );

  useEffect(() => {
    let cancelled = false;
    const currentPageArtists = artists.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    setDisplayArtists(currentPageArtists);

    const needsEnrichment = currentPageArtists.some((artist) => !artist.imageUrl);
    if (!needsEnrichment || currentPageArtists.length === 0) {
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      const enriched = await mapPool(currentPageArtists, 6, async (artist) => {
        if (artist.imageUrl) return artist;
        try {
          const media = await enrichArtistImage(artist.name);
          if (!media.imageUrl) return artist;
          return {
            ...artist,
            imageUrl: media.imageUrl,
          };
        } catch {
          return artist;
        }
      });
      if (!cancelled) setDisplayArtists(enriched);
    })();

    return () => {
      cancelled = true;
    };
  }, [artists, page, pageArtistKey]);

  const handleSearchChange = (text: string) => {
    setSearchInput(text);
    if (text.trim()) {
      setSelectedLetter('');
    }
  };

  const handleLetterPress = (letter: string) => {
    setSearchInput('');
    setDebouncedQuery('');
    setSelectedLetter((previous) => (previous === letter ? '' : letter));
    setIsSearchActive(false);
  };

  const handleSuggestionPress = (artist: Artist) => {
    setIsSearchActive(false);
    setSearchInput(artist.name);
    setDebouncedQuery(artist.name);
    navigation.navigate('ArtistDetail', {
      artistId: artist.id,
      artistName: artist.name,
    });
  };

  const handleArtistPress = (artist: Artist) => {
    navigation.navigate('ArtistDetail', {
      artistId: artist.id,
      artistName: artist.name,
    });
  };

  const renderArtistCard = ({ item, index }: { item: Artist; index: number }) => (
    <ArtistCard
      name={item.name}
      songCount={item.songCount}
      initial={avatarInitial(item.name)}
      imageUrl={item.imageUrl}
      alternateGradient={index % 2 === 1}
      favorited={Boolean(artistMap[item.id])}
      onFavoriteToggle={() =>
        toggleSavedArtist({
          artistId: item.id,
          artistName: item.name,
          songCount: item.songCount,
          imageUrl: item.imageUrl,
        })
      }
      onPress={() => handleArtistPress(item)}
    />
  );

  const showInitialLoader = isLoading && artists.length === 0 && !isTypingSearch;

  if (showInitialLoader) {
    return (
      <AppScreen>
        <AppText variant="pageSubtitle" style={styles.subtitle}>
          Browse lyrics by artist
        </AppText>
        <LoadingState message="Loading artists..." />
      </AppScreen>
    );
  }

  if (isError && artists.length === 0) {
    return (
      <AppScreen>
        <AppText variant="pageSubtitle" style={styles.subtitle}>
          Browse lyrics by artist
        </AppText>
        <ErrorState message="Failed to load artists" onRetry={refetch} />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppText variant="pageSubtitle" style={styles.subtitle}>
        Browse lyrics by artist
      </AppText>

      <View style={styles.searchWrap}>
        <AppSearchBar
          value={searchInput}
          onChangeText={handleSearchChange}
          placeholder="Search artists or songs..."
          active={isSearchActive || isTypingSearch}
          onFocus={() => setIsSearchActive(true)}
          onBlur={() => {
            // Delay so suggestion press registers before dropdown closes.
            setTimeout(() => setIsSearchActive(false), 150);
          }}
        />

        {showSuggestions ? (
          <View
            style={[
              styles.suggestions,
              { backgroundColor: colors.bgElevated, borderColor: colors.border },
            ]}
          >
            {isFetching && suggestions.length === 0 ? (
              <View style={styles.suggestionRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <AppText variant="itemMeta" color={colors.textTertiary} style={styles.suggestionMeta}>
                  Searching...
                </AppText>
              </View>
            ) : null}

            {!isFetching && suggestions.length === 0 ? (
              <View style={styles.suggestionRow}>
                <AppText variant="itemMeta" color={colors.textTertiary}>
                  No artists match “{searchInput.trim()}”
                </AppText>
              </View>
            ) : null}

            {suggestions.map((artist) => (
              <Pressable
                key={artist.id}
                onPress={() => handleSuggestionPress(artist)}
                style={({ pressed }) => [
                  styles.suggestionRow,
                  pressed && { backgroundColor: colors.primaryLight },
                ]}
              >
                <AppText variant="itemTitle" numberOfLines={1}>
                  {artist.name}
                </AppText>
                <AppText variant="itemMeta" color={colors.textTertiary}>
                  {artist.songCount > 0 ? `${artist.songCount} songs` : 'Artist'}
                </AppText>
              </Pressable>
            ))}
          </View>
        ) : null}

        {isTypingSearch && searchInput.trim().length < MIN_SEARCH_CHARS ? (
          <AppText variant="itemMeta" color={colors.textTertiary} style={styles.hint}>
            Type at least {MIN_SEARCH_CHARS} letters to search
          </AppText>
        ) : null}
      </View>

      {!isTypingSearch ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterScroll}
        >
          {ALPHABET.map((letter) => (
            <Chip
              key={letter}
              label={letter}
              active={selectedLetter === letter}
              onPress={() => handleLetterPress(letter)}
              style={styles.letterChip}
            />
          ))}
        </ScrollView>
      ) : null}

      <View style={[styles.countBar, { borderColor: colors.border, backgroundColor: colors.bgElevated }]}>
        <AppText variant="itemTitle">
          {totalArtists} {totalArtists === 1 ? 'artist' : 'artists'}
          {activeSearch ? ` for “${activeSearch}”` : selectedLetter ? ` · ${selectedLetter}` : ''}
        </AppText>
        <AppText variant="itemMeta" color={colors.textTertiary}>
          {isFetching ? 'Updating…' : `${PAGE_SIZE} per page`}
        </AppText>
      </View>

      {totalArtists === 0 ? (
        <EmptyState
          title="No artists found"
          subtitle={
            activeSearch || selectedLetter
              ? 'Try another name or letter'
              : undefined
          }
        />
      ) : (
        <View style={styles.listContainer}>
          {isFocused ? (
            <FlatList
              data={displayArtists}
              keyExtractor={(item) => item.id}
              renderItem={renderArtistCard}
              numColumns={numColumns}
              key={`artists-grid-${numColumns}`}
              extraData={displayArtists}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
            />
          ) : (
            <View style={styles.list} />
          )}

          <View style={[styles.pagination, { borderColor: colors.border, backgroundColor: colors.bgElevated }]}>
            <AppText variant="itemMeta" color={colors.textSecondary} center>
              Page {page} of {totalPages}
            </AppText>
            <View style={styles.paginationActions}>
              <AppButton
                label="Previous"
                variant="secondary"
                disabled={page <= 1}
                onPress={() => setPage((current) => Math.max(1, current - 1))}
                style={styles.pageButton}
              />
              <AppButton
                label="Next"
                variant="secondary"
                disabled={page >= totalPages}
                onPress={() => setPage((current) => Math.min(totalPages, current + 1))}
                style={styles.pageButton}
              />
            </View>
          </View>
        </View>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  searchWrap: {
    zIndex: 20,
    marginBottom: spacing.sm,
  },
  suggestions: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  suggestionMeta: {
    marginLeft: spacing.sm,
  },
  hint: {
    marginTop: spacing.sm,
  },
  filterScroll: {
    marginBottom: spacing.md,
    flexGrow: 0,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  letterChip: {
    width: 36,
    height: 36,
    minWidth: 36,
    borderRadius: 8,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  countBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  listContainer: {
    flex: 1,
    marginTop: spacing.xs,
    minHeight: 240,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.md,
  },
  pagination: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  paginationActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pageButton: {
    flex: 1,
  },
});
