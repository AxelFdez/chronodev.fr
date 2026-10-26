'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { setTheme, useTheme } from '@/lib/theme';
import styles from './Menu.module.css';

/**
 * Menu de la barre du haut (CLAUDE.md, décision « Menu »). Un <details> natif : il
 * s'ouvre et se ferme sans JavaScript. Le script ajoute la fermeture par Échap, par
 * clic à l'extérieur et après un choix, et l'entrée de thème en mots.
 */
export function Menu() {
  const ref = useRef<HTMLDetailsElement>(null);
  const theme = useTheme();

  useEffect(() => {
    const details = ref.current!;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !details.open) return;
      details.open = false;
      details.querySelector('summary')?.focus();
    };
    const onClick = (e: MouseEvent) => {
      if (details.open && !details.contains(e.target as Node)) details.open = false;
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
    };
  }, []);

  const fermer = () => {
    if (ref.current) ref.current.open = false;
  };

  return (
    <details ref={ref} className={styles.menu}>
      <summary className={styles.bouton}>Menu</summary>
      <nav className={styles.panneau} aria-label="Menu">
        <ul>
          <li>
            <Link href="/#epoques" onClick={fermer}>
              Votre projet
            </Link>
          </li>
          <li>
            <Link href="/#contact" onClick={fermer}>
              Contact
            </Link>
          </li>
          <li>
            <Link href="/mentions-legales/" onClick={fermer}>
              Mentions légales
            </Link>
          </li>
          <li className={styles.theme}>
            <button type="button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
              {theme === 'light' ? 'Passer en thème sombre' : 'Passer en thème clair'}
            </button>
          </li>
        </ul>
      </nav>
    </details>
  );
}
