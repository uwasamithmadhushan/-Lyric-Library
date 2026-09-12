import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
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
    LoadingState: ({ message }: { message?: string }) => <Text>{message}</Text>,
    ErrorState: ({ message }: { message?: string }) => <Text>{message}</Text>,
    EmptyState: ({ title, subtitle }: { title: string; subtitle?: string }) => (
      <View>
        <Text>{title}</Text>
        {subtitle ? <Text>{subtitle}</Text> : null}
      </View>
    ),
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

jest.mock('@/hooks', () => ({
  useLyrics: () => ({
    data: {
      songId: '1',
      songTitle: 'Hello',
      artistName: 'Adele',
      sections: [
        {
          type: 'verse',
          label: 'Lyrics',
          lines: ["Hello, it's me", "I'm in California dreaming"],
        },
      ],
    },
    isLoading: false,
    isFetching: false,
    isError: false,
    refetch: jest.fn(),
  }),
}));

import LyricsScreen from '@/features/songs/screens/LyricsScreen';

describe('LyricsScreen', () => {
  it('renders lyrics loaded from the API hook', async () => {
    const mockRoute: RouteProp<SongsStackParamList, 'Lyrics'> = {
      key: 'test',
      name: 'Lyrics',
      params: { songId: '1', songTitle: 'Hello', artistName: 'Adele' },
    };

    const mockNav = {} as unknown as NativeStackNavigationProp<SongsStackParamList, 'Lyrics'>;
    const { getByText } = render(<LyricsScreen route={mockRoute} navigation={mockNav} />);

    await waitFor(() => {
      expect(getByText('Hello')).toBeTruthy();
      expect(getByText(/Hello, it's me/)).toBeTruthy();
    });
  });
});
