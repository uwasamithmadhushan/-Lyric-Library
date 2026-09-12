import { MMKV } from 'react-native-mmkv';

let mmkv: MMKV | null = null;

/**
 * Get or create MMKV instance. Returns null if MMKV is not available
 * (e.g., in Expo Go without proper native setup).
 */
const getMMKV = (): MMKV | null => {
  if (!mmkv) {
    try {
      mmkv = new MMKV({ id: 'lyric-library' });
    } catch {
      // MMKV not available (e.g., Expo Go without native modules)
      return null;
    }
  }
  return mmkv;
};

export const mmkvStorage = {
  getItem: (name: string): string | null => {
    const instance = getMMKV();
    if (!instance) return null;
    const value = instance.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string): void => {
    const instance = getMMKV();
    if (!instance) return;
    instance.set(name, value);
  },
  removeItem: (name: string): void => {
    const instance = getMMKV();
    if (!instance) return;
    instance.delete(name);
  },
};
