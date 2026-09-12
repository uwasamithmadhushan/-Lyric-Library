import React from 'react';
import { render } from '@testing-library/react-native';
import type { RouteProp } from '@react-navigation/native';
import type { SongsStackParamList } from '@/app/navigationTypes';

jest.mock('@/components', () => ({
  AppScreen: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  AppText: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  AppButton: ({ label }: { label: string }) => <>{label}</>,
}));

import LyricsScreen from '@/features/songs/screens/LyricsScreen';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

describe('LyricsScreen', () => {
  it('renders the Anti-Hero lyric page', () => {
    const mockRoute: RouteProp<SongsStackParamList, 'Lyrics'> = {
      key: 'test',
      name: 'Lyrics',
      params: { songId: 'anti-hero', songTitle: 'Anti-Hero', artistName: 'Taylor Swift' },
    } as RouteProp<SongsStackParamList, 'Lyrics'>;

    const mockNav = {} as unknown as NativeStackNavigationProp<SongsStackParamList, 'Lyrics'>;
    const { getByText } = render(<LyricsScreen route={mockRoute} navigation={mockNav} />);

    expect(getByText((text) => String(text).includes('Anti-Hero'))).toBeTruthy();
    expect(getByText((text) => String(text).includes("I'm the problem"))).toBeTruthy();
  });
});
