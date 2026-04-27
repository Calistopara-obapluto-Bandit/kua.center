const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = parseInt(process.env.PORT || '10000', 10);
const ROOT = __dirname;

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

function send(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    ...headers,
  });
  res.end(JSON.stringify(body));
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(content);
  });
}

function getSafePath(urlPath) {
  const requested = urlPath === '/' ? '/index.html' : urlPath;
  const normalized = path.normalize(decodeURIComponent(requested)).replace(/^(\.\.[/\\])+/, '');
  const resolved = path.join(ROOT, normalized);
  return resolved.startsWith(ROOT) ? resolved : null;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/callback') {
    try {
      const body = await readJsonBody(req);
      const name = String(body.name || '').trim();
      const phone = String(body.phone || '').trim();
      const message = String(body.message || '').trim();

      if (!name || !phone) {
        send(res, 400, {
          ok: false,
          error: 'name and phone are required',
        });
        return;
      }

      const submission = {
        name,
        phone,
        message,
        receivedAt: new Date().toISOString(),
        ip: req.socket.remoteAddress || null,
        userAgent: req.headers['user-agent'] || null,
      };

      console.log('KUAC callback submission:', JSON.stringify(submission, null, 2));

      send(res, 200, {
        ok: true,
        message: 'Callback request received',
      });
    } catch (error) {
      send(res, 400, {
        ok: false,
        error: error.message || 'Unable to process callback request',
      });
    }
    return;
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/health') {
    send(res, 200, { ok: true, status: 'healthy' });
    return;
  }

  const safePath = getSafePath(requestUrl.pathname);
  if (!safePath) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad request');
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (!err && stats.isFile()) {
      serveFile(res, safePath);
      return;
    }

    if (!path.extname(safePath)) {
      serveFile(res, path.join(ROOT, 'index.html'));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  });
});

server.listen(PORT, () => {
  console.log(`KUAC site listening on port ${PORT}`);
});
