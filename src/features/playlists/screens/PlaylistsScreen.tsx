import React, { useState } from 'react';
import { View, FlatList, Modal, TextInput, StyleSheet } from 'react-native';
import { AppScreen, AppText, AppButton } from '@/components';
import { spacing } from '@/theme';
import { useTheme } from '@/hooks/useTheme';

type Playlist = { id: string; name: string; description?: string; songs: string[] };

const initial: Playlist[] = [
  { id: 'p1', name: 'My Favorites', songs: ['s1', 's3'] },
  { id: 'p2', name: 'Workout Songs', songs: ['s2'] },
];

let playlistSeq = 3;

export default function PlaylistsScreen() {
  const { colors } = useTheme();
  const [playlists, setPlaylists] = useState<Playlist[]>(initial);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  function create() {
    if (!name.trim()) return;
    playlistSeq += 1;
    setPlaylists((p) => [
      { id: `p${playlistSeq}`, name: name.trim(), description: desc.trim(), songs: [] },
      ...p,
    ]);
    setModalOpen(false);
    setName('');
    setDesc('');
  }

  return (
    <AppScreen>
      <View style={styles.container}>
        <AppText variant="pageTitle">My Playlists</AppText>
        <AppText variant="pageSubtitle">Organize your favorite lyrics</AppText>

        <AppButton label="Create Playlist" onPress={() => setModalOpen(true)} />

        <FlatList
          data={playlists}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <View
              style={[
                styles.playlistCard,
                { backgroundColor: colors.bgElevated, borderColor: colors.border },
              ]}
            >
              <AppText variant="pageSubtitle">{item.name}</AppText>
              <AppText variant="itemMeta">{item.songs.length} songs</AppText>
            </View>
          )}
        />

        <Modal visible={modalOpen} animationType="slide" transparent>
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.modalCard,
                { backgroundColor: colors.bgElevated, borderColor: colors.border },
              ]}
            >
              <AppText variant="pageSubtitle">Create Playlist</AppText>
              <TextInput
                placeholder="Name"
                value={name}
                onChangeText={setName}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.bgPrimary,
                    color: colors.textPrimary,
                    borderColor: colors.border,
                  },
                ]}
              />
              <TextInput
                placeholder="Description"
                value={desc}
                onChangeText={setDesc}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.bgPrimary,
                    color: colors.textPrimary,
                    borderColor: colors.border,
                  },
                ]}
              />
              <View style={styles.modalActions}>
                <AppButton label="Cancel" variant="tertiary" onPress={() => setModalOpen(false)} />
                <AppButton label="Create" onPress={create} />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xxl,
  },
  playlistCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  modalCard: {
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
  },
  input: {
    padding: 8,
    marginTop: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
});
