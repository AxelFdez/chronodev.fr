import Link from 'next/link';
import styles from './prose.module.css';

export default function NotFound() {
  return (
    <main id="contenu" className={styles.main}>
      <h1>Page introuvable.</h1>
      <p>
        <Link href="/">Revenir à l’accueil</Link>
      </p>
    </main>
  );
}
