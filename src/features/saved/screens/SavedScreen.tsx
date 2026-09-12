import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  ListRenderItemInfo,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppScreen, AppText } from '@/components';
import { EmptyState } from '@/components/composite/StateViews';
import { spacing, radii, shadows } from '@/theme';
import { useTheme } from '@/hooks/useTheme';
import type { SavedStackParamList } from '@/app/navigationTypes';
import type { SavedLyricItem, SavedTab } from '../types';
import type { SavedArtist } from '@/types';
import { useSavedLyrics } from '../hooks/useSavedLyrics';

type Props = NativeStackScreenProps<SavedStackParamList, 'SavedList'>;

const TABS: { key: SavedTab; label: string }[] = [
  { key: 'recentlySaved', label: 'Recently Saved' },
  { key: 'savedArtists', label: 'Saved Artists' },
];

export default function SavedScreen({ navigation }: Readonly<Props>) {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<SavedTab>('recentlySaved');
  const { items, artists, isEmpty, removeLyric, removeArtist } = useSavedLyrics(activeTab);

  const handlePressItem = useCallback(
    (item: SavedLyricItem) => {
      navigation.navigate('Lyrics', {
        songId: item.songId,
        songTitle: item.songTitle,
        artistName: item.artistName,
      });
    },
    [navigation],
  );

  const handlePressArtist = useCallback(
    (artist: SavedArtist) => {
      navigation.getParent()?.navigate('ArtistsTab', {
        screen: 'ArtistDetail',
        params: { artistId: artist.artistId, artistName: artist.artistName },
      });
    },
    [navigation],
  );

  const handleUnsave = useCallback(
    (item: SavedLyricItem) => {
      Alert.alert(
        'Remove from Saved',
        `Remove "${item.songTitle}" from your saved collection?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => removeLyric(item.songId),
          },
        ],
      );
    },
    [removeLyric],
  );

  const handleUnsaveArtist = useCallback(
    (artist: SavedArtist) => {
      Alert.alert(
        'Remove Artist',
        `Remove "${artist.artistName}" from saved artists?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => removeArtist(artist.artistId),
          },
        ],
      );
    },
    [removeArtist],
  );

  const renderLyric = useCallback(
    ({ item }: ListRenderItemInfo<SavedLyricItem>) => (
      <SavedLyricCard
        item={item}
        colors={colors}
        onPress={() => handlePressItem(item)}
        onUnsave={() => handleUnsave(item)}
      />
    ),
    [colors, handlePressItem, handleUnsave],
  );

  const renderArtist = useCallback(
    ({ item }: ListRenderItemInfo<SavedArtist>) => (
      <SavedArtistCard
        artist={item}
        colors={colors}
        onPress={() => handlePressArtist(item)}
        onUnsave={() => handleUnsaveArtist(item)}
      />
    ),
    [colors, handlePressArtist, handleUnsaveArtist],
  );

  return (
    <AppScreen padded={false}>
      <View style={styles.header}>
        <AppText variant="pageTitle">Saved</AppText>
        <AppText variant="pageSubtitle">Your bookmarked lyrics and artists</AppText>
      </View>

      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[
              styles.tab,
              activeTab === tab.key && styles.tabActive,
              activeTab === tab.key && { borderBottomColor: colors.primary },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab.key }}
            accessibilityLabel={tab.label}
          >
            <AppText
              variant="chipLabel"
              color={activeTab === tab.key ? colors.primary : colors.textTertiary}
            >
              {tab.label}
            </AppText>
          </Pressable>
        ))}
        <View style={[styles.tabDivider, { backgroundColor: colors.border }]} />
      </View>

      {isEmpty ? (
        <View style={styles.emptyWrapper}>
          <EmptyState
            title={
              activeTab === 'savedArtists' ? 'No saved artists yet' : 'No saved lyrics yet'
            }
            subtitle={
              activeTab === 'savedArtists'
                ? 'Tap the ♥ on any artist card to save them here.'
                : 'Tap the ♥ heart on any song, or Save on the lyrics screen.'
            }
          />
        </View>
      ) : activeTab === 'savedArtists' ? (
        <FlatList
          data={artists}
          keyExtractor={(item) => item.artistId}
          renderItem={renderArtist}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.songId}
          renderItem={renderLyric}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </AppScreen>
  );
}

interface CardTheme {
  bgElevated: string;
  border: string;
  primary: string;
  primaryLight: string;
  textPrimary: string;
  textTertiary: string;
}

function SavedLyricCard({
  item,
  colors,
  onPress,
  onUnsave,
}: Readonly<{
  item: SavedLyricItem;
  colors: CardTheme;
  onPress: () => void;
  onUnsave: () => void;
}>) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.bgElevated,
          borderColor: colors.border,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.cardMain, pressed && styles.cardPressed]}
        accessibilityRole="button"
        accessibilityLabel={`${item.songTitle} by ${item.artistName}. Tap to view lyrics.`}
      >
        <View style={styles.cardInfo}>
          <AppText variant="itemTitle" numberOfLines={1} color={colors.textPrimary}>
            {item.songTitle}
          </AppText>
          <AppText variant="itemMeta" numberOfLines={1} color={colors.textTertiary}>
            {item.artistName}
          </AppText>
          {item.previewText ? (
            <AppText
              variant="preview"
              numberOfLines={2}
              color={colors.textTertiary}
              style={styles.previewText}
            >
              &ldquo;{item.previewText}&rdquo;
            </AppText>
          ) : null}
        </View>
      </Pressable>

      <Pressable
        onPress={onUnsave}
        hitSlop={8}
        style={({ pressed }) => [
          styles.starBtn,
          pressed && styles.starBtnPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${item.songTitle} from saved`}
      >
        <AppText style={[styles.starIcon, { color: colors.primary }]}>★</AppText>
      </Pressable>
    </View>
  );
}

function SavedArtistCard({
  artist,
  colors,
  onPress,
  onUnsave,
}: Readonly<{
  artist: SavedArtist;
  colors: CardTheme;
  onPress: () => void;
  onUnsave: () => void;
}>) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.bgElevated,
          borderColor: colors.border,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.cardMain, pressed && styles.cardPressed]}
        accessibilityRole="button"
        accessibilityLabel={`${artist.artistName}. Tap to open artist.`}
      >
        <View style={styles.cardInfo}>
          <AppText variant="itemTitle" numberOfLines={1} color={colors.textPrimary}>
            {artist.artistName}
          </AppText>
          <AppText variant="itemMeta" numberOfLines={1} color={colors.textTertiary}>
            {artist.songCount} songs
          </AppText>
        </View>
      </Pressable>

      <Pressable
        onPress={onUnsave}
        hitSlop={8}
        style={({ pressed }) => [
          styles.starBtn,
          pressed && styles.starBtnPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${artist.artistName} from saved artists`}
      >
        <AppText style={[styles.starIcon, { color: colors.primary }]}>♥</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.lg,
    position: 'relative',
  },
  tab: {
    paddingBottom: spacing.sm,
    marginRight: spacing.xxl,
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabDivider: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  listContent: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  emptyWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    ...shadows.card,
  },
  cardMain: {
    flex: 1,
    marginRight: spacing.md,
  },
  cardPressed: {
    opacity: 0.75,
  },
  cardInfo: {
    gap: spacing.xs,
  },
  previewText: {
    fontStyle: 'italic',
    marginTop: spacing.xxs,
  },
  starBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  starBtnPressed: {
    opacity: 0.6,
  },
  starIcon: {
    fontSize: 20,
    lineHeight: 24,
  },
});
