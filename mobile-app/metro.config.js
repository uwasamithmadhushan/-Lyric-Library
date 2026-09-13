const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

/**
 * Browser CORS / iTunes 403 workarounds:
 * Web clients call same-origin /proxy/* and Metro forwards server-side.
 */
const previousEnhance = config.server?.enhanceMiddleware?.bind(config.server);

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) => {
    const base = previousEnhance ? previousEnhance(middleware, server) : middleware;

    return async (req, res, next) => {
      try {
        const rawUrl = req.url || '';
        const pathOnly = rawUrl.split('?')[0];

        // Prevent browsers from reusing a stale JS bundle that still hit Deezer/iTunes directly.
        if (pathOnly.includes('.bundle') || pathOnly.endsWith('.js')) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
        }

        if (pathOnly === '/proxy/deezer') {
          await proxyJson(req, res, buildDeezerUrl(rawUrl));
          return;
        }

        if (pathOnly === '/proxy/itunes') {
          await proxyJson(req, res, buildItunesUrl(rawUrl));
          return;
        }

        if (pathOnly === '/proxy/media') {
          await proxyMedia(req, res, buildMediaUrl(rawUrl));
          return;
        }
      } catch (error) {
        res.statusCode = 502;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: String(error?.message || error) }));
        return;
      }

      return base(req, res, next);
    };
  },
};

function buildDeezerUrl(rawUrl) {
  const incoming = new URL(rawUrl, 'http://localhost');
  // Allow /search, /search/artist, etc.
  const apiPath = (incoming.searchParams.get('path') || 'search').replace(/^\/+/, '');
  incoming.searchParams.delete('path');
  const target = new URL(`https://api.deezer.com/${apiPath}`);
  incoming.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });
  return target.toString();
}

function buildItunesUrl(rawUrl) {
  const incoming = new URL(rawUrl, 'http://localhost');
  const targetPath = incoming.searchParams.get('path') || 'search';
  incoming.searchParams.delete('path');
  const target = new URL(`https://itunes.apple.com/${targetPath}`);
  incoming.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });
  return target.toString();
}

async function proxyJson(req, res, targetUrl) {
  const response = await fetch(targetUrl, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'LyricLibrary/1.0 (compatible; ExpoMetroProxy)',
    },
  });

  const body = await response.text();
  res.statusCode = response.status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=120');
  res.end(body);
}

const MEDIA_HOST_ALLOWLIST = [
  /(^|\.)dzcdn\.net$/i,
  /(^|\.)deezer\.com$/i,
  /(^|\.)itunes\.apple\.com$/i,
  /(^|\.)mzstatic\.com$/i,
  /(^|\.)audio-ssl\.itunes\.apple\.com$/i,
];

function buildMediaUrl(rawUrl) {
  const incoming = new URL(rawUrl, 'http://localhost');
  const target = incoming.searchParams.get('url');
  if (!target) {
    throw new Error('Missing media url');
  }
  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    throw new Error('Invalid media url');
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Invalid media protocol');
  }
  const allowed = MEDIA_HOST_ALLOWLIST.some((pattern) => pattern.test(parsed.hostname));
  if (!allowed) {
    throw new Error(`Media host not allowed: ${parsed.hostname}`);
  }
  // Keep the original signed query string verbatim (Akamai tokens break if re-encoded).
  return target;
}

async function proxyMedia(req, res, targetUrl) {
  const headers = {
    Accept: 'audio/mpeg,audio/*;q=0.9,*/*;q=0.8',
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    Referer: 'https://www.deezer.com/',
    Origin: 'https://www.deezer.com',
  };
  if (req.headers.range) {
    headers.Range = req.headers.range;
  }

  const response = await fetch(targetUrl, { headers, redirect: 'follow' });
  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get('content-type') || '';

  // Expired Deezer tokens return HTML 403 pages — surface clearly to the client.
  if (!response.ok || contentType.includes('text/html')) {
    res.statusCode = response.ok ? 502 : response.status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store');
    res.end(
      JSON.stringify({
        error: 'Preview media unavailable',
        status: response.status,
        expiredHint: true,
      }),
    );
    return;
  }

  res.statusCode = response.status;
  res.setHeader('Content-Type', contentType || 'audio/mpeg');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=60');
  const contentRange = response.headers.get('content-range');
  if (contentRange) res.setHeader('Content-Range', contentRange);
  const acceptRanges = response.headers.get('accept-ranges');
  if (acceptRanges) res.setHeader('Accept-Ranges', acceptRanges);
  res.setHeader('Content-Length', String(buffer.length));
  res.end(buffer);
}

module.exports = config;
