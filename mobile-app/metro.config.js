const { getDefaultConfig } = require('expo/metro-config');
const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const dotenv = require('dotenv');

// Reuse the parent project's local configuration without duplicating secrets.
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const configuredServer = process.env.EXPO_PUBLIC_MINDFULNESS_API_BASE_URL
  || 'https://mindfulness-avatar.onrender.com';
const MINDFULNESS_SERVER = new URL(configuredServer);
if (!['http:', 'https:'].includes(MINDFULNESS_SERVER.protocol)) {
  throw new Error('EXPO_PUBLIC_MINDFULNESS_API_BASE_URL must use HTTP or HTTPS.');
}

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('html');
const defaultEnhanceMiddleware = config.server.enhanceMiddleware;

config.server.enhanceMiddleware = (middleware, server) => {
  const enhancedMiddleware = defaultEnhanceMiddleware
    ? defaultEnhanceMiddleware(middleware, server)
    : middleware;

  return (request, response, next) => {
    const pathname = request.url?.split('?')[0] || '';
    if (pathname === '/mobile-avatar.html') {
      response.setHeader('Content-Type', 'text/html; charset=utf-8');
      response.setHeader('Cache-Control', 'no-store');
      fs.createReadStream(path.join(__dirname, 'assets', 'avatar.html')).pipe(response);
      return;
    }
    if (pathname.startsWith('/vendor/')) {
      const assetsRoot = path.resolve(__dirname, 'assets');
      const assetPath = path.resolve(assetsRoot, pathname.slice(1));
      if (assetPath.startsWith(`${assetsRoot}${path.sep}`) && fs.existsSync(assetPath) && fs.statSync(assetPath).isFile()) {
        response.setHeader('Content-Type', 'text/javascript; charset=utf-8');
        response.setHeader('Cache-Control', 'public, max-age=3600');
        fs.createReadStream(assetPath).pipe(response);
        return;
      }
    }
    if (pathname === '/avatar-api' || pathname.startsWith('/avatar-api/')) {
      const upstreamPath = `${pathname.slice('/avatar-api'.length) || '/'}${request.url?.includes('?') ? `?${request.url.split('?').slice(1).join('?')}` : ''}`;
      const transport = MINDFULNESS_SERVER.protocol === 'http:' ? http : https;
      const proxyRequest = transport.request({
        protocol: MINDFULNESS_SERVER.protocol,
        hostname: MINDFULNESS_SERVER.hostname,
        port: MINDFULNESS_SERVER.port || 443,
        method: request.method,
        path: upstreamPath,
        headers: {
          accept: request.headers.accept || '*/*',
          authorization: request.headers.authorization || '',
          'content-type': request.headers['content-type'] || 'application/json',
        },
      }, (proxyResponse) => {
        response.statusCode = proxyResponse.statusCode || 502;
        if (proxyResponse.headers['content-type']) response.setHeader('Content-Type', proxyResponse.headers['content-type']);
        if (proxyResponse.headers['cache-control']) response.setHeader('Cache-Control', proxyResponse.headers['cache-control']);
        proxyResponse.pipe(response);
      });
      proxyRequest.on('error', () => {
        if (!response.headersSent) response.writeHead(502, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Mindfulness server unavailable' }));
      });
      request.pipe(proxyRequest);
      return;
    }
    enhancedMiddleware(request, response, next);
  };
};

module.exports = config;
