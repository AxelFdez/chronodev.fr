export const THEME_KEY = 'chronodev-theme';
export const INTRO_KEY = 'chronodev-intro-vue';

/**
 * Pose l'état de <html> avant le premier paint : thème, présence de JS, intro à jouer.
 * Sérialisée telle quelle dans <head> (voir HEAD_SCRIPT) : elle ne doit rien référencer
 * hors de son propre corps, d'où les clés écrites en dur. Elle est rejouée au montage du
 * poussoir de thème (remontage Strict Mode en développement) : l'intro n'est décidée
 * qu'une fois.
 */
export function applyHtmlState() {
  const root = document.documentElement;
  const w = window as unknown as { __chronodev?: { intro: string; appui?: number } };
  root.dataset.js = '';
  let theme: string | null = null;
  try {
    theme = localStorage.getItem('chronodev-theme');
  } catch {}
  root.dataset.theme = theme === 'light' ? 'light' : 'dark';

  if (!w.__chronodev) {
    // L'intro se joue à la première visite seulement. Pas d'intro si le stockage est
    // illisible (elle ne pourrait jamais être marquée comme vue) ni sous mouvement réduit.
    // Elle est marquée vue dès qu'elle s'affiche : jamais rejouée, même sans appui.
    let intro = 'vue';
    try {
      if (
        localStorage.getItem('chronodev-intro-vue') === null &&
        !matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        localStorage.setItem('chronodev-intro-vue', '1');
        intro = 'a-jouer';
      }
    } catch {}
    const etat = (w.__chronodev = { intro } as { intro: string; appui?: number });
    if (intro === 'a-jouer') {
      // Le poussoir est cliquable au premier frame (DESIGN.md) : un appui avant React est
      // noté, et si React n'a pas pris la main 2 s plus tard, le hero s'affiche sans attendre.
      document.addEventListener(
        'click',
        (e) => {
          const cible = e.target as Element | null;
          if (etat.appui || !cible?.closest?.('[data-poussoir]')) return;
          etat.appui = performance.now();
          setTimeout(() => {
            if (root.dataset.intro !== 'a-jouer') return;
            root.dataset.intro = 'vue';
            performance.mark('intro:hero');
          }, 2000);
        },
        true,
      );
    }
  }
  // En développement, le remontage efface l'attribut : on repose la décision prise.
  root.dataset.intro ??= w.__chronodev.intro;
}

export const HEAD_SCRIPT = `(${applyHtmlState.toString()})()`;
