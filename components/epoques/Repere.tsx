'use client';

import { useEffect } from 'react';
import { EPOQUES, type EpoqueId } from '@/content/epoques';
import { setEpoque, useEpoque } from '@/lib/epoque';
import styles from './Epoques.module.css';

/**
 * Repère des époques, collant en haut de la section : des liens vers Avant, Pendant et Après
 * (de la navigation, pas un état à cocher), qui marquent la section à l'écran. De vraies
 * ancres : sans JavaScript elles marchent, et le focus suit le saut.
 *
 * Il observe aussi les sections et pose l'époque à l'écran (lib/epoque.ts).
 */
export function Repere() {
  const courante = useEpoque();

  useEffect(() => {
    const visibles = new Set<EpoqueId>();
    const observateur = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          const id = (e.target as HTMLElement).dataset.epoque as EpoqueId;
          if (e.isIntersecting) visibles.add(id);
          else visibles.delete(id);
        }
        // Une seule section croise la ligne du milieu, sauf à une frontière : la plus avancée.
        setEpoque(EPOQUES.filter(({ id }) => visibles.has(id)).at(-1)?.id ?? null);
      },
      { rootMargin: '-50% 0px -50% 0px' }, // la ligne du milieu de la fenêtre
    );
    document
      .querySelectorAll<HTMLElement>('section[data-epoque]')
      .forEach((s) => observateur.observe(s));
    return () => {
      observateur.disconnect();
      setEpoque(null);
    };
  }, []);

  return (
    <nav className={styles.repere} aria-label="Étapes de votre projet">
      <ol>
        {EPOQUES.map(({ id, libelle }) => (
          <li key={id}>
            <a href={`#epoque-${id}`} aria-current={courante === id ? 'step' : undefined}>
              {libelle}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
