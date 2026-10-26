// Après `next build` : calcule la CSP de l'export statique. Pas de nonce possible sur un site
// statique, donc chaque script inline (thème + charge utile RSC) est autorisé par son hash.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { CSP_DIR, htmlFiles, inlineScripts } from './lib.mjs';

const hashes = new Set();
for (const file of await htmlFiles()) {
  for (const script of inlineScripts(await readFile(file, 'utf8'))) {
    hashes.add(`'sha256-${createHash('sha256').update(script, 'utf8').digest('base64')}'`);
  }
}

const policy = [
  "default-src 'self'",
  `script-src 'self' ${[...hashes].sort().join(' ')}`,
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

await mkdir(CSP_DIR, { recursive: true });
await writeFile(`${CSP_DIR}/policy.txt`, policy);
await writeFile(`${CSP_DIR}/csp.inc`, `add_header Content-Security-Policy "${policy}" always;\n`);
console.log(`CSP : ${hashes.size} script(s) inline autorisé(s) par hash.`);
