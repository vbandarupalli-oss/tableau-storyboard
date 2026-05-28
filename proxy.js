// Tableau Storyboard - Local Proxy Server
// Forwards requests to Tableau REST API, adds CORS headers
// Run: node proxy.js
// Then open: https://vbandarupalli-oss.github.io/tableau-storyboard/

const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3456;

const server = http.createServer((req, res) => {

  // CORS headers — allow requests from GitHub Pages and localhost
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Tableau-Auth, Accept, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse target URL from query param: /proxy?url=https://...
  const parsed = url.parse(req.url, true);
  const targetUrl = parsed.query.url;

  if (!targetUrl) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing ?url= parameter' }));
    return;
  }

  // Parse the target URL
  let target;
  try {
    target = new url.URL(targetUrl);
  } catch(e) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid URL: ' + targetUrl }));
    return;
  }

  // Only allow Tableau Cloud URLs for security
  if (!target.hostname.includes('tableau.com') && !target.hostname.includes('online.tableau.com')) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Only tableau.com URLs are allowed' }));
    return;
  }

  // Forward headers (strip proxy-specific ones)
  const forwardHeaders = {};
  for (const [key, val] of Object.entries(req.headers)) {
    if (!['host', 'connection', 'transfer-encoding'].includes(key.toLowerCase())) {
      forwardHeaders[key] = val;
    }
  }
  forwardHeaders['host'] = target.hostname;

  const options = {
    hostname: target.hostname,
    port: target.port || 443,
    path: target.pathname + (target.search || ''),
    method: req.method,
    headers: forwardHeaders
  };

  console.log('[proxy]', req.method, target.pathname);

  // Collect request body
  let body = [];
  req.on('data', chunk => body.push(chunk));
  req.on('end', () => {
    const bodyBuffer = Buffer.concat(body);

    const proxyReq = https.request(options, (proxyRes) => {
      // Forward response headers
      const responseHeaders = { ...proxyRes.headers };
      responseHeaders['access-control-allow-origin'] = '*';

      res.writeHead(proxyRes.statusCode, responseHeaders);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('[proxy error]', err.message);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Proxy error: ' + err.message }));
      }
    });

    if (bodyBuffer.length > 0) {
      proxyReq.write(bodyBuffer);
    }
    proxyReq.end();
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('  Tableau Storyboard Proxy running on http://localhost:' + PORT);
  console.log('');
  console.log('  Open in browser:');
  console.log('  https://vbandarupalli-oss.github.io/tableau-storyboard/');
  console.log('');
  console.log('  Press Ctrl+C to stop');
  console.log('');
});
