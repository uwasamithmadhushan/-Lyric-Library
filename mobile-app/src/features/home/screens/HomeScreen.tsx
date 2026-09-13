import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  useWindowDimensions,
  Image,
  Animated,
} from 'react-native';
import { AppScreen, AppText, AppSearchBar, ArtistCard, Chip } from '@/components';
import { spacing, radii } from '@/theme';
import { useTheme } from '@/hooks/useTheme';
import { useArtists } from '@/hooks';
import type { RootTabParamList } from '@/app/navigationTypes';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  HOME_FEATURED_SONGS,
  toCatalogSongId,
  mapPool,
  buildLocalCatalogArtists,
  buildLocalCatalogSongs,
} from '@/data/catalog/featuredCatalog';
import { getRecentlyViewed, addRecentlyViewed } from '@/store/localState';
import { useSavedStore } from '@/store';
import { enrichArtistImage, searchDeezerTrack } from '@/services/deezer/deezerApi';
import { toggleSavedArtist } from '@/store/savedLyricsActions';
import type { Artist } from '@/types';

const FEATURED = HOME_FEATURED_SONGS.map((item) => ({
  id: toCatalogSongId(item.artist, item.title),
  title: item.title,
  artist: item.artist,
}));

const GENRES = ['Pop', 'Rock', 'Hip Hop', 'R&B', 'Country', 'Jazz', 'K-Pop', 'Latin'];

const HERO_POSTER_INTERVAL_MS = 4500;

export default function HomeScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const [recent, setRecent] = useState(() => getRecentlyViewed().slice(0, 5));
  const savedOrder = useSavedStore((state) => state.savedOrder);
  const savedMap = useSavedStore((state) => state.savedMap);
  const artistMap = useSavedStore((state) => state.artistMap);
  const favorites = useMemo(
    () =>
      savedOrder
        .map((id) => savedMap[id])
        .filter(Boolean)
        .slice(0, 5)
        .map((item) => ({
          id: item!.songId,
          title: item!.songTitle,
          artistName: item!.artistName,
        })),
    [savedOrder, savedMap],
  );
  const [query, setQuery] = useState('');
  const { data: popularArtists = [] } = useArtists();
  const [homeArtists, setHomeArtists] = useState<Artist[]>([]);
  const [heroPosters, setHeroPosters] = useState<string[]>([]);
  const [posterIndex, setPosterIndex] = useState(0);
  const posterFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let cancelled = false;
    const base = popularArtists.slice(0, 8);
    setHomeArtists(base);

    (async () => {
      const enriched = await mapPool(base, 4, async (artist) => {
        if (artist.imageUrl) return artist;
        try {
          const media = await enrichArtistImage(artist.name);
          return media.imageUrl ? { ...artist, imageUrl: media.imageUrl } : artist;
        } catch {
          return artist;
        }
      });
      if (!cancelled) setHomeArtists(enriched);
    })();

    return () => {
      cancelled = true;
    };
  }, [popularArtists]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const covers = await mapPool(HOME_FEATURED_SONGS.slice(0, 8), 3, async (song) => {
        try {
          const match = await searchDeezerTrack(song.title, song.artist);
          return match?.artworkUrl;
        } catch {
          return undefined;
        }
      });
      if (cancelled) return;

      const unique = covers.filter((url, index, list): url is string =>
        Boolean(url) && list.indexOf(url) === index,
      );
      if (unique.length > 0) {
        setHeroPosters(unique);
        setPosterIndex(0);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (heroPosters.length < 2) return undefined;

    const timer = setInterval(() => {
      Animated.timing(posterFade, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        setPosterIndex((current) => (current + 1) % heroPosters.length);
        Animated.timing(posterFade, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }).start();
      });
    }, HERO_POSTER_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [heroPosters.length, posterFade]);

  useFocusEffect(
    useCallback(() => {
      setRecent(getRecentlyViewed().slice(0, 5));
    }, [])
  );
  const { width } = useWindowDimensions();
  const horizontalPadding = Math.max(spacing.xl, Math.min(spacing.massive, Math.floor(width * 0.05)));
  const featureCardWidth = Math.min(200, Math.max(168, Math.floor(width * 0.42)));
  const artistCardWidth = Math.min(156, Math.max(136, Math.floor(width * 0.36)));
  const normalizedQuery = query.trim().toLowerCase();

  const filteredFeatured = useMemo(() => {
    if (!normalizedQuery) return FEATURED;
    // Full catalog song search (title OR artist name).
    return buildLocalCatalogSongs({ query: normalizedQuery })
      .slice(0, 24)
      .map((item) => ({
        id: item.id,
        title: item.title,
        artist: item.artistName,
      }));
  }, [normalizedQuery]);

  const filteredArtists = useMemo(() => {
    if (!normalizedQuery) {
      return homeArtists.length > 0 ? homeArtists : popularArtists.slice(0, 8);
    }
    // Full catalog artist search (name OR their songs).
    return buildLocalCatalogArtists({ query: normalizedQuery })
      .slice(0, 16)
      .map((item) => ({
        id: item.id,
        name: item.name,
        songCount: item.songCount,
        albums: [] as Artist['albums'],
        imageUrl: undefined as string | undefined,
      }));
  }, [normalizedQuery, homeArtists, popularArtists]);

  const filteredGenres = useMemo(() => {
    if (!normalizedQuery) return GENRES;
    return GENRES.filter((item) => item.toLowerCase().includes(normalizedQuery));
  }, [normalizedQuery]);

  const hasResults =
    filteredFeatured.length > 0 ||
    filteredArtists.length > 0 ||
    filteredGenres.length > 0;

  return (
    <AppScreen padded={false} style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.container,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: spacing.massive + spacing.lg,
          },
        ]}
      >
        <View
          style={[
            styles.hero,
            {
              backgroundColor: colors.bgElevated,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.heroContent}>
            <AppText variant="pageTitle">Lyric Library</AppText>
            <AppText variant="pageSubtitle" color={colors.textSecondary} style={styles.heroSubtitle}>
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

          {heroPosters.length > 0 ? (
            <Animated.View style={[styles.heroPosterWrap, { opacity: posterFade }]}>
              <Image
                source={{ uri: heroPosters[posterIndex] }}
                style={styles.heroPosterImage}
                resizeMode="cover"
              />
            </Animated.View>
          ) : (
            <View style={[styles.heroPosterPlaceholder, { backgroundColor: colors.bgSecondary }]} />
          )}
        </View>

        <View style={styles.searchRow}>
          <AppSearchBar
            placeholder="Search songs, artists, genres..."
            value={query}
            onChangeText={setQuery}
            active={query.length > 0}
          />
        </View>

        {!hasResults && normalizedQuery.length > 0 ? (
          <View style={[styles.emptyStateCard, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
            <AppText variant="itemTitle">No matches found</AppText>
            <AppText variant="itemMeta" color={colors.textTertiary} style={styles.emptyCopy}>
              Try a different song, artist, or genre.
            </AppText>
          </View>
        ) : null}

        <Section title={normalizedQuery ? 'Matching Songs' : 'Featured Lyrics'}>
          <FlatList
            data={filteredFeatured}
            horizontal
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hListContent}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  addRecentlyViewed({
                    songId: item.id,
                    songTitle: item.title,
                    artistName: item.artist,
                  });
                  setRecent(getRecentlyViewed().slice(0, 5));
                  navigation.navigate('HomeTab', {
                    screen: 'Lyrics',
                    params: { songId: item.id, songTitle: item.title, artistName: item.artist },
                  });
                }}
                style={({ pressed }) => [styles.cardPressable, pressed && styles.cardPressed]}
              >
                <View
                  style={[
                    styles.featureCard,
                    { width: featureCardWidth, backgroundColor: colors.bgElevated, borderColor: colors.border },
                  ]}
                >
                  <AppText variant="itemMeta" color={colors.textTertiary} numberOfLines={1}>
                    {item.artist}
                  </AppText>
                  <AppText variant="itemTitle" numberOfLines={2} style={styles.cardTitle}>
                    {item.title}
                  </AppText>
                </View>
              </Pressable>
            )}
          />
        </Section>

        <Section title={normalizedQuery ? 'Matching Artists' : 'Popular Artists'}>
          <FlatList
            data={filteredArtists}
            horizontal
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hListContent}
            renderItem={({ item }) => (
              <View style={[styles.artistCardWrap, { width: artistCardWidth }]}>
                <ArtistCard
                  name={item.name}
                  songCount={item.songCount}
                  initial={item.name.charAt(0)}
                  imageUrl={item.imageUrl}
                  favorited={Boolean(artistMap[item.id])}
                  onFavoriteToggle={() =>
                    toggleSavedArtist({
                      artistId: item.id,
                      artistName: item.name,
                      songCount: item.songCount,
                      imageUrl: item.imageUrl,
                    })
                  }
                  onPress={() =>
                    navigation.navigate('ArtistsTab', {
                      screen: 'ArtistDetail',
                      params: { artistId: item.id, artistName: item.name },
                    })
                  }
                />
              </View>
            )}
          />
        </Section>

        <Section title="Browse by Genre">
          <View style={styles.genreRow}>
            {filteredGenres.map((g) => (
              <Chip key={g} label={g} onPress={() => navigation.navigate('HomeTab', { screen: 'SearchMain' })} />
            ))}
          </View>
        </Section>

        <Section title="Recently Viewed">
          {recent.length === 0 ? (
            <AppText variant="pageSubtitle" color={colors.textTertiary}>
              No recently viewed songs
            </AppText>
          ) : (
            <FlatList
              data={recent}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hListContent}
              keyExtractor={(item) => item.songId}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() =>
                    navigation.navigate('HomeTab', {
                      screen: 'Lyrics',
                      params: {
                        songId: item.songId,
                        songTitle: item.songTitle,
                        artistName: item.artistName ?? '',
                      },
                    })
                  }
                  style={({ pressed }) => [styles.cardPressable, pressed && styles.cardPressed]}
                >
                  <View
                    style={[
                      styles.recentCard,
                      { width: featureCardWidth, backgroundColor: colors.bgElevated, borderColor: colors.border },
                    ]}
                  >
                    <AppText variant="itemMeta" color={colors.textTertiary} numberOfLines={1}>
                      {item.artistName}
                    </AppText>
                    <AppText variant="itemTitle" numberOfLines={2} style={styles.cardTitle}>
                      {item.songTitle}
                    </AppText>
                  </View>
                </Pressable>
              )}
            />
          )}
        </Section>

        <Section title="Favorites">
          {favorites.length === 0 ? (
            <AppText variant="pageSubtitle" color={colors.textTertiary}>
              No favorites yet
            </AppText>
          ) : (
            <FlatList
              data={favorites}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hListContent}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() =>
                    navigation.navigate('HomeTab', {
                      screen: 'Lyrics',
                      params: {
                        songId: item.id,
                        songTitle: item.title,
                        artistName: item.artistName ?? '',
                      },
                    })
                  }
                  style={({ pressed }) => [styles.cardPressable, pressed && styles.cardPressed]}
                >
                  <View
                    style={[
                      styles.featureCard,
                      { width: featureCardWidth, backgroundColor: colors.bgElevated, borderColor: colors.border },
                    ]}
                  >
                    <AppText variant="itemMeta" color={colors.textTertiary} numberOfLines={1}>
                      {item.artistName}
                    </AppText>
                    <AppText variant="itemTitle" numberOfLines={2} style={styles.cardTitle}>
                      {item.title}
                    </AppText>
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
    <View style={[styles.section, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
      <AppText variant="sectionHeader" color={colors.textTertiary} style={styles.sectionTitle}>
        {title}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: spacing.sm,
  },
  container: {
    paddingTop: spacing.lg,
    gap: spacing.xl,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radii.xl + 8,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 148,
  },
  heroContent: {
    flex: 1,
    gap: spacing.sm,
    paddingRight: spacing.xs,
  },
  heroSubtitle: {
    marginTop: spacing.xs,
  },
  heroActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    flexWrap: 'wrap',
  },
  heroBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.s,
    borderRadius: radii.full,
  },
  heroPosterWrap: {
    width: 108,
    height: 108,
    borderRadius: radii.lg,
    overflow: 'hidden',
    flexShrink: 0,
  },
  heroPosterImage: {
    width: '100%',
    height: '100%',
  },
  heroPosterPlaceholder: {
    width: 108,
    height: 108,
    borderRadius: radii.lg,
    flexShrink: 0,
  },
  searchRow: {
    marginTop: spacing.xs,
  },
  hListContent: {
    paddingRight: spacing.sm,
    gap: spacing.md,
  },
  featureCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    minHeight: 88,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  cardTitle: {
    marginTop: spacing.xs,
  },
  artistCardWrap: {
    marginRight: spacing.md,
  },
  genreRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  recentCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    minHeight: 88,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  section: {
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    borderWidth: 1,
    gap: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.xs,
  },
  emptyStateCard: {
    padding: spacing.xl,
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: spacing.sm,
  },
  emptyCopy: {
    marginTop: spacing.xs,
  },
  cardPressable: {
    marginRight: spacing.md,
  },
  cardPressed: {
    opacity: 0.92,
  },
});
