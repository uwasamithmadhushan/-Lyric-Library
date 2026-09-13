import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Pressable, TextInput } from 'react-native';
import { AppScreen, AppText } from '@/components';
import { spacing } from '@/theme';
import { useTheme } from '@/hooks/useTheme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { GenresStackParamList } from '@/app/navigationTypes';
import { useNavigation } from '@react-navigation/native';

const GENRES = [
  'Pop','Rock','Hip Hop','R&B','Country','Jazz','Electronic','Indie','Classical','K-Pop','Alternative','Soul'
] as const;

const GENRE_SONG_COUNTS: Record<(typeof GENRES)[number], number> = {
  Pop: 186,
  Rock: 142,
  'Hip Hop': 168,
  'R&B': 97,
  Country: 74,
  Jazz: 53,
  Electronic: 121,
  Indie: 88,
  Classical: 41,
  'K-Pop': 109,
  Alternative: 116,
  Soul: 62,
};

export default function GenresScreen() {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const navigation = useNavigation<NativeStackNavigationProp<GenresStackParamList>>();

  const filtered = GENRES.filter(g => g.toLowerCase().includes(query.toLowerCase()));

  return (
    <AppScreen>
      <View style={styles.container}>
        <AppText variant="pageTitle">Genres</AppText>
        <AppText variant="pageSubtitle">Explore lyrics by genre</AppText>

        <TextInput
          placeholder="Search genres..."
          value={query}
          onChangeText={setQuery}
          placeholderTextColor={colors.textTertiary}
          style={[styles.input, { backgroundColor: colors.bgElevated, color: colors.textPrimary, borderColor: colors.border }]}
        />

          <FlatList
          data={filtered}
          keyExtractor={item => item}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          renderItem={({ item }) => (
            <Pressable onPress={() => navigation.navigate('GenreDetail', { genre: item })} style={[styles.card, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
              <AppText variant="pageSubtitle">{item}</AppText>
              <AppText variant="itemMeta">{GENRE_SONG_COUNTS[item]} songs</AppText>
            </Pressable>
          )}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xxl },
  input: {
    padding: spacing.sm,
    borderRadius: 8,
    marginVertical: spacing.md,
    borderWidth: 1,
  },
  card: {
    padding: spacing.md,
    borderRadius: 10,
    marginBottom: spacing.md,
    width: '48%',
    borderWidth: 1,
  }
  ,
  columnWrapper: {
    justifyContent: 'space-between',
  }
});
