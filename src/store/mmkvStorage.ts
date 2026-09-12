/**
 * Storage adapter for Zustand persist.
 * Prefers MMKV on native; falls back to localStorage (web) then memory.
 */

type MemoryMap = Map<string, string>;

const memoryFallback: MemoryMap = new Map();

let mmkv: { getString: (k: string) => string | undefined; set: (k: string, v: string) => void; delete: (k: string) => void } | null =
  null;
let mmkvFailed = false;

function getMMKV() {
  if (mmkvFailed) return null;
  if (mmkv) return mmkv;
  try {
    // Lazy require so web bundles don't crash if native module is missing.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { MMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
    mmkv = new MMKV({ id: 'lyric-library' });
    return mmkv;
  } catch {
    mmkvFailed = true;
    return null;
  }
}

function getWebStorage(): { getItem: (k: string) => string | null; setItem: (k: string, v: string) => void; removeItem: (k: string) => void } | null {
  try {
    const scope = globalThis as {
      localStorage?: {
        getItem: (k: string) => string | null;
        setItem: (k: string, v: string) => void;
        removeItem: (k: string) => void;
      };
    };
    if (scope.localStorage) return scope.localStorage;
  } catch {
    // ignore
  }
  return null;
}

export const mmkvStorage = {
  getItem: (name: string): string | null => {
    const instance = getMMKV();
    if (instance) return instance.getString(name) ?? null;

    const web = getWebStorage();
    if (web) return web.getItem(name);

    return memoryFallback.get(name) ?? null;
  },
  setItem: (name: string, value: string): void => {
    const instance = getMMKV();
    if (instance) {
      instance.set(name, value);
      return;
    }

    const web = getWebStorage();
    if (web) {
      web.setItem(name, value);
      return;
    }

    memoryFallback.set(name, value);
  },
  removeItem: (name: string): void => {
    const instance = getMMKV();
    if (instance) {
      instance.delete(name);
      return;
    }

    const web = getWebStorage();
    if (web) {
      web.removeItem(name);
      return;
    }

    memoryFallback.delete(name);
  },
};
