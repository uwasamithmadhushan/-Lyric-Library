import { useSavedStore } from '@/store';
import type { SavedLyric } from '@/types';

jest.mock('react-native-mmkv');

describe('savedStore', () => {
  const entry: SavedLyric = {
    lyricId: 'l1',
    songId: 's1',
    songTitle: 'Hello',
    artistName: 'Adele',
    previewText: 'Hello, it is me',
    savedAt: 1700000000,
    viewCount: 0,
  };

  beforeEach(() => {
    useSavedStore.setState({
      savedMap: {},
      savedOrder: [],
      artistMap: {},
      artistOrder: [],
      hasHydrated: false,
    });
    (useSavedStore as unknown as { persist: { clearStorage: () => void } }).persist
      .clearStorage();
  });

  it('saves and removes lyrics', () => {
    useSavedStore.getState().saveLyric(entry);
    expect(useSavedStore.getState().isSaved('s1')).toBe(true);

    useSavedStore.getState().removeLyric('s1');
    expect(useSavedStore.getState().isSaved('s1')).toBe(false);
  });

  it('returns saved list in order', () => {
    useSavedStore.getState().saveLyric(entry);
    const list = useSavedStore.getState().getSavedList();
    expect(list).toHaveLength(1);
    expect(list[0].songId).toBe('s1');
  });
});
