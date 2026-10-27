/**
 * Module « Dernière veille » (BRIEF.md § Preuve, docs/VEILLE.md). n8n publie un JSON ; le
 * site ne l'affiche que s'il est valide, validé par Axel et récent. Au moindre doute, rien
 * ne s'affiche (échec fermé) : un module absent ne coûte rien, un module faux coûte la
 * confiance.
 */

export const VEILLE_URL = `${process.env.BASE_PATH ?? ''}/veille/derniere.json`;
export const SEUIL_JOURS = 21; // décision d'Axel (PLAN.md C11)
export const DELAI_MS = 3000; // au-delà, on abandonne : le module n'est jamais attendu

export type EntreeVeille = {
  date: string; // AAAA-MM-JJ
  titre: string;
  resume: string;
  source: { nom: string; url: string };
  validee: { par: string; le: string }; // validation humaine dans n8n (C11)
};

const JOUR_MS = 86_400_000;

function texte(valeur: unknown, max: number): string | null {
  if (typeof valeur !== 'string') return null;
  const t = valeur.trim();
  return t.length > 0 && t.length <= max ? t : null;
}

function urlHttps(valeur: unknown): string | null {
  if (typeof valeur !== 'string') return null;
  try {
    const url = new URL(valeur);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

/** Valide le JSON publié par n8n. Renvoie l'entrée à afficher, ou null. */
export function lireVeille(donnees: unknown, maintenant: number): EntreeVeille | null {
  if (typeof donnees !== 'object' || donnees === null) return null;
  const { version, entree } = donnees as { version?: unknown; entree?: unknown };
  if (version !== 1 || typeof entree !== 'object' || entree === null) return null;
  const e = entree as Record<string, unknown>;
  const source = (e.source ?? {}) as Record<string, unknown>;
  const validee = (e.validee ?? {}) as Record<string, unknown>;

  const date = typeof e.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e.date) ? e.date : null;
  const jour = date ? Date.parse(`${date}T00:00:00Z`) : NaN;
  const valideLe = typeof validee.le === 'string' ? Date.parse(validee.le) : NaN;
  const lu = {
    titre: texte(e.titre, 120),
    resume: texte(e.resume, 600),
    nom: texte(source.nom, 80),
    url: urlHttps(source.url),
    par: texte(validee.par, 60),
  };
  if (!date || Number.isNaN(jour) || Number.isNaN(valideLe)) return null;
  if (Object.values(lu).some((v) => v === null)) return null;

  // Âge en jours calendaires (UTC) : une entrée du 5 a 21 jours tout le 26, pas 21,5.
  const aujourdhui = Math.floor(maintenant / JOUR_MS) * JOUR_MS;
  const age = Math.round((aujourdhui - jour) / JOUR_MS);
  // Trop vieille, ou datée dans le futur (au-delà d'un jour de décalage horaire) : douteuse.
  if (age > SEUIL_JOURS || age < -1) return null;

  return {
    date,
    titre: lu.titre!,
    resume: lu.resume!,
    source: { nom: lu.nom!, url: lu.url! },
    validee: { par: lu.par!, le: new Date(valideLe).toISOString() },
  };
}

const formatJour = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** « 20 octobre 2026 », pour une date AAAA-MM-JJ ou un instant ISO. */
export const dateEnMots = (iso: string) =>
  formatJour.format(new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso));
