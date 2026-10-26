// Liste les valeurs manquantes ([EMAIL], [PRIX]…) encore présentes dans l'export.
// Avec PRODUCTION=1, en trouver une fait échouer : on ne met pas en ligne un site à trous.
import { readFile } from 'node:fs/promises';
import { htmlFiles } from './lib.mjs';

const found = new Map();
for (const file of await htmlFiles()) {
  const html = await readFile(file, 'utf8');
  for (const [token] of html.matchAll(/\[(?=[A-Z0-9_]*[A-Z])[A-Z0-9_]{2,}\]/g)) {
    found.set(token, (found.get(token) ?? new Set()).add(file));
  }
}
if (!found.size) {
  console.log('Aucune valeur manquante dans l’export.');
} else {
  console.log('Valeurs manquantes dans l’export :');
  for (const [token, files] of found) console.log(`  ${token}  (${[...files].join(', ')})`);
}
if (found.size && process.env.PRODUCTION === '1') {
  console.error('PRODUCTION=1 : export refusé tant que des valeurs manquent.');
  process.exit(1);
}
