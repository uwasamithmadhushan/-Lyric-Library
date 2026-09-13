import { filterSongs, filterBySearch, filterByGenre, filterResultsByType } from '@/utils';
import type { SearchResult, Song } from '@/types';

describe('filters', () => {
  const songs: Song[] = [
    { id: 's1', title: 'Hello', artistId: 'a1', artistName: 'Adele', genre: 'Pop' },
    { id: 's2', title: 'Yellow', artistId: 'a2', artistName: 'Coldplay', genre: 'Rock' },
  ];

  it('filters songs by title or artist', () => {
    expect(filterSongs(songs, 'adele')).toHaveLength(1);
    expect(filterSongs(songs, 'yellow')).toHaveLength(1);
  });

  it('filters items by search fields', () => {
    const items = [
      { name: 'Taylor Swift', genre: 'Pop' },
      { name: 'Drake', genre: 'Hip-Hop' },
    ];
    const filtered = filterBySearch(items, 'taylor', ['name']);
    expect(filtered).toHaveLength(1);
  });

  it('filters songs by genre', () => {
    expect(filterByGenre(songs, 'rock')).toHaveLength(1);
    expect(filterByGenre(songs, 'all')).toHaveLength(2);
  });

  it('filters search results by type', () => {
    const results: SearchResult[] = [
      { id: 'r1', type: 'song', title: 'Hello', subtitle: 'Adele', referenceId: 's1' },
      { id: 'r2', type: 'artist', title: 'Adele', subtitle: '10 songs', referenceId: 'a1' },
    ];
    expect(filterResultsByType(results, 'song')).toHaveLength(1);
  });
});
