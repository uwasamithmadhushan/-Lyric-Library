/**
 * SearchScreen.tsx
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { AppText, AppSearchBar } from '@/components';
import { colors, spacing, radii, shadows } from '@/theme';
import { useSearch } from '../hooks/useSearch';
import type { UseSearchParams } from '../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SearchStackParamList } from '@/app/navigationTypes';
import type { Song, Artist, Album } from '@/types';

// ─── Avatar colors keyed by first letter — no field needed ───────────────────
const AVATAR_COLORS = [
  '#F97316', '#EC4899', '#7C3AED', '#6366F1',
  '#10B981', '#F59E0B', '#3B82F6', '#EF4444',
];

function avatarColor(seed: string): string {
  const idx = (seed.codePointAt(0) ?? 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

// ─── Navigation ──────────────────────────────────────────────────────────────
type SearchNavProp = NativeStackNavigationProp<SearchStackParamList>;

// Fix 1: Props marked as read-only
interface SearchScreenProps {
  readonly navigation: SearchNavProp;
}

// ─── Filter config ────────────────────────────────────────────────────────────
type FilterValue = UseSearchParams['type'];
const FILTERS: { label: string; value: FilterValue }[] = [
  { label: 'All',     value: 'all'    },
  { label: 'Songs',   value: 'song'   },
  { label: 'Artists', value: 'artist' },
  { label: 'Albums',  value: 'album'  },
];

// ─── AvatarBlock ─────────────────────────────────────────────────────────────
// Fix 1: Props marked as read-only
function AvatarBlock({
  letter,
  seed,
  size = 46,
  circle = false,
}: Readonly<{ letter: string; seed: string; size?: number; circle?: boolean }>) {
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: circle ? size / 2 : radii.md,
          backgroundColor: avatarColor(seed),
        },
      ]}
    >
      <AppText
        variant="avatarLetter"
        color={colors.white}
        style={{ fontSize: size * 0.41 }}
      >
        {letter}
      </AppText>
    </View>
  );
}

// ─── Result rows ─────────────────────────────────────────────────────────────
// Fix 1: Props marked as read-only
function SongRow({ song, onPress }: Readonly<{ song: Song; onPress: (s: Song) => void }>) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onPress(song)}
      activeOpacity={0.65}
    >
      <AvatarBlock letter={song.title[0]} seed={song.title} />
      <View style={styles.rowMeta}>
        <AppText variant="itemTitle" numberOfLines={1}>
          {song.title}
        </AppText>
        <AppText variant="itemMeta" color={colors.textTertiary} numberOfLines={1}>
          {song.albumTitle
            ? `${song.artistName} · ${song.albumTitle}`
            : song.artistName}
        </AppText>
      </View>
    </TouchableOpacity>
  );
}

// Fix 1: Props marked as read-only
function ArtistRow({
  artist,
  onPress,
}: Readonly<{ artist: Artist; onPress: (a: Artist) => void }>) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onPress(artist)}
      activeOpacity={0.65}
    >
      <AvatarBlock letter={artist.name[0]} seed={artist.name} circle />
      <View style={styles.rowMeta}>
        <AppText variant="itemTitle" numberOfLines={1}>
          {artist.name}
        </AppText>
        <AppText variant="itemMeta" color={colors.textTertiary}>
          {artist.songCount} {artist.songCount === 1 ? 'song' : 'songs'} available
        </AppText>
      </View>
    </TouchableOpacity>
  );
}

// Fix 1: Props marked as read-only
function AlbumRow({
  album,
  onPress,
}: Readonly<{ album: Album; onPress: (a: Album) => void }>) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onPress(album)}
      activeOpacity={0.65}
    >
      <AvatarBlock letter={album.title[0]} seed={album.title} />
      <View style={styles.rowMeta}>
        <AppText variant="itemTitle" numberOfLines={1}>
          {album.title}
        </AppText>
        <AppText variant="itemMeta" color={colors.textTertiary}>
          {album.artistName} · {album.songCount} {album.songCount === 1 ? 'song' : 'songs'}
        </AppText>
      </View>
    </TouchableOpacity>
  );
}

// ─── Section label + card ─────────────────────────────────────────────────────
// Fix 1: Props marked as read-only
function SectionLabel({ label }: Readonly<{ label: string }>) {
  return (
    <View style={styles.sectionLabelWrap}>
      <AppText variant="sectionHeader">{label}</AppText>
    </View>
  );
}

// Fix 1: Props marked as read-only
function ResultCard({ children }: Readonly<{ children: React.ReactNode }>) {
  return <View style={styles.resultCard}>{children}</View>;
}

function RowDivider() {
  return <View style={styles.rowDivider} />;
}

// ─── Empty / no-results states ───────────────────────────────────────────────
function EmptyState() {
  return (
    <View style={styles.stateWrap}>
      <Icon name="music" size={40} color={colors.textTertiary} />
      <AppText variant="pageSubtitle" style={styles.stateTitle}>
        Find songs and artists
      </AppText>
      <AppText variant="itemMeta" color={colors.textTertiary} style={styles.stateSub}>
        Type in the search bar to get started
      </AppText>
    </View>
  );
}

// Fix 1: Props marked as read-only
function NoResultsState({ query }: Readonly<{ query: string }>) {
  return (
    <View style={styles.stateWrap}>
      <Icon name="search" size={40} color={colors.textTertiary} />
      <AppText variant="pageSubtitle" style={styles.stateTitle}>
        {`No results for "${query}"`}
      </AppText>
      <AppText variant="itemMeta" color={colors.textTertiary} style={styles.stateSub}>
        Try a different search term or filter
      </AppText>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function SearchScreen({ navigation }: SearchScreenProps) {
  const [query,          setQuery]          = useState('');
  const [activeFilter,   setActiveFilter]   = useState<FilterValue>('all');
  const [isSearchActive, setIsSearchActive] = useState(false);

  const { results, isLoading, isEmpty, hasNoResults } = useSearch({
    query,
    type: activeFilter,
  });

  const handleSongPress = useCallback(
    (song: Song) =>
      navigation.navigate('Lyrics', {
        songId:     song.id,
        songTitle:  song.title,
        artistName: song.artistName,
      }),
    [navigation],
  );

  const handleArtistPress = useCallback(
    (artist: Artist) =>
      navigation.navigate('ArtistDetail', {
        artistId:   artist.id,
        artistName: artist.name,
      }),
    [navigation],
  );

  const handleAlbumPress = useCallback(
    (album: Album) =>
      navigation.navigate('AlbumDetail', {
        albumId:    album.id,
        albumName:  album.title,
        artistId:   album.artistId,
        artistName: album.artistName,
      }),
    [navigation],
  );

  const hasSongs   = results.songs.length   > 0;
  const hasArtists = results.artists.length > 0;
  const hasAlbums  = results.albums.length  > 0;

  // Fix 3: Extract nested ternary into an independent statement
  let resultsContent: React.ReactNode;
  if (isLoading) {
    resultsContent = (
      <ActivityIndicator style={styles.loader} color={colors.primary} size="large" />
    );
  } else if (isEmpty) {
    resultsContent = <EmptyState />;
  } else if (hasNoResults) {
    resultsContent = <NoResultsState query={query} />;
  } else {
    resultsContent = (
      <>
        {hasSongs && (
          <>
            <SectionLabel label="SONGS" />
            <ResultCard>
              {results.songs.map((song, i) => (
                <React.Fragment key={song.id}>
                  <SongRow song={song} onPress={handleSongPress} />
                  {i < results.songs.length - 1 && <RowDivider />}
                </React.Fragment>
              ))}
            </ResultCard>
          </>
        )}

        {hasArtists && (
          <>
            <SectionLabel label="ARTISTS" />
            <ResultCard>
              {results.artists.map((artist, i) => (
                <React.Fragment key={artist.id}>
                  <ArtistRow artist={artist} onPress={handleArtistPress} />
                  {i < results.artists.length - 1 && <RowDivider />}
                </React.Fragment>
              ))}
            </ResultCard>
          </>
        )}

        {hasAlbums && (
          <>
            <SectionLabel label="ALBUMS" />
            <ResultCard>
              {results.albums.map((album, i) => (
                <React.Fragment key={album.id}>
                  <AlbumRow album={album} onPress={handleAlbumPress} />
                  {i < results.albums.length - 1 && <RowDivider />}
                </React.Fragment>
              ))}
            </ResultCard>
          </>
        )}
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgPrimary} />

      <View style={styles.header}>
        <AppText variant="pageTitle">Search</AppText>
        <AppText variant="pageSubtitle" style={styles.headerSub}>
          Find songs and artists
        </AppText>
      </View>

      <View style={styles.searchWrap}>
        <AppSearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search..."
          active={isSearchActive}
          onFocus={() => setIsSearchActive(true)}
          onBlur={() => setIsSearchActive(false)}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={styles.pillsScroll}
        contentContainerStyle={styles.pillsContent}
      >
        {FILTERS.map((f) => {
          const active = activeFilter === f.value;
          return (
            <TouchableOpacity
              key={f.value}
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => setActiveFilter(f.value)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={f.label}
            >
              <AppText
                variant="actionLabel"
                color={active ? colors.white : colors.textPrimary}
              >
                {f.label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        style={styles.resultsScroll}
        contentContainerStyle={styles.resultsContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {resultsContent}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const AVATAR_SIZE = 46;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  headerSub: {
    marginTop: spacing.xs,
  },
  searchWrap: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  pillsScroll: {
    flexGrow: 0,
    marginBottom: spacing.xs,
  },
  pillsContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  resultsScroll: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  sectionLabelWrap: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  resultCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.lg + AVATAR_SIZE + spacing.md,
  },
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  rowMeta: {
    flex: 1,
  },
  loader: {
    marginTop: spacing.huge,
  },
  stateWrap: {
    alignItems: 'center',
    paddingTop: spacing.huge,
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
  },
  stateTitle: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  stateSub: {
    textAlign: 'center',
    lineHeight: 20,
  },
});