// Recently viewed + legacy song favorites helpers.
// Recently viewed is persisted so Home survives refresh.

import type { Song } from '@/types';
import { mmkvStorage } from './mmkvStorage';

export type RecentItem = {
  songId: string;
  songTitle: string;
  artistName?: string;
  viewedAt: number;
};

const RECENT_KEY = 'lyric-library-recent';
const MAX_RECENT = 50;

let recent: RecentItem[] = loadRecent();
const favorites: Record<string, Song> = {};

function loadRecent(): RecentItem[] {
  try {
    const raw = mmkvStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistRecent() {
  try {
    mmkvStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  } catch {
    // ignore
  }
}

export function addRecentlyViewed(item: {
  songId: string;
  songTitle: string;
  artistName?: string;
}) {
  if (!item.songId || !item.songTitle) return;

  const now = Date.now();
  const idx = recent.findIndex((r) => r.songId === item.songId);
  if (idx !== -1) recent.splice(idx, 1);
  recent.unshift({ ...item, viewedAt: now });
  if (recent.length > MAX_RECENT) recent.length = MAX_RECENT;
  persistRecent();
}

export function getRecentlyViewed() {
  return [...recent];
}

export function clearRecentlyViewed() {
  recent = [];
  persistRecent();
}

export function addFavorite(song: Song) {
  favorites[song.id] = song;
}

export function removeFavorite(songId: string) {
  delete favorites[songId];
}

export function getFavorites() {
  return Object.values(favorites);
}

export function isFavorited(songId: string) {
  return Boolean(favorites[songId]);
}
