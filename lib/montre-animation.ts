import type { gsap as Gsap } from 'gsap';

/**
 * Passages d'état de la montre (MONTRE.md, DESIGN.md § Motion) : une seule timeline GSAP,
 * les époques en sont des plages. Elle anime deux présences numériques posées sur le <svg>
 * (--w-p2 : la matière et l'instrument, --w-p3 : l'accent) et la migration des aiguilles.
 * Les couleurs suivent en CSS (fondus croisés), donc le thème reste libre de changer.
 */

export type Etat = 1 | 2 | 3;
type Timeline = ReturnType<typeof Gsap.timeline>;

export const LABEL: Record<Etat, 'avant' | 'pendant' | 'apres'> = {
  1: 'avant',
  2: 'pendant',
  3: 'apres',
};
const PRESENCES: Record<Etat, [number, number]> = { 1: [0, 0], 2: [1, 0], 3: [1, 1] };

// Échelle 0,35 autour de (190, 290), puis 62 vers le bas : pivot en (190, 352).
export const MIGRATION = 'matrix(0.35 0 0 0.35 123.5 250.5)';

const aiguilles = (svg: SVGSVGElement) => svg.querySelector('[data-part="aiguilles"]')!;

/** État posé sans animation : avant le chargement de GSAP, ou sous mouvement réduit. */
export function poserEtat(svg: SVGSVGElement, etat: Etat) {
  const [p2, p3] = PRESENCES[etat];
  svg.style.setProperty('--w-p2', String(p2));
  svg.style.setProperty('--w-p3', String(p3));
  if (etat === 1) aiguilles(svg).removeAttribute('transform');
  else aiguilles(svg).setAttribute('transform', MIGRATION);
}

export function construireTimeline(gsap: typeof Gsap, svg: SVGSVGElement): Timeline {
  const mains = aiguilles(svg);
  // GSAP prend la main sur la transformation : on repart de l'identité.
  mains.removeAttribute('transform');
  gsap.set(mains, { x: 0, y: 0, scale: 1, svgOrigin: '190 290' });
  return (
    gsap
      .timeline({ paused: true })
      .addLabel('avant', 0)
      .fromTo(svg, { '--w-p2': 0 }, { '--w-p2': 1, duration: 0.6, ease: 'power2.inOut' }, 0)
      // Le temps fort : les aiguilles quittent le centre et rétrécissent dans le sous-cadran.
      // svgOrigin, pas transformOrigin (PLAN.md S3).
      .fromTo(
        mains,
        { x: 0, y: 0, scale: 1 },
        { x: 0, y: 62, scale: 0.35, svgOrigin: '190 290', duration: 1, ease: 'power3.inOut' },
        0,
      )
      .addLabel('pendant', 1)
      // L'accent arrive : c'est l'événement du passage 2 → 3.
      .fromTo(svg, { '--w-p3': 0 }, { '--w-p3': 1, duration: 0.8, ease: 'power2.inOut' }, 'pendant')
      .addLabel('apres', 1.8)
  );
}

/** Durée d'un changement d'époque : 1,2 à 2 s (DESIGN.md § Motion), selon la distance. */
export function dureeVers(tl: Timeline, etat: Etat) {
  const distance = Math.abs(tl.labels[LABEL[etat]] - tl.time());
  return Math.min(2, Math.max(1.2, distance * 1.1));
}
