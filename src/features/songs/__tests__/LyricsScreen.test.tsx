import React from 'react';
import { render } from '@testing-library/react-native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SongsStackParamList } from '@/app/navigationTypes';

jest.mock('@/components', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Text, View } = require('react-native');
  return {
    AppScreen: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    AppText: ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>,
    AppButton: ({ label }: { label: string }) => <Text>{label}</Text>,
  };
});

jest.mock('@/store/localState', () => ({
  addRecentlyViewed: jest.fn(),
}));

jest.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      primary: '#2563EB',
      white: '#FFFFFF',
      bgElevated: '#FFFFFF',
      border: '#E5E7EB',
      textSecondary: '#6B7280',
    },
  }),
}));

import LyricsScreen from '@/features/songs/screens/LyricsScreen';

describe('LyricsScreen', () => {
  it('renders the Anti-Hero lyric page', () => {
    const mockRoute: RouteProp<SongsStackParamList, 'Lyrics'> = {
      key: 'test',
      name: 'Lyrics',
      params: { songId: 'anti-hero', songTitle: 'Anti-Hero', artistName: 'Taylor Swift' },
    };

    const mockNav = {} as unknown as NativeStackNavigationProp<SongsStackParamList, 'Lyrics'>;
    const { getByText } = render(<LyricsScreen route={mockRoute} navigation={mockNav} />);

    expect(getByText('Anti-Hero')).toBeTruthy();
    expect(getByText(/I'm the problem/)).toBeTruthy();
  });
});
