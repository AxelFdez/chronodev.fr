import Link from 'next/link';
import { site } from '@/content/site';
import { Menu } from './Menu';
import { ThemeToggle } from './ThemeToggle';
import styles from './TopBar.module.css';

/** Barre du haut, unique, commune à l'intro et au hero (CLAUDE.md, décision « Toggle »). */
export function TopBar() {
  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          {site.nom}
        </Link>
        <div className={styles.actions}>
          <Menu />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
