'use client';

import { useEffect, useState } from 'react';
import { dateEnMots, DELAI_MS, type EntreeVeille, lireVeille, VEILLE_URL } from '@/lib/veille';
import styles from './Veille.module.css';

/**
 * « Dernière veille » : chargé après le rendu, jamais attendu, jamais présenté comme une
 * preuve (il a son propre titre). Rien dans le HTML servi : sans JavaScript, ou au moindre
 * doute sur les données, le module n'existe pas. Le texte vient d'un LLM, relu par Axel :
 * il est rendu en texte brut, jamais en HTML.
 */
export function Veille() {
  const [entree, setEntree] = useState<EntreeVeille | null>(null);

  useEffect(() => {
    const controle = new AbortController();
    const delai = window.setTimeout(() => controle.abort(), DELAI_MS);
    fetch(VEILLE_URL, { signal: controle.signal, cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : null))
      .then((donnees) => setEntree(lireVeille(donnees, Date.now())))
      .catch(() => setEntree(null))
      .finally(() => window.clearTimeout(delai));
    return () => {
      window.clearTimeout(delai);
      controle.abort();
    };
  }, []);

  if (!entree) return null;
  return (
    <section className={styles.veille} aria-labelledby="veille-titre">
      <h4 id="veille-titre" className={styles.titre}>
        Dernière veille
      </h4>
      <div className={styles.carte}>
        <p className={styles.date}>
          <span className={styles.direct} aria-hidden="true" />
          <time dateTime={entree.date}>{dateEnMots(entree.date)}</time>
        </p>
        <p className={styles.sujet}>{entree.titre}</p>
        <p>{entree.resume}</p>
        <p className={styles.source}>
          Source :{' '}
          <a href={entree.source.url} rel="noopener noreferrer">
            {entree.source.nom}
          </a>
        </p>
        <p className={styles.mention}>
          Résumé rédigé avec l’IA, relu et validé par {entree.validee.par} le{' '}
          {dateEnMots(entree.validee.le)}.
        </p>
      </div>
    </section>
  );
}
