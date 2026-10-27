import { useSyncExternalStore } from 'react';
import { EPOQUES, type EpoqueId } from '@/content/epoques';

/**
 * L'époque à l'écran (prototype « sections à la suite ») : celle dont la section croise le
 * milieu de la fenêtre. Hors des trois sections (hero, contact), aucune : la montre est
 * complète, à l'état 3.
 *
 * Vit sur <html data-epoque-courante>, posé par components/epoques/Repere.tsx (pas
 * `data-epoque`, que portent les sections : `[data-epoque="apres"]` désignerait toute la page).
 * Le grain la suit en CSS ; la montre, par ce hook. Sans JavaScript, rien n'est posé :
 * état 3, pas de grain.
 */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributeFilter: ['data-epoque-courante'] });
  return () => observer.disconnect();
}

export const lireEpoque = (): EpoqueId | null =>
  (document.documentElement.dataset.epoqueCourante as EpoqueId | undefined) ?? null;

export function setEpoque(id: EpoqueId | null) {
  if (id) document.documentElement.dataset.epoqueCourante = id;
  else delete document.documentElement.dataset.epoqueCourante;
}

export const useEpoque = () => useSyncExternalStore(subscribe, lireEpoque, () => null);

/** État de la montre pour une époque ; hors des sections, la montre est complète. */
export const etatDe = (id: EpoqueId | null) => EPOQUES.find((e) => e.id === id)?.etat ?? 3;

/** Fait défiler jusqu'à la section d'une époque (repère, couronne). */
export function allerA(id: EpoqueId) {
  const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document
    .getElementById(`epoque-${id}`)
    ?.scrollIntoView({ behavior: reduit ? 'auto' : 'smooth', block: 'start' });
}
