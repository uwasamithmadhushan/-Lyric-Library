type Key = string;

class MMKVMock {
  private store = new Map<Key, string>();

  getString(key: Key): string | undefined {
    return this.store.get(key);
  }

  set(key: Key, value: string): void {
    this.store.set(key, value);
  }

  delete(key: Key): void {
    this.store.delete(key);
  }

  clearAll(): void {
    this.store.clear();
  }

  getAllKeys(): string[] {
    return Array.from(this.store.keys());
  }
}

export class MMKV extends MMKVMock {
  constructor(_config?: { id?: string }) {
    super();
  }
}
