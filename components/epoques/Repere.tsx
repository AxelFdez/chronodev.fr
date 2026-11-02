'use client';

import { useEffect } from 'react';
import { EPOQUES, type EpoqueId } from '@/content/epoques';
import { setEpoque, useEpoque } from '@/lib/epoque';
import styles from './Epoques.module.css';

// La ligne de lecture, à 30 % du haut de la fenêtre. Plus bas (au milieu), une section courte
// amenée en haut par le repère ne la croiserait pas : le repère marquerait la suivante.
const LIGNE = 0.3;

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
          const id = (e.target as HTMLElement).dataset.epoque as EpoqueId | undefined;
          if (!id) continue; // le contact : observé seulement pour recalculer (voir plus bas)
          if (e.isIntersecting) visibles.add(id);
          else visibles.delete(id);
        }
        // Une seule section croise la ligne de lecture, sauf à une frontière : la plus avancée.
        // Aucune : au-dessus d'Avant (le hero), pas d'époque ; sous Après (le contact), Après.
        const croisee = EPOQUES.filter(({ id }) => visibles.has(id)).at(-1)?.id;
        const fin = document.getElementById('epoque-apres')!.getBoundingClientRect().bottom;
        setEpoque(croisee ?? (fin < innerHeight * LIGNE ? 'apres' : null));
      },
      { rootMargin: `-${LIGNE * 100}% 0px -${(1 - LIGNE) * 100}% 0px` },
    );
    // Le contact aussi : un saut direct du hero au contact (le bouton du hero) ne fait croiser
    // la ligne à aucune époque, et rien ne serait recalculé.
    document
      .querySelectorAll<HTMLElement>('section[data-epoque], #contact')
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
