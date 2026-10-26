// Serveur statique local qui reproduit deploy/nginx (routes, en-têtes, CSP, gzip),
// pour que les tests portent sur ce que la production servira.
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { createGzip } from 'node:zlib';
import { CSP_DIR, OUT_DIR, PORT } from './lib.mjs';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
};
const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.json', '.txt', '.xml', '.svg']);
const root = path.resolve(OUT_DIR);
const cspFile = `${CSP_DIR}/policy.txt`;
const csp = existsSync(cspFile) ? readFileSync(cspFile, 'utf8') : null;

function headers(ext, urlPath) {
  const h = {
    'Content-Type': TYPES[ext] ?? 'application/octet-stream',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cache-Control': urlPath.startsWith('/_next/static/')
      ? 'public, max-age=31536000, immutable'
      : 'no-cache',
  };
  if (csp) h['Content-Security-Policy'] = csp;
  if (process.env.ROBOTS_TAG) h['X-Robots-Tag'] = process.env.ROBOTS_TAG;
  return h;
}

function send(req, res, status, file, urlPath) {
  const ext = path.extname(file);
  const h = headers(ext, urlPath);
  const gzip = COMPRESSIBLE.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] ?? '');
  if (gzip) {
    h['Content-Encoding'] = 'gzip';
    h.Vary = 'Accept-Encoding';
  }
  res.writeHead(status, h);
  if (req.method === 'HEAD') return res.end();
  const stream = createReadStream(file);
  (gzip ? stream.pipe(createGzip()) : stream).pipe(res);
}

createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const target = path.join(root, urlPath);
  if (!target.startsWith(root)) {
    res.writeHead(400).end();
    return;
  }
  const isFile = (p) => existsSync(p) && statSync(p).isFile();
  if (urlPath.endsWith('/') && isFile(path.join(target, 'index.html'))) {
    return send(req, res, 200, path.join(target, 'index.html'), urlPath);
  }
  if (isFile(target)) return send(req, res, 200, target, urlPath);
  if (isFile(path.join(target, 'index.html'))) {
    res.writeHead(301, { Location: `${urlPath}/` }).end();
    return;
  }
  send(req, res, 404, path.join(root, '404.html'), urlPath);
}).listen(PORT, '127.0.0.1', () => {
  console.log(`out/ servi sur http://127.0.0.1:${PORT}${csp ? ' (avec CSP)' : ' (sans CSP)'}`);
});
