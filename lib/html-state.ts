export const THEME_KEY = 'chronodev-theme';
export const INTRO_KEY = 'chronodev-intro-vue';

/**
 * Pose l'état de <html> avant le premier paint : thème, présence de JS, intro à jouer.
 * Sérialisée telle quelle dans <head> (voir HEAD_SCRIPT) : elle ne doit rien référencer
 * hors de son propre corps, d'où les clés écrites en dur.
 */
export function applyHtmlState() {
  const root = document.documentElement;
  root.dataset.js = '';
  let theme: string | null = null;
  // Stockage illisible (navigation privée, stockage bloqué) : l'intro ne pourrait jamais
  // être marquée comme vue, on ne la joue donc pas. La conversion passe avant.
  let introVue = true;
  try {
    theme = localStorage.getItem('chronodev-theme');
    introVue = localStorage.getItem('chronodev-intro-vue') !== null;
  } catch {}
  root.dataset.theme = theme === 'light' ? 'light' : 'dark';
  root.dataset.intro = introVue ? 'vue' : 'a-jouer';
}

export const HEAD_SCRIPT = `(${applyHtmlState.toString()})()`;
