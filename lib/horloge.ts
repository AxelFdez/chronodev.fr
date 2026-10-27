/**
 * Met la montre à l'heure du visiteur (MONTRE.md § Trotteuse, PLAN.md C4 et C5).
 * Sérialisée dans la page, juste après la montre (HORLOGE_SCRIPT) : les aiguilles sont à
 * l'heure dès le premier paint, avant React. Elle ne doit donc rien référencer hors de son
 * propre corps. Rotation par l'attribut transform, jamais en CSS (PLAN.md S10).
 *
 * `trotteuse` : angle imposé à la trotteuse (le composant le passe toujours). Sans argument
 * (script inline, au chargement) : l'heure réelle, ou 0 sous prefers-reduced-motion, où le
 * chrono démarre au repos.
 */
export function poserHeure(trotteuse?: number) {
  const svg = document.querySelector('svg[data-etat]');
  if (!svg) return;
  const d = new Date();
  const h = d.getHours();
  const m = d.getMinutes();
  const s = d.getSeconds();
  const tourner = (aiguille: string, angle: number, cy: number) =>
    svg
      .querySelector(`[data-aiguille="${aiguille}"]`)
      ?.setAttribute('transform', `rotate(${+angle.toFixed(2)} 190 ${cy})`);
  const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
  tourner('heures', ((h % 12) + m / 60) * 30, 290);
  tourner('minutes', (m + s / 60) * 6, 290);
  tourner('secondes', trotteuse ?? (reduit ? 0 : s * 6), 290);
  // Disque jour/nuit sur 24 h : moitié pleine en haut à midi, en bas à minuit.
  tourner('jour-nuit', 90 - ((h + m / 60) / 12) * 180, 228);
}

/**
 * Sérialisée après la montre, avec la mise à l'heure : si l'intro va se jouer, la montre
 * est à l'état 1 dès le premier paint (aiguilles au centre) et le poussoir dit ce qu'il fait.
 * Autonome : libellé écrit en dur (= LIBELLE_INTRO).
 */
export function preparerIntro() {
  if (document.documentElement.dataset.intro !== 'a-jouer') return;
  document.querySelector('svg[data-etat] [data-part="aiguilles"]')?.removeAttribute('transform');
  document.querySelector('[data-poussoir]')?.setAttribute('aria-label', 'Démarrer la montre');
}

// Mise à l'heure, puis préparation de l'intro (état 1) si elle va se jouer.
export const HORLOGE_SCRIPT = `(${poserHeure.toString()})();(${preparerIntro.toString()})()`;
