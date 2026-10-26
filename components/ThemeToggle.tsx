'use client';

import { useLayoutEffect, useSyncExternalStore } from 'react';
import { applyHtmlState, THEME_KEY } from '@/lib/html-state';
import styles from './ThemeToggle.module.css';

type Theme = 'dark' | 'light';

// Le thème vit sur <html data-theme>, posé avant le premier paint par le script de <head>.
// React ne fait que le lire : le serveur rend « sombre », le client corrige à l'hydratation.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}
const getSnapshot = (): Theme =>
  document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
const getServerSnapshot = (): Theme => 'dark';

/** Second poussoir du chronographe : bascule de thème, capsule 54×46. */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // En développement, le remontage de Strict Mode efface les attributs posés sur <html>
  // par le script de <head> : on les repose. Sans effet en production.
  useLayoutEffect(() => {
    applyHtmlState();
  }, []);

  function toggle() {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Stockage bloqué : le choix vaut pour cette page seulement.
    }
  }

  return (
    <button
      type="button"
      className={styles.pusher}
      aria-label="Thème clair"
      aria-pressed={theme === 'light'}
      onClick={toggle}
    >
      <svg className={styles.icon} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
        <circle cx="10" cy="10" r="7.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 2.75a7.25 7.25 0 0 1 0 14.5z" fill="currentColor" />
      </svg>
    </button>
  );
}
