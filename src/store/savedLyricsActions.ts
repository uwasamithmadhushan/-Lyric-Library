import type { SavedArtist, SavedLyric } from '@/types';
import { useSavedStore } from './savedStore';

/** Build a Saved Lyrics entry from song metadata. */
export function buildSavedLyricEntry(params: {
  songId: string;
  songTitle: string;
  artistName?: string;
  previewText?: string;
}): SavedLyric {
  const existing = useSavedStore.getState().savedMap[params.songId];
  return {
    lyricId: existing?.lyricId ?? `lyric-${params.songId}`,
    songId: params.songId,
    songTitle: params.songTitle,
    artistName: params.artistName?.trim() || 'Unknown artist',
    previewText: params.previewText?.trim() || existing?.previewText || '',
    savedAt: Math.floor(Date.now() / 1000),
    viewCount: existing?.viewCount ?? 0,
  };
}

/** Toggle save for Saved Lyrics screen. Returns true when now saved. */
export function toggleSavedLyric(params: {
  songId: string;
  songTitle: string;
  artistName?: string;
  previewText?: string;
}): boolean {
  const store = useSavedStore.getState();
  if (store.isSaved(params.songId)) {
    store.removeLyric(params.songId);
    return false;
  }
  store.saveLyric(buildSavedLyricEntry(params));
  return true;
}

export function isLyricSaved(songId: string): boolean {
  return useSavedStore.getState().isSaved(songId);
}

export function toggleSavedArtist(params: {
  artistId: string;
  artistName: string;
  songCount?: number;
  imageUrl?: string;
}): boolean {
  const store = useSavedStore.getState();
  if (store.isArtistSaved(params.artistId)) {
    store.removeArtist(params.artistId);
    return false;
  }

  const entry: SavedArtist = {
    artistId: params.artistId,
    artistName: params.artistName,
    songCount: params.songCount ?? 0,
    imageUrl: params.imageUrl,
    savedAt: Math.floor(Date.now() / 1000),
  };
  store.saveArtist(entry);
  return true;
}
