const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const http = require('http');
const os = require('os');

const config = getDefaultConfig(__dirname);

// ── Performance: use all available CPU cores for bundling ─────────────────────
config.maxWorkers = Math.max(os.cpus().length - 1, 1);

// ── Performance: enable persistent cache for faster subsequent loads ──────────
config.cacheStores = undefined; // use Metro's default disk cache (FileStore)
config.resetCache = false;

// ── Performance: inline requires — lazy-load modules on first use ─────────────
// This dramatically reduces startup time by not executing all imports upfront
config.transformer = {
  ...config.transformer,
  inlineRequires: true,
  minifierConfig: {
    keep_classnames: false,
    keep_fnames: false,
    mangle: { toplevel: false },
    output: { ascii_only: true, quote_style: 3, wrap_iife: true },
    sourceMap: { includeSources: false },
    toplevel: false,
    compress: {
      reduce_funcs: false,
    },
  },
};

// ── Web stubs for native-only modules ─────────────────────────────────────────
const WEB_STUBS = {
  [path.resolve(__dirname, 'node_modules/expo-modules-core/src/worklets')]:
    path.resolve(__dirname, 'stubs/expo-worklets.web.js'),
  [path.resolve(__dirname, 'node_modules/expo-modules-core/src/worklets/index.ts')]:
    path.resolve(__dirname, 'stubs/expo-worklets.web.js'),
};

const originalResolver = config.resolver?.resolveRequest;
config.resolver = config.resolver || {};
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    const absCandidate = path.resolve(path.dirname(context.originModulePath), moduleName);
    if (WEB_STUBS[absCandidate]) {
      return { type: 'sourceFile', filePath: WEB_STUBS[absCandidate] };
    }
    if (moduleName === './worklets' &&
        context.originModulePath.includes('expo-modules-core')) {
      return { type: 'sourceFile', filePath: path.resolve(__dirname, 'stubs/expo-worklets.web.js') };
    }
  }
  if (originalResolver) return originalResolver(context, moduleName, platform);
  return context.resolveRequest(context, moduleName, platform);
};

// ── API proxy middleware (forwards /api/* → backend on port 3001) ─────────────
config.server = {
  enhanceMiddleware: (metroMiddleware) => {
    return (req, res, next) => {
      if (req.url && req.url.startsWith('/api')) {
        const options = {
          hostname: 'localhost',
          port: 3001,
          path: req.url,
          method: req.method,
          headers: { ...req.headers, host: 'localhost:3001' },
        };
        const proxy = http.request(options, (proxyRes) => {
          res.writeHead(proxyRes.statusCode, proxyRes.headers);
          proxyRes.pipe(res, { end: true });
        });
        proxy.on('error', () => {
          if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'application/json' });
          }
          res.end(JSON.stringify({ error: 'Backend unavailable — start the API server' }));
        });
        req.pipe(proxy, { end: true });
        return;
      }
      return metroMiddleware(req, res, next);
    };
  },
};

module.exports = config;
