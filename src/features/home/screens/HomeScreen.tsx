import React, { useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Pressable, useWindowDimensions } from 'react-native';
import { AppScreen, AppText, AppSearchBar, ArtistCard, Chip } from '@/components';
import { spacing } from '@/theme';
import { useTheme } from '@/hooks/useTheme';
import type { RootTabParamList } from '@/app/navigationTypes';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { getRecentlyViewed, getFavorites } from '@/store/localState';

const FEATURED = [
  { id: 's1', title: 'Anti-Hero', artist: 'Taylor Swift' },
  { id: 's2', title: 'Cruel Summer', artist: 'Taylor Swift' },
  { id: 's3', title: 'Flowers', artist: 'Miley Cyrus' },
  { id: 's4', title: 'Someone Like You', artist: 'Adele' },
];

const ARTISTS = [
  { id: 'a1', name: 'Taylor Swift', songCount: 178 },
  { id: 'a2', name: 'Adele', songCount: 64 },
  { id: 'a3', name: 'The Weeknd', songCount: 112 },
  { id: 'a4', name: 'Ed Sheeran', songCount: 95 },
  { id: 'a5', name: 'Miley Cyrus', songCount: 81 },
];

const GENRES = ['Pop', 'Rock', 'Hip Hop', 'R&B', 'Country', 'Jazz'];

export default function HomeScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const [recent, setRecent] = useState(() => getRecentlyViewed().slice(0, 5));
  const [favorites, setFavorites] = useState(() => getFavorites().slice(0, 5));
  const [query, setQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      setRecent(getRecentlyViewed().slice(0, 5));
      setFavorites(getFavorites().slice(0, 5));
    }, [])
  );
  const { width } = useWindowDimensions();
  const horizontalPadding = Math.max(20, Math.min(80, Math.floor(width * 0.06)));
  const normalizedQuery = query.trim().toLowerCase();

  const filteredFeatured = useMemo(() => {
    if (!normalizedQuery) return FEATURED;
    return FEATURED.filter(
      (item) =>
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.artist.toLowerCase().includes(normalizedQuery),
    );
  }, [normalizedQuery]);

  const filteredArtists = useMemo(() => {
    if (!normalizedQuery) return ARTISTS;
    return ARTISTS.filter((item) => item.name.toLowerCase().includes(normalizedQuery));
  }, [normalizedQuery]);

  const filteredGenres = useMemo(() => {
    if (!normalizedQuery) return GENRES;
    return GENRES.filter((item) => item.toLowerCase().includes(normalizedQuery));
  }, [normalizedQuery]);

  const hasResults =
    filteredFeatured.length > 0 ||
    filteredArtists.length > 0 ||
    filteredGenres.length > 0;

  return (
    <AppScreen backgroundColor={colors.bgSecondary}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPadding }]}>
        <View style={[styles.hero, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
          <AppText variant="pageTitle">Lyric Library</AppText>
          <AppText variant="pageSubtitle" color={colors.textSecondary}>
            Discover and save your favorite lyrics
          </AppText>

          <View style={styles.heroActions}>
            <View style={[styles.heroBadge, { backgroundColor: colors.primaryLight }]}>
              <AppText variant="itemMeta" color={colors.primary}>
                {favorites.length} favorites
              </AppText>
            </View>
            <View style={[styles.heroBadge, { backgroundColor: colors.secondaryLight }]}>
              <AppText variant="itemMeta" color={colors.secondary}>
                {recent.length} recent
              </AppText>
            </View>
          </View>
        </View>

        <View style={styles.searchRow}>
          <AppSearchBar placeholder="Search songs, artists, genres..." value={query} onChangeText={setQuery} active={query.length > 0} />
        </View>

        {!hasResults && normalizedQuery.length > 0 ? (
          <View style={[styles.emptyStateCard, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
            <AppText variant="itemTitle">No matches found</AppText>
            <AppText variant="itemMeta" color={colors.textTertiary}>
              Try a different song, artist, or genre.
            </AppText>
          </View>
        ) : null}

        <Section title="Featured Lyrics">
            <FlatList
            data={filteredFeatured}
            horizontal
            keyExtractor={item => item.id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => navigation.navigate('HomeTab', { screen: 'Lyrics', params: { songId: item.id, songTitle: item.title, artistName: item.artist } })}
                style={({ pressed }) => [styles.cardPressable, pressed && styles.cardPressed]}
              >
                <View style={[styles.featureCard, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
                  <AppText variant="itemMeta" color={colors.textTertiary}>{item.artist}</AppText>
                  <AppText variant="pageSubtitle">{item.title}</AppText>
                </View>
              </Pressable>
            )}
          />
        </Section>

        <Section title="Popular Artists">
          <FlatList
            data={filteredArtists}
            horizontal
            keyExtractor={item => item.id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.artistCardWrap}>
                <ArtistCard
                  name={item.name}
                  songCount={item.songCount}
                  initial={item.name.charAt(0)}
                  onPress={() => navigation.navigate('ArtistsTab', { screen: 'ArtistDetail', params: { artistId: item.id, artistName: item.name } })}
                />
              </View>
            )}
          />
        </Section>

        <Section title="Browse by Genre">
          <View style={styles.genreRow}>
            {filteredGenres.map((g) => (
              <Chip key={g} label={g} onPress={() => navigation.navigate('SearchTab', { screen: 'SearchMain' })} />
            ))}
          </View>
        </Section>

        <Section title="Recently Viewed">
          {recent.length === 0 ? (
            <AppText variant="pageSubtitle" color={colors.textTertiary}>No recently viewed songs</AppText>
          ) : (
            <FlatList
              data={recent}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={item => item.songId}
              renderItem={({ item }) => (
                <Pressable onPress={() => navigation.navigate('HomeTab', { screen: 'Lyrics', params: { songId: item.songId, songTitle: item.songTitle, artistName: item.artistName ?? '' } })}>
                  <View style={[styles.recentCard, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
                    <AppText variant="itemMeta">{item.artistName}</AppText>
                    <AppText variant="pageSubtitle">{item.songTitle}</AppText>
                  </View>
                </Pressable>
              )}
            />
          )}
        </Section>

        <Section title="Favorites">
          {favorites.length === 0 ? (
            <AppText variant="pageSubtitle" color={colors.textTertiary}>No favorites yet</AppText>
          ) : (
            <FlatList
              data={favorites}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <Pressable onPress={() => navigation.navigate('HomeTab', { screen: 'Lyrics', params: { songId: item.id, songTitle: item.title, artistName: item.artistName ?? '' } })}>
                  <View style={[styles.featureCard, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
                    <AppText variant="itemMeta">{item.artistName}</AppText>
                    <AppText variant="pageSubtitle">{item.title}</AppText>
                  </View>
                </Pressable>
              )}
            />
          )}
        </Section>

      </ScrollView>
    </AppScreen>
  );
}

function Section({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
  const { colors } = useTheme();
  return (
    <View style={[styles.section, { backgroundColor: colors.bgPrimary, borderColor: colors.border }]}>
      <AppText variant="sectionHeader" color={colors.textTertiary}>{title}</AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xxl,
    gap: spacing.lg,
  },
  hero: {
    padding: spacing.xl,
    borderRadius: 24,
    borderWidth: 1,
  },
  heroActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    flexWrap: 'wrap',
  },
  heroBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  searchRow: {
    marginTop: spacing.xs,
  },
  featureCard: {
    padding: spacing.lg,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 180,
    borderWidth: 1,
  },
  artistCardWrap: {
    marginRight: 12,
  },
  genreRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  recentCard: {
    padding: spacing.lg,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 160,
    borderWidth: 1,
  },
  section: {
    marginBottom: spacing.lg,
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
  },
  emptyStateCard: {
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardPressable: {
    marginRight: 12,
  },
  cardPressed: {
    opacity: 0.92,
  },
});
