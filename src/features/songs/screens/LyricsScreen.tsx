import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { AppScreen, AppText, LoadingState, ErrorState, EmptyState } from '@/components';
import { addRecentlyViewed } from '@/store/localState';
import { useLyrics, useSongById } from '@/hooks';
import { radii, spacing } from '@/theme';
import { useTheme } from '@/hooks/useTheme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SongsStackParamList } from '@/app/navigationTypes';
import { SongPlayer } from '../components/SongPlayer';

type Props = NativeStackScreenProps<SongsStackParamList, 'Lyrics'>;

/**
 * Lyrics Display Screen — now-playing player + lyrics from APIs.
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

  useEffect(() => {
    if (songId && songTitle) {
      addRecentlyViewed({ songId, songTitle, artistName });
    }
  }, [songId, songTitle, artistName]);

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
          subtitle={`No lyrics found for "${songTitle}" by ${artistName || 'Unknown artist'}.`}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen style={styles.screen} padded={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <SongPlayer
          title={lyrics.songTitle || songTitle}
          artistName={lyrics.artistName || artistName}
          albumTitle={lyrics.albumTitle || song?.albumTitle}
          artworkUrl={song?.artworkUrl}
          previewUrl={song?.previewUrl}
          isTrackLoading={isSongLoading}
        />

        {lyrics.sections.map((section) => (
          <View
            key={`${section.label}-${section.lines[0] ?? 'empty'}`}
            style={[styles.lyricsCard, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}
          >
            <AppText variant="sectionHeader" color={colors.textSecondary}>
              {section.label}
            </AppText>

            {section.lines.map((line, index) =>
              line ? (
                <AppText
                  key={`${section.label}-${index}-${line}`}
                  variant="pageSubtitle"
                  style={styles.lyricLine}
                >
                  {line}
                </AppText>
              ) : (
                <View key={`${section.label}-gap-${index}`} style={styles.lineGap} />
              ),
            )}
          </View>
        ))}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.massive,
    gap: spacing.lg,
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
  lineGap: {
    height: spacing.md,
  },
});
