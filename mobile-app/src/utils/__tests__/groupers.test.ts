import { groupByInitial, groupArtistsByLetter, groupBySectionType, sortAlphabetical } from '@/utils';
import type { Artist, Lyrics } from '@/types';

describe('groupers', () => {
  it('groups by initial letter', () => {
    const items = [
      { name: 'Adele' },
      { name: 'Ariana Grande' },
      { name: 'Coldplay' },
    ];
    const grouped = groupByInitial(items, 'name');
    expect(grouped.A).toHaveLength(2);
    expect(grouped.C).toHaveLength(1);
  });

  it('groups artists into section list shape', () => {
    const artists: Artist[] = [
      { id: 'a1', name: 'Adele', songCount: 10, albums: [] },
      { id: 'a2', name: 'Coldplay', songCount: 12, albums: [] },
    ];
    const grouped = groupArtistsByLetter(artists);
    expect(grouped[0].letter).toBe('A');
    expect(grouped[1].letter).toBe('C');
  });

  it('groups lyrics sections by type', () => {
    const lyrics: Lyrics = {
      songId: 's1',
      songTitle: 'Test',
      artistName: 'Artist',
      sections: [
        { type: 'verse', label: 'Verse 1', lines: ['Line 1'] },
        { type: 'chorus', label: 'Chorus', lines: ['Line 2'] },
        { type: 'verse', label: 'Verse 2', lines: ['Line 3'] },
      ],
    };
    const grouped = groupBySectionType(lyrics);
    expect(grouped.verse).toHaveLength(2);
    expect(grouped.chorus).toHaveLength(1);
  });

  it('sorts alphabetically by key', () => {
    const items = [
      { title: 'Zeta' },
      { title: 'Alpha' },
      { title: 'Beta' },
    ];
    const sorted = sortAlphabetical(items, 'title');
    expect(sorted.map((i) => i.title)).toEqual(['Alpha', 'Beta', 'Zeta']);
  });
});
