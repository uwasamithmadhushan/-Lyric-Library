/**
 * Browser safety net: rewrite any accidental direct Deezer/iTunes fetches
 * to Metro /proxy/* (fixes stale cached bundles + CORS/403).
 */

export const MEDIA_PROXY_BUILD = 'proxy-v6-fetch-guard-20260913';

type FetchInput = RequestInfo | URL;

function toUrlString(input: FetchInput): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function rewriteMediaUrl(rawUrl: string): string {
  try {
    // Absolute Deezer API → same-origin proxy
    if (rawUrl.includes('api.deezer.com')) {
      const parsed = new URL(rawUrl, 'http://localhost');
      const apiPath = parsed.pathname.replace(/^\//, '') || 'search';
      const params = new URLSearchParams(parsed.search);
      params.set('path', apiPath);
      return `/proxy/deezer?${params.toString()}`;
    }

    // Absolute iTunes API → same-origin proxy
    if (rawUrl.includes('itunes.apple.com')) {
      const parsed = new URL(rawUrl, 'http://localhost');
      const apiPath = parsed.pathname.replace(/^\//, '') || 'search';
      const params = new URLSearchParams(parsed.search);
      params.set('path', apiPath);
      return `/proxy/itunes?${params.toString()}`;
    }
  } catch {
    // fall through
  }
  return rawUrl;
}

let installed = false;

/** Patch window.fetch once (web only). Safe to call multiple times. */
export function installMediaFetchGuard(): void {
  if (installed) return;

  const scope = globalThis as {
    document?: unknown;
    fetch?: typeof fetch;
    navigator?: { serviceWorker?: { getRegistrations?: () => Promise<Array<{ unregister: () => Promise<boolean> }>> } };
  };

  if (!scope.document || typeof scope.fetch !== 'function') return;

  const originalFetch = scope.fetch.bind(globalThis);

  scope.fetch = ((input: FetchInput, init?: RequestInit) => {
    const originalUrl = toUrlString(input);
    const nextUrl = rewriteMediaUrl(originalUrl);

    if (nextUrl !== originalUrl && typeof console !== 'undefined') {
      console.info(`[LyricLibrary] redirected → ${nextUrl}`);
    }

    if (nextUrl === originalUrl) {
      return originalFetch(input as RequestInfo, init);
    }

    return originalFetch(nextUrl, init);
  }) as typeof fetch;

  // Drop stale service workers that can pin old AppEntry bundles.
  scope.navigator?.serviceWorker?.getRegistrations?.()
    .then((regs) => Promise.all(regs.map((reg) => reg.unregister())))
    .catch(() => undefined);

  installed = true;

  if (typeof console !== 'undefined') {
    console.info(`[LyricLibrary] media ${MEDIA_PROXY_BUILD} — fetch guard on`);
  }
}

export function mediaFetchUrl(kind: 'deezer' | 'itunes', query: Record<string, string>): string {
  const params = new URLSearchParams(query);
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

// Auto-install as soon as this module loads on web.
installMediaFetchGuard();
