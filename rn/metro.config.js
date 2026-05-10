const { getDefaultConfig } = require('expo/metro-config');
const http = require('http');

const config = getDefaultConfig(__dirname);

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
