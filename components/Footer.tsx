import Link from 'next/link';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p>Axel, développeur indépendant à Nice.</p>
        <Link href="/mentions-legales/">Mentions légales</Link>
      </div>
    </footer>
  );
}
