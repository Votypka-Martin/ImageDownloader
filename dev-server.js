// Lokální vývojový HTTP server bez externích závislostí
// Simuluje prostředí Vercel Serverless Functions a servíruje frontend z /public

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import searchHandler from './api/search.js';
import imageHandler from './api/image.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function decorateResponse(res) {
  res.status = function (statusCode) {
    this.statusCode = statusCode;
    return this;
  };

  res.json = function (obj) {
    if (!this.getHeader('Content-Type')) {
      this.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    this.end(JSON.stringify(obj));
    return this;
  };

  res.send = function (data) {
    this.end(data);
    return this;
  };
}

async function parseBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) req.destroy(); // 1MB ochrana
    });
    req.on('end', () => {
      if (data && req.headers['content-type']?.includes('application/json')) {
        try {
          resolve(JSON.parse(data));
          return;
        } catch {
          // ignore
        }
      }
      resolve({});
    });
  });
}

const server = http.createServer(async (req, res) => {
  decorateResponse(res);
  req.body = await parseBody(req);

  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;

  // 1. API route: /api/search
  if (pathname === '/api/search') {
    try {
      await searchHandler(req, res);
    } catch (err) {
      console.error('Chyba v /api/search:', err);
      res.status(500).json({ error: 'Interní chyba v /api/search', message: err.message });
    }
    return;
  }

  // 2. API route: /api/image
  if (pathname === '/api/image') {
    try {
      await imageHandler(req, res);
    } catch (err) {
      console.error('Chyba v /api/image:', err);
      res.status(500).json({ error: 'Interní chyba v /api/image', message: err.message });
    }
    return;
  }

  // 3. Statické soubory z public/
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  // Bezpečnostní kontrola proti Directory Traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.status(403).send('Přístup odepřen');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback na index.html pro SPA
      const indexHtml = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(indexHtml, (err2, content) => {
        if (err2) {
          res.status(404).send('Soubor nenalezen');
        } else {
          res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').end(content);
        }
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(`🪐 Cosmos Image Downloader Web Server běží na:`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`========================================================`);
});
