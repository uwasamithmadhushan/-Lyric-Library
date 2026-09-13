import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Pressable,
  Animated,
  Easing,
  LayoutChangeEvent,
  Linking,
  Platform,
} from 'react-native';
import { Audio, type AVPlaybackStatus } from 'expo-av';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components';
import { radii, spacing, shadows } from '@/theme';
import { useTheme } from '@/hooks/useTheme';
import {
  isPreviewUrlExpired,
  resolvePreviewPlaybackUrl,
  toProxiedMediaUrl,
} from '@/services/media/mediaProxy';
import { searchDeezerTrack } from '@/services/deezer/deezerApi';

const BAR_COUNT = 28;

function formatTime(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

interface SongPlayerProps {
  title: string;
  artistName: string;
  albumTitle?: string;
  artworkUrl?: string;
  previewUrl?: string;
  isTrackLoading?: boolean;
  /** `preview` = optional ~30s in-app clip; `full-listen` = licensed apps for the complete song. */
  variant?: 'preview' | 'full-listen';
}

/**
 * Audio helpers for lyrics screen.
 * In-app play is preview-only (~30s). Full tracks open in licensed apps (Spotify / YouTube / Deezer).
 * Spotify Web API does not provide downloadable full MP3 files.
 */
export function SongPlayer({
  title,
  artistName,
  albumTitle,
  artworkUrl,
  previewUrl,
  isTrackLoading = false,
  variant = 'preview',
}: Readonly<SongPlayerProps>) {
  const { colors } = useTheme();
  const soundRef = useRef<Audio.Sound | null>(null);
  const trackWidthRef = useRef(0);
  const barAnims = useMemo(
    () => Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.18)),
    [],
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [artworkFailed, setArtworkFailed] = useState(false);

  const query = `${artistName} ${title}`.trim();
  const spotifyFullUrl = `https://open.spotify.com/search/${encodeURIComponent(query)}`;
  const deezerFullUrl = `https://www.deezer.com/search/${encodeURIComponent(query)}`;
  const youtubeFullUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const [livePreviewUrl, setLivePreviewUrl] = useState<string | undefined>(previewUrl);
  const playbackUri = useMemo(
    () => resolvePreviewPlaybackUrl(livePreviewUrl),
    [livePreviewUrl],
  );
  const canAttemptPreview = Boolean(previewUrl || (title && artistName));

  useEffect(() => {
    setLivePreviewUrl(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    }).catch(() => undefined);

    return () => {
      const current = soundRef.current;
      soundRef.current = null;
      current?.unloadAsync().catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (soundRef.current) {
        await soundRef.current.unloadAsync().catch(() => undefined);
        if (!cancelled) {
          soundRef.current = null;
          setIsPlaying(false);
          setPositionMs(0);
          setDurationMs(0);
          setAudioError(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [title, artistName, previewUrl]);

  useEffect(() => {
    const loops = barAnims.map((anim, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 0.25 + ((index * 17) % 75) / 100,
            duration: 280 + (index % 5) * 90,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 0.12 + ((index * 11) % 40) / 100,
            duration: 260 + (index % 7) * 70,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ]),
      ),
    );

    if (isPlaying) {
      loops.forEach((loop) => loop.start());
    } else {
      loops.forEach((loop) => loop.stop());
      barAnims.forEach((anim) => anim.setValue(0.16));
    }

    return () => {
      loops.forEach((loop) => loop.stop());
    };
  }, [isPlaying, barAnims]);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        setAudioError('Could not play this preview.');
        setIsPlaying(false);
      }
      return;
    }

    setIsPlaying(status.isPlaying);
    setPositionMs(status.positionMillis ?? 0);
    setDurationMs(status.durationMillis ?? 0);

    if (status.didJustFinish) {
      setIsPlaying(false);
      setPositionMs(status.durationMillis ?? 0);
    }
  };

  const refreshPreviewUrl = async (): Promise<string | undefined> => {
    try {
      const match = await searchDeezerTrack(title, artistName);
      if (match?.previewUrl && !isPreviewUrlExpired(match.previewUrl)) {
        setLivePreviewUrl(match.previewUrl);
        return match.previewUrl;
      }
      // API returned an already-stale link — try once more after a tiny delay.
      const retry = await searchDeezerTrack(title, artistName);
      if (retry?.previewUrl && !isPreviewUrlExpired(retry.previewUrl)) {
        setLivePreviewUrl(retry.previewUrl);
        return retry.previewUrl;
      }
      if (retry?.previewUrl) {
        setLivePreviewUrl(retry.previewUrl);
        return retry.previewUrl;
      }
    } catch {
      // keep previous url
    }
    return undefined;
  };

  const resolveSourceUrl = async (): Promise<string | undefined> => {
    // Always mint a fresh Deezer signed URL — cached previews expire in ~15 minutes.
    const fresh = await refreshPreviewUrl();
    const candidate = fresh || (livePreviewUrl && !isPreviewUrlExpired(livePreviewUrl) ? livePreviewUrl : undefined);
    if (!candidate) return undefined;
    return resolvePreviewPlaybackUrl(candidate);
  };

  const loadSoundFromUri = async (uri: string) => {
    const attempts = Platform.OS === 'web' ? [uri, toProxiedMediaUrl(uri)] : [uri];
    let lastError: unknown;

    for (const attempt of attempts) {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: attempt },
          { shouldPlay: false, progressUpdateIntervalMillis: 120 },
          onPlaybackStatusUpdate,
        );
        const status = await sound.getStatusAsync();
        if (!status.isLoaded) {
          await sound.unloadAsync().catch(() => undefined);
          throw new Error('Preview failed to load');
        }
        return sound;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Preview failed to load');
  };

  const ensureSound = async () => {
    if (soundRef.current) return soundRef.current;
    if (!canAttemptPreview) {
      setAudioError('No 30s preview available. Use Listen full song below the lyrics.');
      return null;
    }

    setIsLoadingAudio(true);
    try {
      const uri = await resolveSourceUrl();
      if (!uri) {
        setAudioError('No 30s preview available. Use Listen full song below the lyrics.');
        return null;
      }

      const sound = await loadSoundFromUri(uri);
      soundRef.current = sound;
      return sound;
    } catch {
      setAudioError('Could not load preview audio.');
      return null;
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const handlePlayPause = async () => {
    setAudioError(null);
    try {
      const sound = await ensureSound();
      if (!sound) return;

      const status = await sound.getStatusAsync();
      if (!status.isLoaded) {
        setAudioError('Preview audio is unavailable in this browser.');
        return;
      }

      if (status.isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
        return;
      }

      if (
        status.didJustFinish ||
        (status.durationMillis && status.positionMillis >= status.durationMillis - 200)
      ) {
        await sound.setPositionAsync(0);
      }
      await sound.playAsync();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
      setAudioError('Could not play preview audio.');
      if (soundRef.current) {
        await soundRef.current.unloadAsync().catch(() => undefined);
        soundRef.current = null;
      }
    }
  };

  const handleSeek = async (event: { nativeEvent: { locationX: number } }) => {
    if (!durationMs || trackWidthRef.current <= 0) return;
    const ratio = Math.max(0, Math.min(1, event.nativeEvent.locationX / trackWidthRef.current));
    const nextPosition = Math.floor(durationMs * ratio);
    const sound = await ensureSound();
    if (!sound) return;
    await sound.setPositionAsync(nextPosition);
    setPositionMs(nextPosition);
  };

  const openFullSong = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      setAudioError('Could not open the music app link.');
    }
  };

  const progress = durationMs > 0 ? positionMs / durationMs : 0;
  const showArt = Boolean(artworkUrl) && !artworkFailed;

  if (variant === 'full-listen') {
    return (
      <View style={styles.wrap}>
        <AppText variant="sectionHeader" color={colors.textTertiary} style={styles.sectionEyebrow}>
          LISTEN FULL SONG
        </AppText>
        <View style={[styles.card, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
          <View style={styles.body}>
            <AppText variant="itemTitle" color={colors.textPrimary} numberOfLines={2}>
              {title}
            </AppText>
            <AppText variant="itemMeta" color={colors.textSecondary} numberOfLines={1}>
              {artistName}
              {albumTitle ? ` · ${albumTitle}` : ''}
            </AppText>
            <AppText variant="itemMeta" color={colors.textTertiary}>
              Full original tracks play in licensed apps (Spotify, YouTube, Deezer). Apps cannot
              legally stream or download complete MP3 files from the Spotify API.
            </AppText>
            <View style={styles.fullSongRow}>
              <Pressable
                onPress={() => void openFullSong(spotifyFullUrl)}
                style={[styles.fullSongBtn, { backgroundColor: colors.primary }]}
                accessibilityRole="link"
                accessibilityLabel="Open full song on Spotify"
              >
                <Feather name="external-link" size={16} color={colors.white} />
                <AppText variant="actionLabel" color={colors.white}>
                  Spotify
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => void openFullSong(youtubeFullUrl)}
                style={[styles.fullSongBtnSecondary, { borderColor: colors.border }]}
                accessibilityRole="link"
                accessibilityLabel="Open full song on YouTube"
              >
                <Feather name="play-circle" size={16} color={colors.textSecondary} />
                <AppText variant="actionLabel" color={colors.textSecondary}>
                  YouTube
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => void openFullSong(deezerFullUrl)}
                style={[styles.fullSongBtnSecondary, { borderColor: colors.border }]}
                accessibilityRole="link"
                accessibilityLabel="Open full song on Deezer"
              >
                <Feather name="music" size={16} color={colors.textSecondary} />
                <AppText variant="actionLabel" color={colors.textSecondary}>
                  Deezer
                </AppText>
              </Pressable>
            </View>
            {audioError ? (
              <AppText variant="itemMeta" color={colors.error} center>
                {audioError}
              </AppText>
            ) : null}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <AppText variant="sectionHeader" color={colors.textTertiary} style={styles.sectionEyebrow}>
        30S PREVIEW
      </AppText>

      <View style={[styles.card, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.artWrap}>
            {showArt ? (
              <Image
                source={{ uri: artworkUrl }}
                style={styles.artwork}
                onError={() => setArtworkFailed(true)}
              />
            ) : (
              <View
                style={[styles.artwork, styles.artworkFallback, { backgroundColor: colors.primaryLight }]}
              >
                <AppText variant="avatarLetter" color={colors.white}>
                  {title.charAt(0).toUpperCase()}
                </AppText>
              </View>
            )}
          </View>

          <AppText variant="itemMeta" color={colors.white} style={styles.nowPlaying}>
            Optional preview
          </AppText>
          <AppText variant="pageTitle" color={colors.white} numberOfLines={2} style={styles.title}>
            {title}
          </AppText>
          <AppText variant="pageSubtitle" color={colors.white} numberOfLines={1}>
            {artistName}
            {albumTitle ? ` · ${albumTitle}` : ''}
          </AppText>
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.beatRow}>
            {barAnims.map((anim, index) => (
              <Animated.View
                key={`beat-${index}`}
                style={[
                  styles.beatBar,
                  isPlaying ? styles.beatBarActive : styles.beatBarIdle,
                  {
                    backgroundColor: isPlaying ? colors.primary : colors.border,
                    height: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [8, 56],
                    }),
                  },
                ]}
              />
            ))}
          </View>

          <Pressable
            onPress={handleSeek}
            onLayout={(event: LayoutChangeEvent) => {
              trackWidthRef.current = event.nativeEvent.layout.width;
            }}
            style={[styles.track, { backgroundColor: colors.bgSecondary }]}
            accessibilityRole="adjustable"
            accessibilityLabel="Seek preview position"
          >
            <View
              style={[
                styles.trackFill,
                { width: `${Math.max(2, progress * 100)}%`, backgroundColor: colors.primary },
              ]}
            />
            <View
              style={[
                styles.thumb,
                {
                  left: `${Math.max(0, Math.min(100, progress * 100))}%`,
                  backgroundColor: colors.primary,
                  borderColor: colors.bgElevated,
                },
              ]}
            />
          </Pressable>

          <View style={styles.timeRow}>
            <AppText variant="itemMeta" color={colors.textTertiary}>
              {formatTime(positionMs)}
            </AppText>
            <AppText variant="itemMeta" color={colors.textTertiary}>
              {formatTime(durationMs)}
            </AppText>
          </View>

          <View style={styles.controls}>
            <Pressable
              onPress={async () => {
                const sound = await ensureSound();
                if (!sound) return;
                await sound.setPositionAsync(Math.max(0, positionMs - 5000));
              }}
              style={[styles.sideBtn, { borderColor: colors.border }]}
              accessibilityLabel="Back 5 seconds"
            >
              <Feather name="rotate-ccw" size={18} color={colors.textSecondary} />
            </Pressable>

            <Pressable
              onPress={handlePlayPause}
              disabled={isLoadingAudio || isTrackLoading || !canAttemptPreview}
              style={[
                styles.playBtn,
                { backgroundColor: colors.primary },
                (isLoadingAudio || isTrackLoading || !canAttemptPreview) && styles.playBtnDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? 'Pause preview' : 'Play preview'}
            >
              {isLoadingAudio || isTrackLoading ? (
                <AppText variant="itemMeta" color={colors.white}>
                  ...
                </AppText>
              ) : (
                <Feather name={isPlaying ? 'pause' : 'play'} size={28} color={colors.white} />
              )}
            </Pressable>

            <Pressable
              onPress={async () => {
                const sound = await ensureSound();
                if (!sound) return;
                const next = Math.min(durationMs || positionMs + 5000, positionMs + 5000);
                await sound.setPositionAsync(next);
              }}
              style={[styles.sideBtn, { borderColor: colors.border }]}
              accessibilityLabel="Forward 5 seconds"
            >
              <Feather name="rotate-cw" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          <AppText variant="itemMeta" color={colors.textTertiary} center>
            {previewUrl
              ? '~30 second preview · full song links are under the lyrics'
              : isTrackLoading
                ? 'Loading preview...'
                : 'No preview clip · use Listen full song under the lyrics'}
          </AppText>

          {audioError ? (
            <AppText variant="itemMeta" color={colors.error} center>
              {audioError}
            </AppText>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  sectionEyebrow: {
    letterSpacing: 1.2,
  },
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadows.card,
  },
  hero: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  artWrap: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  artwork: {
    width: 168,
    height: 168,
    borderRadius: radii.xl,
  },
  artworkFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  nowPlaying: {
    opacity: 0.9,
    marginBottom: spacing.xs,
  },
  title: {
    marginBottom: spacing.xs,
  },
  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  beatRow: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 3,
    marginBottom: spacing.xs,
  },
  beatBar: {
    flex: 1,
    borderRadius: 999,
    minHeight: 8,
  },
  beatBarActive: {
    opacity: 1,
  },
  beatBarIdle: {
    opacity: 0.55,
  },
  track: {
    height: 8,
    borderRadius: 999,
    overflow: 'visible',
    justifyContent: 'center',
  },
  trackFill: {
    height: 8,
    borderRadius: 999,
  },
  thumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -8,
    borderWidth: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    marginVertical: spacing.sm,
  },
  sideBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
    ...shadows.card,
  },
  playBtnDisabled: {
    opacity: 0.55,
  },
  fullSongRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  fullSongBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  fullSongBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
