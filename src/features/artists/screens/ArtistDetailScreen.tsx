import React, { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, ScrollView, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppScreen, AppText, SongRow, LoadingState, ErrorState } from '@/components';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ArtistsStackParamList } from '@/app/navigationTypes';
import { useArtistById, type Song, type Album } from '../hooks/useArtistById';
import { gradients, spacing, radii, shadows } from '@/theme';
import { useTheme } from '@/hooks/useTheme';

type Props = Readonly<NativeStackScreenProps<ArtistsStackParamList, 'ArtistDetail'>>;

function SectionHeader({ label, color }: Readonly<{ label: string; color: string }>) {
  return (
    <AppText variant="sectionHeader" color={color} style={styles.sectionHeader}>
      {label}
    </AppText>
  );
}

function AlbumRow({
  album,
  onPress,
  colors,
}: Readonly<{
  album: Album;
  onPress: () => void;
  colors: { bgElevated: string; border: string; textTertiary: string; primaryLight: string; primary: string };
}>) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.albumRow, { backgroundColor: colors.bgElevated, borderColor: colors.border }, pressed && styles.pressed]}>
      <View style={styles.albumInfo}>
        <AppText variant="itemTitle">{album.name}</AppText>
        <AppText variant="itemMeta" color={colors.textTertiary}>
          {album.songCount} songs • {album.year}
        </AppText>
      </View>

      <View style={[styles.browsePill, { backgroundColor: colors.primaryLight }]}>
        <AppText variant="actionLabel" color={colors.primary}>
          Browse
        </AppText>
      </View>
    </Pressable>
  );
}

export default function ArtistDetailScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const { artistId, artistName } = route.params;
  const { data: artist, isLoading, isError, refetch } = useArtistById(artistId);

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      parent?.setOptions({ tabBarStyle: { display: 'none' } });
      return () => parent?.setOptions({ tabBarStyle: undefined });
    }, [navigation]),
  );

  const handleSongPress = (song: Song) => {
    navigation.navigate('Lyrics', {
      songId: song.id,
      songTitle: song.title,
      artistName: artist?.name ?? artistName,
    });
  };

  const handleAlbumPress = (album: Album) => {
    navigation.navigate('AlbumDetail', {
      albumId: album.id,
      albumName: album.name,
      artistId,
      artistName: artist?.name ?? artistName,
    });
  };

  if (isLoading) {
    return (
      <AppScreen>
        <LoadingState message="Loading artist profile..." />
      </AppScreen>
    );
  }

  if (isError || !artist) {
    return (
      <AppScreen>
        <ErrorState message="Could not load artist." onRetry={refetch} />
      </AppScreen>
    );
  }

  return (
    <AppScreen style={[styles.screen, { backgroundColor: colors.bgPrimary }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <AppText variant="pageSubtitle" color={colors.textPrimary} style={styles.backChevron}>
          ‹
        </AppText>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator>
        <View style={styles.header}>
          <LinearGradient
            colors={[...gradients.gradient1.colors]}
            start={gradients.gradient1.start}
            end={gradients.gradient1.end}
            style={styles.avatar}
          >
            <AppText variant="avatarLetter" color={colors.white}>
              {artist.name.charAt(0).toUpperCase()}
            </AppText>
          </LinearGradient>

          <AppText variant="detailTitle" center>
            {artist.name}
          </AppText>
          <AppText variant="pageSubtitle" center>
            {artist.songCount} songs available
          </AppText>
        </View>

        <SectionHeader label="POPULAR SONGS" color={colors.textTertiary} />
        {artist.popularSongs.map((song) => (
          <SongRow
            key={song.id}
            title={song.title}
            meta={`${song.album} • ${song.year}`}
            onPress={() => handleSongPress(song)}
          />
        ))}

        <SectionHeader label="ALBUMS" color={colors.textTertiary} />
        {artist.albums.map((album) => (
          <AlbumRow key={album.id} album={album} onPress={() => handleAlbumPress(album)} colors={colors} />
        ))}

        <View style={styles.bottomPad} />
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
  },
  backButton: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    zIndex: 10,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backChevron: {
    fontSize: 30,
    lineHeight: 32,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.huge,
    paddingBottom: spacing.xxl,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.avatarGlow,
  },
  sectionHeader: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  albumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.lg,
    borderWidth: 2,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  albumInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  browsePill: {
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
  },
  pressed: {
    opacity: 0.85,
  },
  bottomPad: {
    height: spacing.xl,
  },
});
