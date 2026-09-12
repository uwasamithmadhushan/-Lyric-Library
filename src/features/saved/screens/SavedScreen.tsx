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
import { colors, spacing, radii, shadows } from '@/theme';
import type { SavedStackParamList } from '@/app/navigationTypes';
import type { SavedLyricItem, SavedTab } from '../types';
import { useSavedLyrics } from '../hooks/useSavedLyrics';

type Props = NativeStackScreenProps<SavedStackParamList, 'SavedList'>;

const TABS: { key: SavedTab; label: string }[] = [
  { key: 'recentlySaved', label: 'Recently Saved' },
  { key: 'mostViewed', label: 'Most Viewed' },
];

export default function SavedScreen({ navigation }: Readonly<Props>) {
  const [activeTab, setActiveTab] = useState<SavedTab>('recentlySaved');
  const { items, isEmpty, removeLyric } = useSavedLyrics(activeTab);

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

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<SavedLyricItem>) => (
      <SavedLyricCard
        item={item}
        onPress={() => handlePressItem(item)}
        onUnsave={() => handleUnsave(item)}
      />
    ),
    [handlePressItem, handleUnsave],
  );

  return (
    <AppScreen padded={false}>
      {/* Header */}
      <View style={styles.header}>
        <AppText variant="pageTitle">Saved Lyrics</AppText>
        <AppText variant="pageSubtitle">Your bookmarked collection</AppText>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab.key }}
            accessibilityLabel={tab.label}
          >
            <AppText
              variant="chipLabel"
              color={
                activeTab === tab.key ? colors.primary : colors.textTertiary
              }
            >
              {tab.label}
            </AppText>
          </Pressable>
        ))}
        <View style={styles.tabDivider} />
      </View>

      {/*  List / Empty state  */}
      {isEmpty ? (
        <View style={styles.emptyWrapper}>
          <EmptyState
            title="No saved lyrics yet"
            subtitle="Tap the star on any lyrics screen to save them here."
          />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.songId}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </AppScreen>
  );
}

//  SavedLyricCard 
interface CardProps {
  item: SavedLyricItem;
  onPress: () => void;
  onUnsave: () => void;
}

function SavedLyricCard({ item, onPress, onUnsave }: Readonly<CardProps>) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${item.songTitle} by ${item.artistName}. Tap to view lyrics.`}
    >
      {/* Text info */}
      <View style={styles.cardInfo}>
        <AppText variant="itemTitle" numberOfLines={1}>
          {item.songTitle}
        </AppText>
        <AppText variant="itemMeta" numberOfLines={1}>
          {item.artistName}
        </AppText>
        {item.previewText ? (
          <AppText
            variant="preview"
            numberOfLines={2}
            style={styles.previewText}
          >
            &ldquo;{item.previewText}&rdquo;
          </AppText>
        ) : null}
      </View>

      {/* Star / unsave button */}
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
        <AppText style={styles.starIcon}>★</AppText>
      </Pressable>
    </Pressable>
  );
}

//  Styles 

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
    borderBottomColor: colors.primary,
  },
  tabDivider: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.border,
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
  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadows.card,
  },
  cardPressed: {
    opacity: 0.75,
  },
  cardInfo: {
    flex: 1,
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
  previewText: {
    fontStyle: 'italic',
    marginTop: spacing.xxs,
  },
  // Star button
  starBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starBtnPressed: {
    opacity: 0.6,
  },
  starIcon: {
    fontSize: 18,
    color: colors.textPrimary,
    lineHeight: 22,
  },
});
