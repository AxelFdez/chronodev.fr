'use client';

import { useRef, useSyncExternalStore } from 'react';
import { EPOQUES } from '@/content/epoques';
import styles from './Watch.module.css';

/**
 * La montre — régulateur à gousset (docs/MONTRE.md). Une seule instance par page.
 * Corrige assets/montre.svg selon docs/PLAN.md § 2 : calques réordonnés (S1, S2, S4),
 * reflet ramené dans le boîtier (S5), aiguilles dessinées à 0° (S6, S7), couleurs en
 * variables par thème (S8), décorative (S9), ids préfixés (S11).
 *
 * Ordre de superposition, du fond vers le dessus : boîtier (l1, puis matière l2),
 * cadran, graduations, sous-cadran (l2), jour/nuit (l3), aiguilles h/m, trotteuse, axe.
 * Les états 1 → 3 ne changent que des opacités et des couleurs (CSS), plus la migration
 * des aiguilles h/m vers le sous-cadran (attribut transform).
 *
 * L'état suit l'époque cochée dans la section des époques (le groupe radio fait foi).
 * La couronne est la molette : la glisser au pointeur change d'époque. Sans JavaScript,
 * la montre reste à l'état 3, quelle que soit l'époque affichée.
 */

export type Etat = 1 | 2 | 3;

// --- Lien avec le groupe radio des époques ---

const radioCochee = () =>
  document.querySelector<HTMLInputElement>('input[name="epoque"]:checked')?.value;

function subscribe(onChange: () => void) {
  document.addEventListener('change', onChange);
  return () => document.removeEventListener('change', onChange);
}
const getEtat = (): Etat => EPOQUES.find((e) => e.id === radioCochee())?.etat ?? 3;
const getEtatServeur = (): Etat => 3; // Après, l'époque par défaut

/** Coche l'époque d'indice `index`, comme le ferait un clic sur son onglet. */
function choisirEpoque(index: number) {
  const id = EPOQUES[Math.max(0, Math.min(EPOQUES.length - 1, index))].id;
  const input = document.querySelector<HTMLInputElement>(`input[name="epoque"][value="${id}"]`);
  if (!input || input.checked) return;
  input.checked = true;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

// Glisser la couronne : 40 px vers la droite avancent d'une époque, vers la gauche reculent.
const PAS_DE_GLISSER = 40;

// Repère (MONTRE.md § Repère) : centre du boîtier, chemin de fer, sous-cadran de 6 h.
const CX = 190;
const CY = 290;

/** Point à `r` du centre, à `deg` degrés dans le sens horaire depuis 12 h. */
function polar(deg: number, r: number) {
  const a = (deg * Math.PI) / 180;
  return { x: +(CX + r * Math.sin(a)).toFixed(2), y: +(CY - r * Math.cos(a)).toFixed(2) };
}

function tick(deg: number, rInner: number, rOuter: number) {
  const outer = polar(deg, rOuter);
  const inner = polar(deg, rInner);
  return { x1: outer.x, y1: outer.y, x2: inner.x, y2: inner.y };
}

// 12 majeures (r 96 → 104). Celle de 6 h disparaît dès l'état 2, sous le sous-cadran.
const MAJOR = Array.from({ length: 12 }, (_, i) => i * 30);
// 44 fines (r 99 → 104). 168° à 192° volontairement absentes : elles frôlaient le
// sous-cadran à moins de 2 px (MONTRE.md § Repère).
const MINOR = Array.from({ length: 60 }, (_, i) => i * 6).filter(
  (deg) => deg % 30 !== 0 && (deg < 168 || deg > 192),
);

// Migration des aiguilles h/m vers le sous-cadran (MONTRE.md § Le seul moment non
// additif) : échelle 0,35 autour de (190, 290), puis 62 vers le bas → pivot en (190, 352).
const MIGRATION = 'matrix(0.35 0 0 0.35 123.5 250.5)';

// Pose fixe, en attendant l'heure réelle (tranche 4, PLAN.md C5) : 1 h 25 min 03 s.
// Les angles sont cohérents entre eux, et la trotteuse tombe sur une graduation.
const POSE = { heures: 42.5, minutes: 150, secondes: 18 };

export function Watch() {
  const etat = useSyncExternalStore(subscribe, getEtat, getEtatServeur);
  const glisser = useRef<{ x: number; depart: number } | null>(null);

  return (
    <svg
      className={styles.watch}
      data-etat={etat}
      viewBox="0 41 380 412"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="w-brass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E8CF9A" />
          <stop offset="0.32" stopColor="#C9A05A" />
          <stop offset="0.66" stopColor="#B8893B" />
          <stop offset="1" stopColor="#6E5324" />
        </linearGradient>
        <linearGradient id="w-brass-flank" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8A6A2E" />
          <stop offset="1" stopColor="#4F3A18" />
        </linearGradient>
      </defs>

      {/* Boîtier, état 1 : aplat mat. Toujours présent, sous la matière. */}
      <g>
        <circle cx="190" cy="72" r="22" fill="none" stroke="#8A6A2E" strokeWidth="9" />
        <circle cx="190" cy="100" r="8" fill="#6E5324" />
        <rect x="174" y="104" width="32" height="34" rx="6" fill="#8A6A2E" />
        <g stroke="#5A4420" strokeWidth="1.8">
          <line x1="183" y1="111" x2="183" y2="131" />
          <line x1="190" y1="111" x2="190" y2="131" />
          <line x1="197" y1="111" x2="197" y2="131" />
        </g>
        <rect x="182" y="138" width="16" height="26" fill="#6E5324" />
        <rect
          x="273.8"
          y="178.7"
          width="36"
          height="19"
          rx="9.5"
          transform="rotate(45 291.8 188.2)"
          fill="#8A6A2E"
        />
        <circle cx="190" cy="304" r="130" fill="#5A4420" />
        <rect
          x="170"
          y="428"
          width="14"
          height="17"
          rx="4"
          fill="#6E5324"
          stroke="#4F3A18"
          strokeWidth="1"
        />
        <rect
          x="196"
          y="428"
          width="14"
          height="17"
          rx="4"
          fill="#6E5324"
          stroke="#4F3A18"
          strokeWidth="1"
        />
        <line x1="183" y1="436" x2="197" y2="436" stroke="#4F3A18" strokeWidth="3.5" />
        <circle cx="190" cy="290" r="130" fill="#8A6A2E" />
        <circle cx="190" cy="290" r="118" fill="none" stroke="#4F3A18" strokeWidth="2.5" />
      </g>

      {/* Boîtier, état 2 : la matière (dégradés, moletage, reflets). */}
      <g className={styles.l2}>
        <circle cx="190" cy="72" r="22" fill="none" stroke="url(#w-brass)" strokeWidth="9" />
        <circle cx="190" cy="100" r="8" fill="#8A6A2E" />
        <rect x="174" y="104" width="32" height="34" rx="6" fill="url(#w-brass)" />
        <g stroke="#6E5324" strokeWidth="1.8">
          <line x1="183" y1="111" x2="183" y2="131" />
          <line x1="190" y1="111" x2="190" y2="131" />
          <line x1="197" y1="111" x2="197" y2="131" />
        </g>
        <rect x="182" y="138" width="16" height="26" fill="#8A6A2E" />
        <rect
          x="273.8"
          y="178.7"
          width="36"
          height="19"
          rx="9.5"
          transform="rotate(45 291.8 188.2)"
          fill="url(#w-brass)"
        />
        <rect
          x="277"
          y="184"
          width="26"
          height="8"
          rx="4"
          transform="rotate(45 291.8 188.2)"
          fill="#6E5324"
          opacity="0.55"
        />
        <circle cx="190" cy="304" r="130" fill="url(#w-brass-flank)" />
        <g stroke="#4F3A18" strokeWidth="2.2">
          <line x1="286.6" y1="391.0" x2="277.7" y2="382.9" />
          <line x1="273.6" y1="403.6" x2="265.9" y2="394.4" />
          <line x1="258.9" y1="414.2" x2="252.5" y2="404.1" />
          <line x1="242.9" y1="422.8" x2="238.0" y2="411.9" />
          <line x1="225.9" y1="428.9" x2="222.6" y2="417.4" />
          <line x1="154.1" y1="428.9" x2="157.4" y2="417.4" />
          <line x1="137.1" y1="422.8" x2="142.0" y2="411.9" />
          <line x1="121.1" y1="414.2" x2="127.5" y2="404.1" />
          <line x1="106.4" y1="403.6" x2="114.1" y2="394.4" />
          <line x1="93.4" y1="391.0" x2="102.3" y2="382.9" />
        </g>
        <rect
          x="170"
          y="428"
          width="14"
          height="17"
          rx="4"
          fill="#A6812F"
          stroke="#4F3A18"
          strokeWidth="1"
        />
        <rect
          x="196"
          y="428"
          width="14"
          height="17"
          rx="4"
          fill="#A6812F"
          stroke="#4F3A18"
          strokeWidth="1"
        />
        <line x1="183" y1="436" x2="197" y2="436" stroke="#6E5324" strokeWidth="3.5" />
        <circle cx="190" cy="290" r="130" fill="url(#w-brass)" />
        <g className={styles.specular}>
          <path
            d="M 319.5 301.3 A 130 130 0 0 1 60.5 301.3"
            fill="none"
            stroke="#E8CF9A"
            strokeWidth="1.3"
            opacity="0.4"
          />
          {/* Arc concentrique r 124 : l'original sortait de 3 px du boîtier (S5). */}
          <path
            data-part="reflet"
            d="M 68 268.1 A 124 124 0 0 1 168.1 168"
            fill="none"
            stroke="#E8CF9A"
            strokeWidth="3"
            opacity="0.5"
          />
        </g>
        <circle cx="190" cy="290" r="118" fill="none" stroke="#6E5324" strokeWidth="2.5" />
      </g>

      {/* Filet clair intérieur de lunette, état 3. */}
      <circle
        className={styles.l3}
        cx="190"
        cy="290"
        r="114"
        fill="none"
        stroke="#E8CF9A"
        strokeWidth="0.8"
        opacity="0.28"
      />

      {/* Cadran commun aux trois états. */}
      <circle className={styles.dial} cx="190" cy="290" r="112" />

      {/* Graduations majeures, communes : leur couleur change à l'état 2 (MONTRE.md § #l2). */}
      <g className={styles.ticksMajor} strokeWidth="2.4">
        {MAJOR.map((deg) => (
          <line
            key={deg}
            className={deg === 180 ? styles.tick180 : undefined}
            {...tick(deg, 96, 104)}
          />
        ))}
      </g>

      <g className={`${styles.l2} ${styles.ticksMinor}`} strokeWidth="1">
        {MINOR.map((deg) => (
          <line key={deg} {...tick(deg, 99, 104)} />
        ))}
      </g>

      {/* Sous-cadran de 6 h, sans aiguilles propres : il reçoit les aiguilles migrantes. */}
      <g className={`${styles.l2} ${styles.subdial}`} data-part="sous-cadran">
        <circle className={styles.subdialFace} cx="190" cy="352" r="36" strokeWidth="1.4" />
        <circle
          className={styles.subdialInner}
          cx="190"
          cy="352"
          r="30"
          fill="none"
          strokeWidth="1"
        />
        <g className={styles.subdialTicks} strokeWidth="1.8">
          <line x1="190" y1="316" x2="190" y2="322" />
          <line x1="226" y1="352" x2="220" y2="352" />
          <line x1="190" y1="388" x2="190" y2="382" />
          <line x1="154" y1="352" x2="160" y2="352" />
        </g>
        <g className={styles.subdialTicksMinor} strokeWidth="1.2">
          <line x1="215.5" y1="326.5" x2="212" y2="330" />
          <line x1="215.5" y1="377.5" x2="212" y2="374" />
          <line x1="164.5" y1="377.5" x2="168" y2="374" />
          <line x1="164.5" y1="326.5" x2="168" y2="330" />
        </g>
      </g>

      {/* Jour/nuit à 12 h, état 3. Sous les aiguilles (S4). */}
      <g className={`${styles.l3} ${styles.daynight}`}>
        <circle className={styles.daynightFace} cx="190" cy="228" r="26" strokeWidth="1.2" />
        <path className={styles.accentFill} d="M 190 202 A 26 26 0 0 1 190 254 Z" opacity="0.2" />
        <line className={styles.daynightLine} x1="190" y1="202" x2="190" y2="254" strokeWidth="1" />
        <circle className={styles.accentFill} cx="203" cy="228" r="2.6" />
        <circle
          className={styles.daynightHollow}
          cx="177"
          cy="228"
          r="2.2"
          fill="none"
          strokeWidth="1.2"
        />
      </g>

      {/* Aiguilles h/m : au centre à l'état 1, dans le sous-cadran ensuite. Au-dessus de
          tout le cadran (S1). Dessinées à 0°, orientées par rotate() (S6, S7). */}
      <g data-part="aiguilles" transform={etat === 1 ? undefined : MIGRATION}>
        <line
          className={styles.hourHand}
          x1="190"
          y1="290"
          x2="190"
          y2="235"
          strokeWidth="4.5"
          transform={`rotate(${POSE.heures} 190 290)`}
        />
        <line
          className={styles.minuteHand}
          x1="190"
          y1="290"
          x2="190"
          y2="202"
          strokeWidth="2.8"
          transform={`rotate(${POSE.minutes} 190 290)`}
        />
        <circle className={styles.handsCap} cx="190" cy="290" r="6" />
      </g>

      {/* Trotteuse centrale et axe du chronographe, état 2. Le cyan n'arrive qu'à l'état 3. */}
      <line
        className={`${styles.l2} ${styles.seconds}`}
        data-part="trotteuse"
        x1="190"
        y1="310"
        x2="190"
        y2="190"
        strokeWidth="3"
        transform={`rotate(${POSE.secondes} 190 290)`}
      />
      <circle className={`${styles.l2} ${styles.cap}`} cx="190" cy="290" r="7" />

      {/* Zone de prise de la couronne (anneau, couronne, tige), plus large que le dessin.
          Pointeur fin seulement : au pouce, c'est trop imprécis (BRIEF.md), les onglets
          suffisent. Le clavier passe par le groupe radio : rien ici n'est focalisable. */}
      <rect
        className={styles.couronne}
        data-part="couronne"
        x="150"
        y="41"
        width="80"
        height="128"
        fill="transparent"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          glisser.current = { x: e.clientX, depart: etat - 1 };
        }}
        onPointerMove={(e) => {
          if (!glisser.current) return;
          const pas = Math.round((e.clientX - glisser.current.x) / PAS_DE_GLISSER);
          choisirEpoque(glisser.current.depart + pas);
        }}
        onPointerUp={() => (glisser.current = null)}
        onPointerCancel={() => (glisser.current = null)}
      />
    </svg>
  );
}
