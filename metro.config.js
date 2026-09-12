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

module.exports = config;
