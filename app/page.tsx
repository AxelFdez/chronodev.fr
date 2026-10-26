import { ContactValue } from '@/components/ContactValue';
import { Watch } from '@/components/watch/Watch';
import { contact, site } from '@/content/site';
import styles from './page.module.css';

export default function Home() {
  return (
    <main id="contenu">
      <section className={styles.hero} aria-labelledby="accroche">
        <div className={styles.texte}>
          <p className={styles.surtitre}>{site.surtitre}</p>
          <h1 id="accroche" className={styles.accroche}>
            {site.accroche}
          </h1>
          <p className={styles.sousTitre}>{site.sousTitre}</p>
          <p className={styles.cible}>{site.cible}</p>
          <a className={styles.cta} href="#contact">
            {site.cta}
          </a>
        </div>
        {/* Latérale et moins contrastée que le texte : elle ne passe jamais avant lui. */}
        <div className={styles.montre}>
          <Watch />
        </div>
      </section>

      <section id="contact" className={styles.contact} aria-labelledby="contact-titre">
        <h2 id="contact-titre" className={styles.titre}>
          Contact
        </h2>
        <dl className={styles.coordonnees}>
          <dt>E-mail</dt>
          <dd>
            <ContactValue type="email" valeur={contact.email} />
          </dd>
          <dt>Téléphone</dt>
          <dd>
            <ContactValue type="telephone" valeur={contact.telephone} />
          </dd>
          <dt>Basé à</dt>
          <dd>{contact.ville}</dd>
        </dl>
      </section>
    </main>
  );
}
