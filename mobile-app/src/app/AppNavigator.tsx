import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useTheme } from '@/hooks/useTheme';
import type {
  RootTabParamList,
  HomeStackParamList,
  ArtistsStackParamList,
  SongsStackParamList,
  SavedStackParamList,
} from './navigationTypes';

import HomeScreen from '@/features/home/screens/HomeScreen';
import ProfileSettingsScreen from '@/features/profile/screens/ProfileSettingsScreen';
import ArtistsScreen from '@/features/artists/screens/ArtistsScreen';
import ArtistDetailScreen from '@/features/artists/screens/ArtistDetailScreen';
import AlbumDetailScreen from '@/features/artists/screens/AlbumDetailScreen';
import SongsScreen from '@/features/songs/screens/SongsScreen';
import LyricsScreen from '@/features/songs/screens/LyricsScreen';
import SearchScreen from '@/features/search/screens/SearchScreen';
import SavedScreen from '@/features/saved/screens/SavedScreen';

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ArtistsStack = createNativeStackNavigator<ArtistsStackParamList>();
const SongsStack = createNativeStackNavigator<SongsStackParamList>();
const SavedStack = createNativeStackNavigator<SavedStackParamList>();

type FeatherName = React.ComponentProps<typeof Feather>['name'];

const TAB_ICONS: Record<keyof RootTabParamList, FeatherName> = {
  HomeTab: 'home',
  ArtistsTab: 'users',
  SongsTab: 'music',
  SavedTab: 'bookmark',
  ProfileTab: 'user',
};

function useStackScreenOptions() {
  const { colors: palette, fontFamily: fonts } = useTheme();
  return {
    headerShown: true,
    headerStyle: { backgroundColor: palette.bgPrimary },
    headerTitleStyle: {
      color: palette.textPrimary,
      fontFamily: fonts.heading,
      fontWeight: '700' as const,
    },
    headerTintColor: palette.primary,
    headerShadowVisible: false,
    contentStyle: { backgroundColor: palette.bgPrimary },
  };
}

function HomeStackNavigator() {
  const screenOptions = useStackScreenOptions();
  return (
    <HomeStack.Navigator screenOptions={screenOptions}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ title: 'Home' }} />
      <HomeStack.Screen name="SearchMain" component={SearchScreen} options={{ title: 'Search' }} />
      <HomeStack.Screen name="ArtistDetail" component={ArtistDetailScreen} />
      <HomeStack.Screen name="AlbumDetail" component={AlbumDetailScreen} />
      <HomeStack.Screen name="Lyrics" component={LyricsScreen} options={{ title: 'Lyrics' }} />
    </HomeStack.Navigator>
  );
}

function ArtistsStackNavigator() {
  const screenOptions = useStackScreenOptions();
  return (
    <ArtistsStack.Navigator screenOptions={screenOptions}>
      <ArtistsStack.Screen name="ArtistsList" component={ArtistsScreen} options={{ title: 'Artists' }} />
      <ArtistsStack.Screen name="ArtistDetail" component={ArtistDetailScreen} />
      <ArtistsStack.Screen name="AlbumDetail" component={AlbumDetailScreen} />
      <ArtistsStack.Screen name="Lyrics" component={LyricsScreen} options={{ title: 'Lyrics' }} />
    </ArtistsStack.Navigator>
  );
}

function SongsStackNavigator() {
  const screenOptions = useStackScreenOptions();
  return (
    <SongsStack.Navigator screenOptions={screenOptions}>
      <SongsStack.Screen name="SongsList" component={SongsScreen} options={{ title: 'Songs' }} />
      <SongsStack.Screen name="Lyrics" component={LyricsScreen} options={{ title: 'Lyrics' }} />
    </SongsStack.Navigator>
  );
}

function SavedStackNavigator() {
  const screenOptions = useStackScreenOptions();
  return (
    <SavedStack.Navigator screenOptions={screenOptions}>
      <SavedStack.Screen name="SavedList" component={SavedScreen} options={{ title: 'Saved' }} />
      <SavedStack.Screen name="Lyrics" component={LyricsScreen} options={{ title: 'Lyrics' }} />
    </SavedStack.Navigator>
  );
}

function TabIcon({
  routeName,
  focused,
  palette,
}: Readonly<{
  routeName: keyof RootTabParamList;
  focused: boolean;
  palette: { primary: string; textTertiary: string };
}>) {
  return (
    <Feather
      name={TAB_ICONS[routeName]}
      size={20}
      color={focused ? palette.primary : palette.textTertiary}
    />
  );
}

const Tab = createBottomTabNavigator<RootTabParamList>();

export function AppNavigator() {
  const { colors: palette } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          { backgroundColor: palette.bgPrimary, borderTopColor: palette.border },
          isWide && styles.tabBarWide,
        ],
        sceneStyle: { backgroundColor: palette.bgPrimary },
        tabBarItemStyle: styles.tabBarItem,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.textTertiary,
        tabBarLabelStyle: isWide ? styles.tabLabelWide : styles.tabLabel,
        tabBarIcon: ({ focused }) => (
          <TabIcon routeName={route.name} focused={focused} palette={palette} />
        ),
        tabBarShowLabel: isWide,
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="ArtistsTab" component={ArtistsStackNavigator} options={{ tabBarLabel: 'Artists' }} />
      <Tab.Screen name="SongsTab" component={SongsStackNavigator} options={{ tabBarLabel: 'Songs' }} />
      <Tab.Screen name="SavedTab" component={SavedStackNavigator} options={{ tabBarLabel: 'Saved' }} />
      <Tab.Screen name="ProfileTab" component={ProfileSettingsScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 2,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
    height: Platform.OS === 'ios' ? 88 : 74,
  },
  tabBarWide: {
    height: 96,
    paddingVertical: 12,
  },
  tabBarItem: {
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabLabelWide: {
    fontSize: 13,
    fontWeight: '700',
  },
});
