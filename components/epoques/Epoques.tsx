import { apres, avant, pendant } from '@/content/epoques';
import { site } from '@/content/site';
import { Veille } from '@/components/veille/Veille';
import { Repere } from './Repere';
import styles from './Epoques.module.css';

/**
 * Section des époques, à la suite (PLAN.md § T8) : Avant, Pendant et Après se lisent
 * dans l'ordre en défilant, le problème avant l'offre. La section qui croise la ligne de
 * lecture donne l'état de la montre et le grain (lib/epoque.ts). Tout est dans le HTML servi,
 * et tout est visible sans JavaScript.
 */
export function Epoques() {
  return (
    <section id="epoques" className={styles.epoques} aria-labelledby="epoques-titre">
      <h2 id="epoques-titre" className={styles.titreSection}>
        Votre projet
      </h2>
      <Repere />

      <section
        id="epoque-avant"
        data-epoque="avant"
        className={styles.etape}
        aria-labelledby="epoque-avant-titre"
      >
        <p className={styles.etiquette}>Avant</p>
        <h3 id="epoque-avant-titre" className={styles.titre}>
          {avant.titre}
        </h3>
        <ul className={styles.constats}>
          {avant.constats.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>

      <section
        id="epoque-pendant"
        data-epoque="pendant"
        className={styles.etape}
        aria-labelledby="epoque-pendant-titre"
      >
        <p className={styles.etiquette}>Pendant</p>
        <h3 id="epoque-pendant-titre" className={styles.titre}>
          {pendant.titre}
        </h3>
        <dl className={styles.engagements}>
          {pendant.engagements.map(({ quand, quoi }) => (
            <div key={quand}>
              <dt>{quand}</dt>
              <dd>{quoi}</dd>
            </div>
          ))}
        </dl>
        <dl className={styles.partage}>
          {pendant.partage.map(({ qui, quoi }) => (
            <div key={qui}>
              <dt>{qui}</dt>
              <dd>{quoi}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section
        id="epoque-apres"
        data-epoque="apres"
        className={styles.etape}
        aria-labelledby="epoque-apres-titre"
      >
        <p className={styles.etiquette}>Après</p>
        <h3 id="epoque-apres-titre" className={styles.titre}>
          {apres.titre}
        </h3>
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
      </section>
    </section>
  );
}
