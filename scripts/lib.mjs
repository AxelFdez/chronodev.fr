import { readdir } from 'node:fs/promises';
import path from 'node:path';

export const OUT_DIR = 'out';
export const CSP_DIR = 'build/csp';
export const PORT = Number(process.env.PORT ?? 4173);
export const BASE_URL = `http://127.0.0.1:${PORT}`;

/** Tous les fichiers HTML de l'export statique. */
export async function htmlFiles(dir = OUT_DIR) {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.html'))
    .map((e) => path.join(e.parentPath, e.name));
}

/** Contenus des <script> inline (sans attribut src). */
export function inlineScripts(html) {
  return [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => m[1])
    .filter(Boolean);
}

/** Exécute fn avec le serveur statique local démarré (réutilise celui qui tourne déjà). */
export async function withServer(fn) {
  const { spawn } = await import('node:child_process');
  const up = () =>
    fetch(`${BASE_URL}/`)
      .then((r) => r.ok)
      .catch(() => false);
  let server = null;
  if (!(await up())) {
    server = spawn(process.execPath, ['scripts/serve.mjs'], { stdio: 'inherit' });
    for (let i = 0; i < 50 && !(await up()); i++) await new Promise((r) => setTimeout(r, 100));
  }
  try {
    return await fn();
  } finally {
    server?.kill();
  }
}
