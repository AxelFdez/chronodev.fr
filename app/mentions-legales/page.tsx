import type { Metadata } from 'next';
import { ContactValue } from '@/components/ContactValue';
import { contact, mentions, site } from '@/content/site';
import styles from '../prose.module.css';

export const metadata: Metadata = {
  title: `Mentions légales — ${site.nom}`,
  description: `Éditeur, hébergement et données personnelles de ${site.nom}.`,
};

// LCEN, art. 6 III. L'éditeur est un entrepreneur individuel : la mention « EI » est
// obligatoire à côté de son nom. Les valeurs entre crochets attendent Axel.
export default function MentionsLegales() {
  return (
    <main id="contenu" className={styles.main}>
      <h1>Mentions légales</h1>

      <h2>Éditeur</h2>
      <p>
        {mentions.editeur} (EI), entrepreneur individuel
        <br />
        {mentions.adresse}
        <br />
        SIRET : {mentions.siret}
        <br />
        E-mail : <ContactValue type="email" valeur={contact.email} />
        <br />
        Téléphone : <ContactValue type="telephone" valeur={contact.telephone} />
      </p>
      <p>Directeur de la publication : {mentions.editeur}.</p>

      <h2>Hébergement</h2>
      <p>
        {mentions.hebergeurNom}
        <br />
        {mentions.hebergeurAdresse}
        <br />
        Téléphone : {mentions.hebergeurTelephone}
      </p>

      <h2>Données personnelles</h2>
      <p>
        Ce site ne dépose aucun cookie et n’utilise aucun outil de mesure d’audience. Il garde dans
        votre navigateur deux préférences, qui ne quittent pas votre appareil : le thème que vous
        avez choisi, et le fait d’avoir déjà vu l’introduction. Les polices sont servies par le site
        lui-même : aucune requête n’est envoyée à un service tiers.
      </p>
      <p>
        Le serveur conserve des journaux techniques (adresse IP, date, page demandée) pendant{' '}
        {mentions.dureeJournaux}, pour la sécurité du site.
      </p>
      <p>
        Pour toute question, ou pour exercer vos droits d’accès, de rectification et d’effacement :{' '}
        <ContactValue type="email" valeur={contact.email} />. Vous pouvez aussi saisir la{' '}
        <a href="https://www.cnil.fr/">CNIL</a>.
      </p>
    </main>
  );
}
