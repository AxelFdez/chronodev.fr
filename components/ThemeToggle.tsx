'use client';

import { useLayoutEffect } from 'react';
import { applyHtmlState } from '@/lib/html-state';
import { setTheme, useTheme } from '@/lib/theme';
import styles from './ThemeToggle.module.css';

/** Second poussoir du chronographe : bascule de thème, capsule 54×46. */
export function ThemeToggle() {
  const theme = useTheme();

  // En développement, le remontage de Strict Mode efface les attributs posés sur <html>
  // par le script de <head> : on les repose. Sans effet en production.
  useLayoutEffect(() => {
    applyHtmlState();
  }, []);

  return (
    <button
      type="button"
      className={styles.pusher}
      aria-label="Thème clair"
      aria-pressed={theme === 'light'}
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      <svg className={styles.icon} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
        <circle cx="10" cy="10" r="7.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 2.75a7.25 7.25 0 0 1 0 14.5z" fill="currentColor" />
      </svg>
    </button>
  );
}
