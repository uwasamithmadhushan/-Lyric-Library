import { useUIStore } from '@/store';

jest.mock('react-native-mmkv');

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      textSize: 'normal',
      themeMode: 'system',
      recentSearches: [],
      hasHydrated: false,
    });
    (useUIStore as unknown as { persist: { clearStorage: () => void } }).persist
      .clearStorage();
  });

  it('updates text size', () => {
    useUIStore.getState().setTextSize('large');
    expect(useUIStore.getState().textSize).toBe('large');
  });

  it('updates theme mode', () => {
    useUIStore.getState().setThemeMode('dark');
    expect(useUIStore.getState().themeMode).toBe('dark');
  });

  it('stores recent searches uniquely', () => {
    useUIStore.getState().addRecentSearch('hello');
    useUIStore.getState().addRecentSearch('hello');
    expect(useUIStore.getState().recentSearches).toHaveLength(1);
  });
});
