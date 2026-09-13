import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppScreen, AppText, LoadingState, ErrorState, EmptyState } from '@/components';
import { addRecentlyViewed } from '@/store/localState';
import { useSavedStore } from '@/store';
import { toggleSavedLyric } from '@/store/savedLyricsActions';
import { useLyrics, useSongById } from '@/hooks';
import { fontFamily, fontWeight, radii, spacing, shadows } from '@/theme';
import { useTheme } from '@/hooks/useTheme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SongsStackParamList } from '@/app/navigationTypes';
import type { LyricsSection } from '@/types';
import { SongPlayer } from '../components/SongPlayer';

type Props = NativeStackScreenProps<SongsStackParamList, 'Lyrics'>;

/** Professional section labels — matches POPULAR SONGS / ALBUMS chrome. */
function formatSectionLabel(label: string): string {
  const cleaned = label.trim().replace(/^\[|\]$/g, '').replace(/:$/, '').trim();
  if (!cleaned || /^lyrics$/i.test(cleaned)) return '';

  const lower = cleaned.toLowerCase().replace(/\s+/g, ' ');
  if (/^pre[-\s]?chorus(\s*\d+)?$/.test(lower)) {
    const num = lower.match(/\d+/)?.[0];
    return num ? `PRE-CHORUS ${num}` : 'PRE-CHORUS';
  }
  if (/^chorus(\s*\d+)?$/.test(lower)) {
    const num = lower.match(/\d+/)?.[0];
    return num ? `CHORUS ${num}` : 'CHORUS';
  }
  if (/^verse(\s*\d+)?$/.test(lower)) {
    const num = lower.match(/\d+/)?.[0];
    return num ? `VERSE ${num}` : 'VERSE';
  }
  if (/^bridge(\s*\d+)?$/.test(lower)) {
    const num = lower.match(/\d+/)?.[0];
    return num ? `BRIDGE ${num}` : 'BRIDGE';
  }
  if (/^intro$/.test(lower)) return 'INTRO';
  if (/^outro$/.test(lower)) return 'OUTRO';
  if (/^hook$/.test(lower)) return 'HOOK';
  if (/^refrain$/.test(lower)) return 'REFRAIN';

  return cleaned.toUpperCase();
}

function LyricSectionCard({
  section,
  ink,
  muted,
  sheetBg,
  rule,
}: Readonly<{
  section: LyricsSection;
  ink: string;
  muted: string;
  sheetBg: string;
  rule: string;
}>) {
  const heading = formatSectionLabel(section.label);

  return (
    <View style={[styles.sectionCard, { backgroundColor: sheetBg, borderColor: rule }]}>
      {heading ? (
        <AppText variant="sectionHeader" color={muted} style={styles.sectionLabel} center>
          {heading}
        </AppText>
      ) : null}

      <View style={styles.sectionBody}>
        {section.lines.map((line, index) =>
          line ? (
            <AppText
              key={`${section.label}-${index}-${line}`}
              variant="lyricLine"
              style={[styles.lyricLine, { color: ink }]}
              center
            >
              {line}
            </AppText>
          ) : (
            <View key={`${section.label}-gap-${index}`} style={styles.lineGap} />
          ),
        )}
      </View>
    </View>
  );
}

function LyricManuscript({
  title,
  artistName,
  sections,
  sheetBg,
  ink,
  muted,
  rule,
}: Readonly<{
  title: string;
  artistName: string;
  sections: LyricsSection[];
  sheetBg: string;
  ink: string;
  muted: string;
  rule: string;
}>) {
  return (
    <View style={styles.manuscript}>
      <View style={[styles.titleCard, { backgroundColor: sheetBg, borderColor: rule }]}>
        <AppText style={[styles.songTitle, { color: ink }]} center>
          {title}
        </AppText>
        <AppText style={[styles.artistLine, { color: muted }]} center>
          {artistName}
        </AppText>
      </View>

      {sections.map((section, sectionIndex) => (
        <LyricSectionCard
          key={`${section.label}-${sectionIndex}`}
          section={section}
          ink={ink}
          muted={muted}
          sheetBg={sheetBg}
          rule={rule}
        />
      ))}
    </View>
  );
}

/**
 * Lyrics Display Screen — preview player + section cards (app chrome).
 */
export default function LyricsScreen({ route }: Readonly<Props>) {
  const { colors } = useTheme();
  const { songId, songTitle, artistName } = route.params;
  const { data: lyrics, isLoading, isError, refetch, isFetching } = useLyrics(
    songId,
    songTitle,
    artistName,
  );
  const { data: song, isLoading: isSongLoading } = useSongById(
    songId,
    songTitle,
    artistName,
  );
  const savedMap = useSavedStore((state) => state.savedMap);
  const isSaved = Boolean(savedMap[songId]);

  useEffect(() => {
    if (songId && songTitle) {
      addRecentlyViewed({ songId, songTitle, artistName });
    }
  }, [songId, songTitle, artistName]);

  const displayTitle = lyrics?.songTitle || songTitle;
  const displayArtist = lyrics?.artistName || artistName || 'Unknown artist';

  const washColors = [colors.bgPrimary, colors.bgSecondary, colors.bgPrimary] as const;

  const handleToggleSave = () => {
    const preview =
      lyrics?.sections
        ?.flatMap((section) => section.lines)
        .filter(Boolean)
        .slice(0, 2)
        .join(' / ') ?? '';

    toggleSavedLyric({
      songId,
      songTitle: displayTitle,
      artistName: displayArtist,
      previewText: preview,
    });
  };

  if (isLoading || (isFetching && !lyrics)) {
    return (
      <AppScreen>
        <LoadingState message="Loading lyrics..." />
      </AppScreen>
    );
  }

  if (isError) {
    return (
      <AppScreen>
        <ErrorState message="Could not load lyrics." onRetry={refetch} />
      </AppScreen>
    );
  }

  if (!lyrics || lyrics.sections.every((section) => section.lines.length === 0)) {
    return (
      <AppScreen>
        <EmptyState
          title="Lyrics unavailable"
          subtitle={`No public lyrics found for "${songTitle}" by ${artistName || 'Unknown artist'}. Many local / rare tracks are not in online lyric databases.`}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen style={styles.screen} padded={false} backgroundColor={colors.bgPrimary}>
      <LinearGradient colors={[...washColors]} style={StyleSheet.absoluteFill} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.topBar}>
          <View style={styles.topMeta}>
            <AppText variant="sectionHeader" color={colors.textTertiary}>
              NOW READING
            </AppText>
            <AppText variant="itemTitle" color={colors.textPrimary} numberOfLines={1}>
              {displayTitle}
            </AppText>
          </View>
          <Pressable
            onPress={handleToggleSave}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? 'Remove from saved lyrics' : 'Save lyrics'}
            style={styles.saveHit}
          >
            <AppText
              variant="actionLabel"
              color={isSaved ? colors.primary : colors.textSecondary}
              style={styles.saveGlyph}
            >
              {isSaved ? '♥' : '♡'}
            </AppText>
          </Pressable>
        </View>

        <SongPlayer
          title={displayTitle}
          artistName={displayArtist}
          albumTitle={lyrics.albumTitle || song?.albumTitle}
          artworkUrl={song?.artworkUrl}
          previewUrl={song?.previewUrl}
          isTrackLoading={isSongLoading}
        />

        <LyricManuscript
          title={displayTitle}
          artistName={displayArtist}
          sections={lyrics.sections}
          sheetBg={colors.bgElevated}
          ink={colors.textPrimary}
          muted={colors.textTertiary}
          rule={colors.border}
        />
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.massive,
    gap: spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  topMeta: {
    flex: 1,
    gap: spacing.xs,
  },
  saveHit: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  saveGlyph: {
    fontSize: 22,
    lineHeight: 26,
  },
  manuscript: {
    gap: spacing.md,
  },
  titleCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    ...shadows.card,
  },
  songTitle: {
    fontFamily: fontFamily.heading,
    fontSize: 26,
    fontWeight: fontWeight.bold,
    lineHeight: 32,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  artistLine: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    fontWeight: fontWeight.medium,
    marginTop: spacing.sm,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  sectionCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    ...shadows.card,
  },
  sectionLabel: {
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  sectionBody: {
    alignItems: 'center',
    width: '100%',
    gap: 4,
  },
  lyricLine: {
    fontFamily: fontFamily.body,
    fontSize: 16,
    fontWeight: fontWeight.regular,
    lineHeight: 28,
    textAlign: 'center',
    maxWidth: 420,
    paddingHorizontal: spacing.sm,
  },
  lineGap: {
    height: spacing.sm,
  },
});
