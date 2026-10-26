import { useSyncExternalStore } from 'react';

/**
 * L'intro (BRIEF.md § Concept, MONTRE.md § Budget) : à la première visite, la montre attend
 * au centre, à l'état 1. Un appui sur le poussoir l'assemble jusqu'à l'état 2, puis elle
 * rejoint le hero, en 2 s au plus. L'accent (2 → 3) arrive ensuite, hero affiché (C2).
 *
 * L'état vit sur <html data-intro> : `a-jouer`, `en-cours`, puis `vue`. Il est décidé avant
 * le premier paint par le script de <head> (lib/html-state.ts).
 */
export type Intro = 'a-jouer' | 'en-cours' | 'vue';

export const BUDGET_INTRO_MS = 2000; // de l'appui à l'affichage du hero (DESIGN.md)
export const DUREE_ASSEMBLAGE = 1.1; // s : 1 → 2, la migration des aiguilles
export const DUREE_REVELATION = 0.6; // s : la montre rejoint le hero
export const DUREE_ACCENT = 0.8; // s : 2 → 3, une fois le hero affiché

export const LIBELLE_INTRO = 'Démarrer la montre';
export const LIBELLE_CHRONO = 'Arrêter le chrono';

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributeFilter: ['data-intro'] });
  return () => observer.disconnect();
}
const lire = (): Intro => (document.documentElement.dataset.intro as Intro | undefined) ?? 'vue';
const lireServeur = (): Intro => 'vue';

export const useIntro = () => useSyncExternalStore(subscribe, lire, lireServeur);
export const lireIntro = lire;

export function setIntro(intro: Intro) {
  document.documentElement.dataset.intro = intro;
}

/** Instant (performance.now) d'un appui sur le poussoir survenu avant React, s'il y en a eu. */
export const appuiPrecoce = () =>
  (window as unknown as { __chronodev?: { appui?: number } }).__chronodev?.appui;
