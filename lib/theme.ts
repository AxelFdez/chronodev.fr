import { useSyncExternalStore } from 'react';
import { THEME_KEY } from './html-state';

export type Theme = 'dark' | 'light';

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

export const useTheme = () => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Stockage bloqué : le choix vaut pour cette page seulement.
  }
}
