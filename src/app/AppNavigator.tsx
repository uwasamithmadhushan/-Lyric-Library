import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, StyleSheet, Platform, useWindowDimensions, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppText } from '@/components';
import { useNavigation, type NavigationProp } from '@react-navigation/native';

import { useTheme } from '@/hooks/useTheme';
import type {
  RootTabParamList,
  ArtistsStackParamList,
  SongsStackParamList,
  SearchStackParamList,
  SavedStackParamList,
} from './navigationTypes';

import HomeScreen from '@/features/home/screens/HomeScreen';
import ProfileSettingsScreen from '@/features/profile/screens/ProfileSettingsScreen';

// ─── Screen Imports ──────────────────────────────────────────────
import ArtistsScreen      from '@/features/artists/screens/ArtistsScreen';
import ArtistDetailScreen from '@/features/artists/screens/ArtistDetailScreen';
import AlbumDetailScreen  from '@/features/artists/screens/AlbumDetailScreen';
import SongsScreen        from '@/features/songs/screens/SongsScreen';
import LyricsScreen       from '@/features/songs/screens/LyricsScreen';
import SearchScreen       from '@/features/search/screens/SearchScreen';
import SavedScreen        from '@/features/saved/screens/SavedScreen';

// ─── Stack Navigators ────────────────────────────────────────────

const ArtistsStack = createNativeStackNavigator<ArtistsStackParamList>();
const SongsStack   = createNativeStackNavigator<SongsStackParamList>();
const SearchStack  = createNativeStackNavigator<SearchStackParamList>();
const SavedStack   = createNativeStackNavigator<SavedStackParamList>();

function ArtistsStackNavigator() {
  const { colors: palette } = useTheme();
  return (
    <ArtistsStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: palette.bgPrimary },
        headerTitleStyle: { color: palette.textPrimary, fontWeight: '700' },
        headerTintColor: palette.primary,
        headerShadowVisible: false,
        headerRight: () => <HeaderActions />,
      }}
    >
      <ArtistsStack.Screen name="ArtistsList" component={ArtistsScreen} />
    <ArtistsStack.Navigator screenOptions={{ headerShown: false }}>
      <ArtistsStack.Screen name="ArtistsList"  component={ArtistsScreen} />
      <ArtistsStack.Screen name="ArtistDetail" component={ArtistDetailScreen} />
      <ArtistsStack.Screen name="AlbumDetail"  component={AlbumDetailScreen} />
      <ArtistsStack.Screen name="Lyrics"       component={LyricsScreen} />
    </ArtistsStack.Navigator>
  );
}

function SongsStackNavigator() {
  const { colors: palette } = useTheme();
  return (
    <SongsStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: palette.bgPrimary },
        headerTitleStyle: { color: palette.textPrimary, fontWeight: '700' },
        headerTintColor: palette.primary,
        headerShadowVisible: false,
        headerRight: () => <HeaderActions />,
      }}
    >
      <SongsStack.Screen name="SongsList" component={SongsScreen} />
      <SongsStack.Screen name="Lyrics"    component={LyricsScreen} />
    </SongsStack.Navigator>
  );
}

function SearchStackNavigator() {
  const { colors: palette } = useTheme();
  return (
    <SearchStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: palette.bgPrimary },
        headerTitleStyle: { color: palette.textPrimary, fontWeight: '700' },
        headerTintColor: palette.primary,
        headerShadowVisible: false,
        headerRight: () => <HeaderActions />,
      }}
    >
      <SearchStack.Screen name="SearchMain" component={SearchScreen} />
    <SearchStack.Navigator screenOptions={{ headerShown: false }}>
      <SearchStack.Screen name="SearchMain"   component={SearchScreen} />
      <SearchStack.Screen name="ArtistDetail" component={ArtistDetailScreen} />
      <SearchStack.Screen name="AlbumDetail"  component={AlbumDetailScreen} />
      <SearchStack.Screen name="Lyrics"       component={LyricsScreen} />
    </SearchStack.Navigator>
  );
}

function SavedStackNavigator() {
  const { colors: palette } = useTheme();
  return (
    <SavedStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: palette.bgPrimary },
        headerTitleStyle: { color: palette.textPrimary, fontWeight: '700' },
        headerTintColor: palette.primary,
        headerShadowVisible: false,
        headerRight: () => <HeaderActions />,
      }}
    >
      <SavedStack.Screen name="SavedList" component={SavedScreen} />
      <SavedStack.Screen name="Lyrics"    component={LyricsScreen} />
    </SavedStack.Navigator>
  );
}

// ─── Tab Icon Component ──────────────────────────────────────────

type TabName = keyof RootTabParamList;

function TabIcon({
  routeName,
  focused,
  palette,
}: Readonly<{
  routeName: TabName;
  focused: boolean;
  palette: { primary: string; textTertiary: string };
}>) {
  const iconName =
    routeName === 'HomeTab'
      ? 'home'
      : routeName === 'ArtistsTab'
        ? 'users'
        : routeName === 'SongsTab'
          ? 'music'
          : routeName === 'SearchTab'
            ? 'search'
            : routeName === 'SavedTab'
              ? 'bookmark'
              : 'user';

  return <Feather name={iconName as React.ComponentProps<typeof Feather>['name']} size={20} color={focused ? palette.primary : palette.textTertiary} />;
}

// ─── Root Tab Navigator ──────────────────────────────────────────

const Tab = createBottomTabNavigator<RootTabParamList>();

export function AppNavigator() {
  const { colors: palette } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: [styles.tabBar, { backgroundColor: palette.bgElevated, borderTopColor: palette.border }, isWide && styles.tabBarWide],
        tabBarItemStyle: styles.tabBarItem,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.textTertiary,
        tabBarLabelStyle: isWide ? styles.tabLabelWide : styles.tabLabel,
        tabBarIcon: ({ focused }) => <TabIcon routeName={route.name as TabName} focused={focused} palette={palette} />,
        tabBarShowLabel: isWide,
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="ArtistsTab"
        component={ArtistsStackNavigator}
        options={{
          tabBarLabel: 'Artists',
        }}
      />
      <Tab.Screen
        name="SongsTab"
        component={SongsStackNavigator}
        options={{
          tabBarLabel: 'Songs',
        }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchStackNavigator}
        options={{
          tabBarLabel: 'Search',
        }}
      />
      <Tab.Screen
        name="SavedTab"
        component={SavedStackNavigator}
        options={{
          tabBarLabel: 'Saved',
        }}
      />
      <Tab.Screen name="ProfileTab" component={ProfileSettingsScreen} options={{ tabBarLabel: 'Profile' }} />
      <Tab.Screen name="ArtistsTab" component={ArtistsStackNavigator} options={{ tabBarLabel: 'Artists' }} />
      <Tab.Screen name="SongsTab"   component={SongsStackNavigator}   options={{ tabBarLabel: 'Songs' }} />
      <Tab.Screen name="SearchTab"  component={SearchStackNavigator}  options={{ tabBarLabel: 'Search' }} />
      <Tab.Screen name="SavedTab"   component={SavedStackNavigator}   options={{ tabBarLabel: 'Saved' }} />
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 12,
  },
});

function HeaderActions() {
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  return (
    <View style={styles.headerActions}>
      <Pressable onPress={() => navigation.navigate('SearchTab' as never)} accessibilityLabel="Open search">
        <AppText variant="actionLabel">🔍</AppText>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('ProfileTab' as never)} accessibilityLabel="Open profile">
        <AppText variant="actionLabel">👤</AppText>
      </Pressable>
    </View>
  );
}
});
