import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', process.env.RAIZ_SITE || 'frontend');
const PORTA = Number(process.env.PORTA || 8080);

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json'
};

createServer(async (req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
  const arq = path.join(RAIZ, rel);
  if (!arq.startsWith(RAIZ)) { res.writeHead(403).end(); return; }
  try {
    const info = await stat(arq);
    const alvo = info.isDirectory() ? path.join(arq, 'index.html') : arq;
    res.writeHead(200, { 'content-type': TIPOS[path.extname(alvo)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(await readFile(alvo));
  } catch {
    res.writeHead(404).end('nao encontrado');
  }
}).listen(PORTA, '127.0.0.1', () => console.log(`http://127.0.0.1:${PORTA}`));
