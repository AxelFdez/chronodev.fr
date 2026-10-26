import Link from 'next/link';
import styles from './page.module.css';

export default function NotFound() {
  return (
    <main id="contenu" className={styles.main}>
      <h1 className={styles.accroche}>Page introuvable.</h1>
      <p>
        <Link href="/">Revenir à l’accueil</Link>
      </p>
    </main>
  );
}
