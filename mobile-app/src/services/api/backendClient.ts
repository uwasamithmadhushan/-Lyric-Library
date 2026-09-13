/**
 * Shared Lyric Library backend HTTP client for the mobile app.
 * All music sync/admin secrets stay on the server — mobile only reads public APIs.
 */

const DEFAULT_BASE = 'http://localhost:4000';

export function getBackendBaseUrl(): string {
  const fromEnv =
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_BASE_URL) ||
    (typeof process !== 'undefined' && process.env?.API_BASE_URL) ||
    '';
  return String(fromEnv || DEFAULT_BASE).replace(/\/$/, '');
}

export async function backendFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getBackendBaseUrl()}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Backend request failed (${response.status})`);
  }

  return (await response.json()) as T;
}
