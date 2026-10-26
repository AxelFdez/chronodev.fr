import { apres, avant, EPOQUE_PAR_DEFAUT, EPOQUES, pendant } from '@/content/epoques';
import { site } from '@/content/site';
import { Veille } from '@/components/veille/Veille';
import styles from './Epoques.module.css';

/**
 * Section des époques. Le groupe radio est la source de vérité : il change de panneau en
 * CSS seul (:has), donc sans JavaScript. La couronne de la montre le pilote au pointeur.
 * Tout le texte des trois époques est dans le HTML servi.
 */
export function Epoques() {
  return (
    <section id="epoques" className={styles.epoques} aria-labelledby="epoques-titre">
      <fieldset className={styles.molette}>
        <legend className={styles.legende}>
          <h2 id="epoques-titre">Votre projet</h2>
        </legend>
        <div className={styles.onglets}>
          {EPOQUES.map(({ id, libelle }) => (
            <span key={id} className={styles.onglet}>
              <input
                type="radio"
                name="epoque"
                id={`epoque-${id}`}
                value={id}
                defaultChecked={id === EPOQUE_PAR_DEFAUT}
                // Au rechargement, le navigateur ne doit pas restaurer une autre époque.
                autoComplete="off"
              />
              <label htmlFor={`epoque-${id}`}>{libelle}</label>
            </span>
          ))}
        </div>
      </fieldset>

      <div className={styles.panneau} data-epoque="avant">
        <h3 className={styles.titre}>{avant.titre}</h3>
        <ul className={styles.constats}>
          {avant.constats.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>

      <div className={styles.panneau} data-epoque="pendant">
        <h3 className={styles.titre}>{pendant.titre}</h3>
        <dl className={styles.engagements}>
          {pendant.engagements.map(({ quand, quoi }) => (
            <div key={quand}>
              <dt>{quand}</dt>
              <dd>{quoi}</dd>
            </div>
          ))}
        </dl>
        <div className={styles.partage}>
          {[pendant.ia, pendant.humain].map(({ titre, points }) => (
            <div key={titre} className={styles.carte}>
              <h4>{titre}</h4>
              <ul>
                {points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.panneau} data-epoque="apres">
        <h3 className={styles.titre}>{apres.titre}</h3>
        <h4 className={styles.sousTitre}>Offres</h4>
        <ul className={styles.offres}>
          {apres.offres.map((o) => (
            <li key={o.nom} className={styles.carte}>
              <p className={styles.offreNom}>{o.nom}</p>
              <p>{o.contenu}</p>
              <p className={styles.prix}>{o.prix}</p>
            </li>
          ))}
        </ul>
        <h4 className={styles.sousTitre}>Preuves</h4>
        <div className={`${styles.carte} ${styles.preuve}`}>
          <p className={styles.offreNom}>{apres.preuve.projet}</p>
          <p>{apres.preuve.client}</p>
          <p>{apres.preuve.resultat}</p>
        </div>
        {/* Sous son propre titre, jamais sous « Preuves » (BRIEF.md § Preuve). Avant le CTA,
            qui reste le dernier élément de l'époque ; apparaît sous la ligne de flottaison. */}
        <Veille />
        <a className={styles.cta} href="#contact">
          {site.cta}
        </a>
      </div>
    </section>
  );
}
