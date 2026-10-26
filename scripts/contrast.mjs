// Mesure les contrastes à partir de styles/tokens.css (formule WCAG 2.x, pas d'estimation).
// Échoue sous le seuil, et si une valeur publiée dans docs/DESIGN.md ne correspond plus aux
// tokens : une teinte modifiée doit être remesurée ET reportée dans DESIGN.md.
import { readFile } from 'node:fs/promises';

const css = await readFile('styles/tokens.css', 'utf8');
const themes = {};
for (const [, selector, body] of css.matchAll(/(:root[^{]*)\{([^}]*)\}/g)) {
  const name = selector.includes("'light'") ? 'light' : selector.includes("'dark'") ? 'dark' : null;
  if (!name) continue;
  // Plusieurs blocs par thème (couleurs, puis rôles) : on les fusionne.
  themes[name] = {
    ...themes[name],
    ...Object.fromEntries(
      [...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6}|var\(--[\w-]+\)|[0-9.]+)/gi)].map(
        ([, k, v]) => [k, v],
      ),
    ),
  };
}
// Les rôles (--ink-brass: var(--brass-light)) pointent vers une couleur du même thème.
for (const tokens of Object.values(themes)) {
  for (const [k, v] of Object.entries(tokens)) {
    const ref = v.match(/^var\(--([\w-]+)\)$/);
    if (ref) tokens[k] = tokens[ref[1]];
  }
}

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// [encre, fond, seuil, valeur publiée dans DESIGN.md (ou null), usage]
const TEXT = 4.5;
const UI = 3; // WCAG 1.4.11 : bords de composants, pictogrammes, anneau de focus
const pairs = {
  dark: [
    ['text', 'bg', TEXT, 15.6, 'texte'],
    ['text', 'surface', TEXT, null, 'texte'],
    ['text-muted', 'bg', TEXT, 5.99, 'texte secondaire'],
    ['text-muted', 'surface', TEXT, 5.59, 'texte secondaire'],
    ['accent', 'bg', TEXT, 12.17, 'texte, liens'],
    ['accent', 'surface', TEXT, null, 'texte, liens'],
    ['accent-ink', 'accent', TEXT, 12.17, 'texte sur accent'],
    ['brass-light', 'bg', TEXT, 9.75, 'surtitres'],
    ['brass-light', 'surface', TEXT, null, 'surtitres'],
    ['brass', 'bg', TEXT, 6.19, 'titrage, filets'],
    ['brass', 'surface', TEXT, null, 'titrage, filets'],
    ['ink-brass', 'bg', TEXT, null, 'surtitre du hero (rôle)'],
    ['accent', 'bg', UI, null, 'anneau de focus'],
    ['brass', 'bg', UI, null, 'capsule du poussoir sur le fond'],
    ['bg', 'brass', UI, null, 'pictogramme sur le poussoir'],
  ],
  light: [
    ['text', 'bg', TEXT, 16.3, 'texte'],
    ['text', 'surface', TEXT, null, 'texte'],
    ['text-muted', 'bg', TEXT, 5.55, 'texte secondaire'],
    ['text-muted', 'surface', TEXT, null, 'texte secondaire'],
    ['accent', 'bg', TEXT, 4.72, 'texte, liens'],
    ['accent', 'surface', TEXT, null, 'texte, liens'],
    ['accent-ink', 'accent', TEXT, 5.15, 'texte sur accent'],
    ['brass', 'bg', TEXT, 5.82, 'surtitres, filets'],
    ['brass', 'surface', TEXT, null, 'surtitres, filets'],
    ['text', 'brass-light', TEXT, 7.33, 'encre sur aplat laiton'],
    ['ink-brass', 'bg', TEXT, null, 'surtitre du hero (rôle)'],
    ['accent', 'bg', UI, null, 'anneau de focus'],
    ['brass', 'bg', UI, null, 'bord du poussoir sur le fond'],
    ['text', 'brass-light', UI, null, 'pictogramme sur le poussoir'],
  ],
};

// Le grain (Avant, le plus dense) recouvre le fond sous le texte du hero et des époques :
// on mesure le texte sur le fond mélangé à la teinte du grain, là où passe une ligne.
const mix = (bg, ink, alpha) =>
  '#' +
  [1, 3, 5]
    .map((i) => {
      const b = parseInt(bg.slice(i, i + 2), 16);
      const c = parseInt(ink.slice(i, i + 2), 16);
      return Math.round(b * (1 - alpha) + c * alpha)
        .toString(16)
        .padStart(2, '0');
    })
    .join('');
for (const [theme, tokens] of Object.entries(themes)) {
  tokens['bg-grain'] = mix(tokens.bg, tokens['grain-teinte'], Number(tokens['grain-avant']));
  // Pas d'accent : il n'apparaît qu'à l'époque 3, où le grain est nul. En clair, il
  // passerait sous 4.5:1 dès 3 % de grain. tests/epoques.spec.ts vérifie qu'aucun texte
  // n'est affiché en accent en Avant ni en Pendant.
  for (const fg of ['text', 'text-muted', 'ink-brass']) {
    pairs[theme].push([fg, 'bg-grain', TEXT, null, 'sur le grain d’Avant']);
  }
}

let failures = 0;
for (const [theme, list] of Object.entries(pairs)) {
  console.log(`\nThème ${theme}`);
  for (const [fg, bg, min, published, usage] of list) {
    const r = ratio(themes[theme][fg], themes[theme][bg]);
    const shown = Math.round(r * 100) / 100;
    let status = r >= min ? 'ok' : `ÉCHEC < ${min}:1`;
    if (published !== null && Math.abs(shown - published) > 0.005) {
      status = `ÉCART avec DESIGN.md (${published}:1)`;
    }
    if (status !== 'ok') failures++;
    console.log(
      `  ${status.padEnd(28)} ${shown.toFixed(2).padStart(5)}:1  --${fg} sur --${bg} (${usage})`,
    );
  }
}
if (failures) {
  console.error(`\n${failures} paire(s) en échec.`);
  process.exit(1);
}
console.log('\nToutes les paires passent.');
