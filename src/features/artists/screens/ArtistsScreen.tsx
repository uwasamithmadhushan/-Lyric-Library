import React, { useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppScreen, AppText, AppSearchBar, Chip, ArtistCard } from '@/components';
import { LoadingState, ErrorState, EmptyState } from '@/components/composite/StateViews';
import { useArtists } from '@/hooks';
import { spacing } from '@/theme';
import type { ArtistsStackParamList } from '@/app/navigationTypes';
import type { Artist } from '@/types';

type Props = NativeStackScreenProps<ArtistsStackParamList, 'ArtistsList'>;

// Generate alphabet filter options
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const FILTER_OPTIONS = ALPHABET;

/**
 * Artists Browse Screen — displays artist grid with search and alphabet filter.
 *
 * Features:
 *  - Search bar for filtering artists by name
 *  - Alphabet quick-filter chips (All, A-Z)
 *  - Grid layout with ArtistCard components
 *  - Navigation to ArtistDetail screen
 */
function getArtistGridColumns(width: number): number {
  if (width >= 1200) return 5;
  if (width >= 900) return 4;
  if (width >= 600) return 3;
  return 2;
}

export default function ArtistsScreen({ navigation }: Readonly<Props>) {
  const { width } = useWindowDimensions();
  const numColumns = getArtistGridColumns(width);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  const { data: artists = [], isLoading, isError, refetch } = useArtists({
    query: searchQuery,
    startsWith: selectedLetter || undefined,
  });

  const handleArtistPress = (artist: Artist) => {
    navigation.navigate('ArtistDetail', {
      artistId: artist.id,
      artistName: artist.name,
    });
  };

  const renderArtistCard = ({ item, index }: { item: Artist; index: number }) => {
    const initial = item.name.charAt(0).toUpperCase();
    return (
      <ArtistCard
        name={item.name}
        songCount={item.songCount}
        initial={initial}
        imageUrl={item.imageUrl}
        alternateGradient={index % 2 === 1}
        onPress={() => handleArtistPress(item)}
      />
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <AppScreen>
        <AppText variant="pageTitle">Artists</AppText>
        <LoadingState message="Loading artists..." />
      </AppScreen>
    );
  }

  // Error state
  if (isError) {
    return (
      <AppScreen>
        <AppText variant="pageTitle">Artists</AppText>
        <ErrorState
          message="Failed to load artists"
          onRetry={refetch}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppText variant="pageTitle">Artists</AppText>
      <AppText variant="pageSubtitle" style={styles.subtitle}>
        Browse lyrics by artist
      </AppText>

      {/* Search Bar */}
      <AppSearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search artists..."
        active={isSearchActive}
        onFocus={() => setIsSearchActive(true)}
        onBlur={() => setIsSearchActive(false)}
      />

      {/* Alphabet Filter Chips */}
      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map((letter) => (
          <Chip
            key={letter}
            label={letter}
            active={selectedLetter === letter}
            onPress={() =>
              setSelectedLetter((previousLetter) =>
                previousLetter === letter ? '' : letter
              )
            }
            style={styles.letterChip}
          />
        ))}
      </View>

      {/* Artists Grid */}
      {artists.length === 0 ? (
        <EmptyState
          title="No artists found"
          subtitle={
            searchQuery || selectedLetter
              ? 'Try adjusting your filters'
              : undefined
          }
        />
      ) : (
        <View style={styles.listContainer}>
          <FlashList
            data={artists}
            renderItem={renderArtistCard}
            estimatedItemSize={180}
            numColumns={numColumns}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
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
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  letterChip: {
    width: 32,
    height: 32,
    minWidth: 32,
    borderRadius: 8,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  listContainer: {
    flex: 1,
    marginTop: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing.md,
  },
});