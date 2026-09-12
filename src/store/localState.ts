// Lightweight in-memory local state for favorites and recently viewed
// This intentionally keeps state in module scope for simplicity in this frontend-only app.

import type { Song } from '@/types';

type RecentItem = {
  songId: string;
  songTitle: string;
  artistName?: string;
  viewedAt: number;
};

const recent: RecentItem[] = [];
const favorites: Record<string, Song> = {};

export function addRecentlyViewed(item: { songId: string; songTitle: string; artistName?: string }) {
  const now = Date.now();
  // remove existing
  const idx = recent.findIndex(r => r.songId === item.songId);
  if (idx !== -1) recent.splice(idx, 1);
  recent.unshift({ ...item, viewedAt: now });
  // keep last 50
  if (recent.length > 50) recent.pop();
}

export function getRecentlyViewed() {
  return [...recent];
}

export function clearRecentlyViewed() {
  recent.length = 0;
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
