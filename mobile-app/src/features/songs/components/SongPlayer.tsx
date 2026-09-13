import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Pressable,
  Animated,
  Easing,
  LayoutChangeEvent,
} from 'react-native';
import { Audio, type AVPlaybackStatus } from 'expo-av';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components';
import { radii, spacing, shadows } from '@/theme';
import { useTheme } from '@/hooks/useTheme';

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
}

/**
 * Full-screen style now-playing card with beat bars + scrubber.
 * Uses iTunes preview stream (API does not expose licensed full tracks).
 */
export function SongPlayer({
  title,
  artistName,
  albumTitle,
  artworkUrl,
  previewUrl,
  isTrackLoading = false,
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
  }, [previewUrl]);

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
        setAudioError('Could not play this track.');
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

  const ensureSound = async () => {
    if (!previewUrl) {
      setAudioError('No playable audio found for this song.');
      return null;
    }
    if (soundRef.current) return soundRef.current;

    setIsLoadingAudio(true);
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: previewUrl },
        { shouldPlay: false, progressUpdateIntervalMillis: 120 },
        onPlaybackStatusUpdate,
      );
      soundRef.current = sound;
      return sound;
    } catch {
      setAudioError('Could not load audio stream.');
      return null;
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const handlePlayPause = async () => {
    setAudioError(null);
    const sound = await ensureSound();
    if (!sound) return;

    const status = await sound.getStatusAsync();
    if (!status.isLoaded) return;

    if (status.isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
      return;
    }

    if (status.didJustFinish || (status.durationMillis && status.positionMillis >= status.durationMillis - 200)) {
      await sound.setPositionAsync(0);
    }
    await sound.playAsync();
    setIsPlaying(true);
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

  const progress = durationMs > 0 ? positionMs / durationMs : 0;
  const showArt = Boolean(artworkUrl) && !artworkFailed;

  return (
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
            <View style={[styles.artwork, styles.artworkFallback, { backgroundColor: colors.primaryLight }]}>
              <AppText variant="avatarLetter" color={colors.white}>
                {title.charAt(0).toUpperCase()}
              </AppText>
            </View>
          )}
        </View>

        <AppText variant="itemMeta" color={colors.white} style={styles.nowPlaying}>
          Now Playing
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
          accessibilityLabel="Seek song position"
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
            disabled={isLoadingAudio || isTrackLoading || !previewUrl}
            style={[
              styles.playBtn,
              { backgroundColor: colors.primary },
              (isLoadingAudio || isTrackLoading || !previewUrl) && styles.playBtnDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
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
            ? '30-second preview stream'
            : isTrackLoading
              ? 'Loading audio...'
              : 'No audio stream for this track'}
        </AppText>

        {audioError ? (
          <AppText variant="itemMeta" color={colors.error} center>
            {audioError}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
