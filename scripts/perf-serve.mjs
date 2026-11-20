import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
const root = path.resolve(process.argv[2]);
const port = Number(process.argv[3] || 4300);
const types = {
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.txt': 'text/plain',
};
http
  .createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    if (url.startsWith('/ops-api') || url.startsWith('/external-content')) {
      res.writeHead(503);
      res.end();
      return;
    }
    let file = path.join(root, url);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
    const ext = path.extname(file);
    const body = fs.readFileSync(file);
    const gz = zlib.gzipSync(body);
    res.writeHead(200, {
      'content-type': types[ext] || 'application/octet-stream',
      'content-encoding': 'gzip',
      'cache-control': 'no-store',
    });
    res.end(gz);
  })
  .listen(port);
