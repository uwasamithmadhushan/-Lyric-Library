/**
 * ALL Deezer/iTunes JSON traffic MUST go through Metro same-origin proxies.
 * Never call api.deezer.com or itunes.apple.com from the browser.
 */

/** Bump this when debugging stale bundles — shows in console on app boot. */
export const MEDIA_PROXY_BUILD = 'proxy-v5-20260913';

export function mediaFetchUrl(kind: 'deezer' | 'itunes', query: Record<string, string>): string {
  const params = new URLSearchParams(query);
  // Relative URL = always same-origin (localhost:8081) → no CORS.
  if (kind === 'deezer') {
    return `/proxy/deezer?${params.toString()}`;
  }
  return `/proxy/itunes?${params.toString()}`;
}

export async function fetchMediaJson<T>(
  kind: 'deezer' | 'itunes',
  query: Record<string, string>,
  signal?: AbortSignal,
): Promise<T> {
  const url = mediaFetchUrl(kind, query);
  const response = await fetch(url, {
    signal,
    headers: {
      Accept: 'application/json',
      'Cache-Control': 'no-cache',
    },
  });

  if (!response.ok) {
    throw new Error(`${kind} request failed (${response.status})`);
  }

  return (await response.json()) as T;
}
