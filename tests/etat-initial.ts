// États de stockage de départ pour les tests.
const PORT = Number(process.env.PORT ?? 4173);
export const ORIGINE = `http://127.0.0.1:${PORT}`;

/** Visiteur qui a déjà vu l'intro : l'état par défaut de tous les tests, sauf ceux de l'intro. */
export const INTRO_VUE = {
  cookies: [],
  origins: [{ origin: ORIGINE, localStorage: [{ name: 'chronodev-intro-vue', value: '1' }] }],
};

/** Première visite : stockage vide, l'intro se joue. */
export const PREMIERE_VISITE = { cookies: [], origins: [] };
