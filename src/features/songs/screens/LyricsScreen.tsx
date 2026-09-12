import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { AppButton, AppScreen, AppText } from '@/components';
import { addRecentlyViewed } from '@/store/localState';
import { radii, spacing } from '@/theme';
import { useTheme } from '@/hooks/useTheme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SongsStackParamList } from '@/app/navigationTypes';

type Props = NativeStackScreenProps<SongsStackParamList, 'Lyrics'>;

const antiHeroLines = [
  "I have this thing where I get too in my head",
  "It's me, hi, I'm the problem, it's me",
  "I have no idea how I got so lost",
  "I don’t know how to be happy again",
  "I’m so sick of running in circles",
  "I’m not the girl I used to be",
];

/**
 * Lyrics Display Screen.
 *
 * Special-case the Anti-Hero page with a rich lyric layout while keeping the
 * generic fallback for all other songs.
 */
export default function LyricsScreen({ route }: Readonly<Props>) {
  const { colors } = useTheme();
  const { songId, songTitle, artistName } = route.params;
  useEffect(() => {
    if (songId && songTitle) {
      addRecentlyViewed({ songId, songTitle, artistName });
    }
  }, [songId, songTitle, artistName]);
  const isAntiHero =
    songTitle.toLowerCase().includes('anti-hero') ||
    songId.toLowerCase().includes('anti-hero');

  if (isAntiHero) {
    return (
      <AppScreen style={styles.screen}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
            <AppText variant="pageSubtitle" color={colors.white}>
              Now playing
            </AppText>
            <AppText variant="pageTitle" color={colors.white} style={styles.heroTitle}>
              Anti-Hero
            </AppText>
            <AppText variant="itemMeta" color={colors.white}>
              {artistName || 'Taylor Swift'}
            </AppText>
          </View>

          <View style={styles.buttonRow}>
            <AppButton label="Play" onPress={() => {}} style={styles.button} />
            <AppButton
              label="Save"
              variant="secondary"
              onPress={() => {}}
              style={styles.button}
            />
          </View>

          <View style={[styles.lyricsCard, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
            <AppText variant="sectionHeader" color={colors.textSecondary}>
              Verse 1
            </AppText>

            {antiHeroLines.map((line, index) => (
              <AppText
                key={`${line}-${index}`}
                variant="pageSubtitle"
                style={styles.lyricLine}
              >
                {line}
              </AppText>
            ))}
          </View>
        </ScrollView>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppText variant="pageTitle">{songTitle}</AppText>
      <View style={styles.placeholder}>
        <AppText variant="pageSubtitle">
          📜  Lyrics for &quot;{songTitle}&quot; (ID: {songId}) — Sprint 2
        </AppText>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  heroCard: {
    padding: spacing.xl,
    borderRadius: radii.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    minHeight: 180,
    justifyContent: 'flex-end',
  },
  heroTitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  button: {
    flex: 1,
  },
  lyricsCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  lyricLine: {
    lineHeight: 28,
    marginTop: spacing.sm,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
