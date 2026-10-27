'use client';

import type { gsap as Gsap } from 'gsap';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { EPOQUES } from '@/content/epoques';
import { allerA, etatDe, lireEpoque, useEpoque } from '@/lib/epoque';
import { poserHeure } from '@/lib/horloge';
import {
  appuiPrecoce,
  BUDGET_INTRO_MS,
  DUREE_ACCENT,
  DUREE_ASSEMBLAGE,
  DUREE_REVELATION,
  LIBELLE_CHRONO,
  LIBELLE_INTRO,
  lireIntro,
  setIntro,
  useIntro,
} from '@/lib/intro';
import {
  construireTimeline,
  dureeVers,
  type Etat,
  LABEL,
  MIGRATION,
  poserEtat,
} from '@/lib/montre-animation';
import styles from './Watch.module.css';

/**
 * La montre — régulateur à gousset (docs/MONTRE.md). Une seule instance par page.
 * Corrige assets/montre.svg selon docs/PLAN.md § 2 : calques réordonnés (S1, S4), reflet
 * ramené dans le boîtier (S5), aiguilles dessinées à 0° (S6, S7), couleurs par thème (S8),
 * décorative (S9), ids préfixés (S11).
 *
 * Ordre de superposition, du fond vers le dessus : boîtier (l1, puis matière l2), cadran,
 * graduations, sous-cadran (l2), jour/nuit (l3), aiguilles h/m, trotteuse, axe.
 *
 * États : deux présences numériques, --w-p2 et --w-p3, posées par le CSS selon data-etat
 * (sans JavaScript), puis animées par la timeline GSAP (lib/montre-animation.ts). L'état suit
 * l'époque à l'écran (lib/epoque.ts) : complète dans le hero, puis 1, 2 et 3 en descendant
 * Avant, Pendant et Après. Les aiguilles sont à l'heure réelle (lib/horloge.ts) ; le
 * poussoir arrête et relance le chrono.
 */

/** Fait défiler jusqu'à l'époque d'indice `index`, comme le repère. */
function choisirEpoque(index: number) {
  allerA(EPOQUES[Math.max(0, Math.min(EPOQUES.length - 1, index))].id);
}

// Glisser la couronne : 40 px vers la droite avancent d'une époque, vers la gauche reculent.
const PAS_DE_GLISSER = 40;

// --- Préférence de mouvement ---

const REDUIT = '(prefers-reduced-motion: reduce)';
function surPreference(onChange: () => void) {
  const mq = matchMedia(REDUIT);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}
const getReduit = () => matchMedia(REDUIT).matches;
const getReduitServeur = () => false;

// --- Géométrie (MONTRE.md § Repère) ---

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

// Pose servie dans le HTML, sans JavaScript : 1 h 25 min 03 s. Le script inline qui suit la
// montre la remplace par l'heure réelle avant le premier paint.
const POSE = { heures: 42.5, minutes: 150, secondes: 18 };

export function Watch() {
  const intro = useIntro();
  const etatEpoque = etatDe(useEpoque());
  // Pendant l'intro, la montre attend à l'état 1, puis s'assemble jusqu'à l'état 2.
  const etat: Etat = intro === 'vue' ? etatEpoque : intro === 'en-cours' ? 2 : 1;
  const reduit = useSyncExternalStore(surPreference, getReduit, getReduitServeur);
  const svgRef = useRef<SVGSVGElement>(null);
  const boiteRef = useRef<HTMLDivElement>(null);
  const glisser = useRef<{ x: number; depart: number } | null>(null);

  // --- Chrono : en marche par défaut, arrêté sous mouvement réduit ---
  const [choix, setChoix] = useState<boolean | null>(null);
  const marche = choix ?? !reduit;
  const trotteuseFigee = useRef<number | null>(null);
  const [appui, setAppui] = useState(false);

  useEffect(() => {
    let timer = 0;
    // En marche : un pas par seconde, aligné sur l'horloge. Arrêté : heures, minutes et
    // jour/nuit sautent une fois par minute, la trotteuse reste figée (0 au repos).
    const tic = () => {
      // Angle explicite : relancé par le visiteur, le chrono tourne même sous mouvement réduit.
      poserHeure(marche ? new Date().getSeconds() * 6 : (trotteuseFigee.current ?? 0));
      const pas = marche ? 1000 : 60_000;
      timer = window.setTimeout(tic, pas - (Date.now() % pas) + 5);
    };
    tic();
    const auRetour = () => {
      if (document.visibilityState !== 'visible') return;
      window.clearTimeout(timer);
      tic();
    };
    document.addEventListener('visibilitychange', auRetour);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', auRetour);
    };
  }, [marche]);

  function enfoncer() {
    setAppui(true);
    window.setTimeout(() => setAppui(false), 200);
  }

  function basculerChrono() {
    if (marche) trotteuseFigee.current = new Date().getSeconds() * 6;
    else trotteuseFigee.current = null;
    setChoix(!marche);
    enfoncer();
  }

  // --- États : GSAP chargé à la demande, hors du chemin critique ---
  const anim = useRef<{
    gsap?: typeof Gsap;
    tl?: ReturnType<typeof Gsap.timeline>;
    tween?: ReturnType<typeof Gsap.to>;
    pret?: Promise<void>;
    flip?: Promise<typeof import('gsap/Flip')>;
  }>({});
  // Comment jouer le prochain changement d'état : l'accent après l'intro (0,8 s, une fois
  // la montre arrivée dans le hero), ou sans animation après un saut d'intro.
  const suite = useRef<'accent' | 'instant' | null>(null);
  const sequenceLancee = useRef(false);

  useEffect(() => {
    const svg = svgRef.current!;
    if (reduit) return;
    let annule = false;
    if (lireIntro() !== 'vue') anim.current.flip = import('gsap/Flip');
    anim.current.pret = import('gsap').then(({ gsap }) => {
      if (annule) return;
      const tl = construireTimeline(gsap, svg);
      // L'état affiché à cet instant : 1 pendant l'attente de l'intro, sinon l'époque à l'écran.
      tl.seek(LABEL[lireIntro() === 'vue' ? etatDe(lireEpoque()) : 1]);
      Object.assign(anim.current, { gsap, tl });
      svg.dataset.gsap = '';
    });
    return () => {
      annule = true;
      delete svg.dataset.gsap;
      anim.current.tween?.kill();
      anim.current.tl?.kill();
      anim.current = {};
    };
  }, [reduit]);

  useEffect(() => {
    if (intro === 'en-cours') return; // la séquence d'intro pilote la timeline
    const svg = svgRef.current!;
    const { tl } = anim.current;
    const mode = suite.current;
    suite.current = null;
    if (reduit || !tl || mode === 'instant') {
      anim.current.tween?.kill();
      if (tl) tl.seek(LABEL[etat]);
      else poserEtat(svg, etat);
      return;
    }
    if (tl.labels[LABEL[etat]] === tl.time()) return;
    anim.current.tween?.kill();
    svg.dataset.anime = '';
    anim.current.tween = tl.tweenTo(LABEL[etat], {
      duration: mode === 'accent' ? DUREE_ACCENT : dureeVers(tl, etat),
      delay: mode === 'accent' ? DUREE_REVELATION : 0,
      ease: 'power2.inOut',
      onComplete: () => delete svg.dataset.anime,
    });
  }, [etat, reduit, intro]);

  // --- Intro ---

  function passerIntro() {
    if (lireIntro() === 'vue') return;
    sequenceLancee.current = true;
    anim.current.tween?.kill();
    suite.current = 'instant';
    setIntro('vue');
    performance.mark('intro:hero');
  }

  async function reveler(gsap: typeof Gsap) {
    suite.current = 'accent';
    // Mobile : intro allégée, la montre rejoint sa place sans trajet (BRIEF.md).
    if (matchMedia('(max-width: 899px)').matches || !anim.current.flip) {
      setIntro('vue');
      window.setTimeout(() => performance.mark('intro:hero'), 400); // fondu du hero
      return;
    }
    const { Flip } = await anim.current.flip;
    gsap.registerPlugin(Flip);
    const avant = Flip.getState(boiteRef.current!);
    setIntro('vue'); // la mise en page du hero s'applique tout de suite
    Flip.from(avant, {
      duration: DUREE_REVELATION,
      ease: 'power2.inOut',
      scale: true,
      clearProps: 'transform', // la montre retrouve exactement sa place dans le hero
      onComplete: () => performance.mark('intro:hero'),
    });
  }

  async function jouerIntro(t0 = performance.now()) {
    if (sequenceLancee.current || lireIntro() !== 'a-jouer') return;
    sequenceLancee.current = true;
    performance.mark('intro:appui', { startTime: t0 });
    setIntro('en-cours');
    enfoncer();
    // Le trajet vers le hero garde sa durée ; l'assemblage prend ce que le budget laisse,
    // au plus 1,1 s. En dessous de 0,6 s, la migration serait illisible : on montre le hero.
    const revelation = (matchMedia('(max-width: 899px)').matches ? 0.4 : DUREE_REVELATION) * 1000;
    const minimum = 600;
    const marge = Math.max(0, BUDGET_INTRO_MS - (performance.now() - t0) - revelation - minimum);
    // GSAP doit être là ; on ne l'attend pas au-delà de ce que le budget permet.
    await Promise.race([anim.current.pret, new Promise((r) => setTimeout(r, marge))]);
    const { gsap, tl } = anim.current;
    const assemblage = Math.min(
      DUREE_ASSEMBLAGE * 1000,
      BUDGET_INTRO_MS - (performance.now() - t0) - revelation - 50,
    );
    if (!gsap || !tl || assemblage < minimum) return passerIntro();
    anim.current.tween = tl.tweenTo('pendant', {
      duration: assemblage / 1000,
      ease: 'power2.inOut',
      onComplete: () => void reveler(gsap),
    });
  }

  useEffect(() => {
    if (intro !== 'a-jouer') return;
    // Sorties : lien « Passer l'intro » (déjà suivi sans JS, via :target), Échap, ou toute
    // intention de défiler. L'intro ne retient personne.
    if (location.hash === '#contenu') return passerIntro();
    const t0 = appuiPrecoce();
    if (t0 !== undefined) void jouerIntro(t0);
    const touche = (e: KeyboardEvent) => {
      if (['Escape', 'PageDown', 'ArrowDown', 'End'].includes(e.key)) passerIntro();
    };
    const opts = { passive: true } as const;
    document.addEventListener('keydown', touche);
    window.addEventListener('wheel', passerIntro, opts);
    window.addEventListener('touchmove', passerIntro, opts);
    window.addEventListener('hashchange', passerIntro);
    return () => {
      document.removeEventListener('keydown', touche);
      window.removeEventListener('wheel', passerIntro);
      window.removeEventListener('touchmove', passerIntro);
      window.removeEventListener('hashchange', passerIntro);
    };
    // jouerIntro et passerIntro ne lisent que des refs et le DOM : pas de dépendance d'état.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intro]);

  return (
    <div ref={boiteRef} className={styles.boite}>
      <svg
        ref={svgRef}
        className={styles.watch}
        data-etat={etat}
        data-appui={appui || undefined}
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
          <g className={styles.poussoir}>
            <rect
              x="273.8"
              y="178.7"
              width="36"
              height="19"
              rx="9.5"
              transform="rotate(45 291.8 188.2)"
              fill="#8A6A2E"
            />
          </g>
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
          <g className={styles.poussoir}>
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
          </g>
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
          className={styles.filet}
          cx="190"
          cy="290"
          r="114"
          fill="none"
          stroke="#E8CF9A"
          strokeWidth="0.8"
        />

        {/* Cadran commun aux trois états. */}
        <circle className={styles.dial} cx="190" cy="290" r="112" />

        {/* Graduations majeures : teinte de l'état 1, recouverte en fondu par celle de
            l'état 2 (MONTRE.md § #l2). Celle de 6 h s'efface sous le sous-cadran. */}
        <g className={styles.ticksMajor1} strokeWidth="2.4">
          {MAJOR.map((deg) => (
            <line
              key={deg}
              className={deg === 180 ? styles.tick180 : undefined}
              {...tick(deg, 96, 104)}
            />
          ))}
        </g>
        <g className={`${styles.l2} ${styles.ticksMajor2}`} strokeWidth="2.4">
          {MAJOR.filter((deg) => deg !== 180).map((deg) => (
            <line key={deg} {...tick(deg, 96, 104)} />
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

        {/* Jour/nuit à 12 h, état 3, piloté par l'heure locale : le disque tourne en 24 h,
            moitié pleine en haut à midi (PLAN.md C4). Sous les aiguilles (S4). */}
        <g className={`${styles.l3} ${styles.daynight}`}>
          <circle className={styles.daynightFace} cx="190" cy="228" r="26" strokeWidth="1.2" />
          <g data-aiguille="jour-nuit" transform="rotate(0 190 228)" suppressHydrationWarning>
            <path
              className={styles.accentFill}
              d="M 190 202 A 26 26 0 0 1 190 254 Z"
              opacity="0.2"
            />
            <line
              className={styles.daynightLine}
              x1="190"
              y1="202"
              x2="190"
              y2="254"
              strokeWidth="1"
            />
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
        </g>

        {/* Aiguilles h/m : au centre à l'état 1, dans le sous-cadran ensuite. Au-dessus de tout
            le cadran (S1). Dessinées à 0°, orientées par rotate() (S6, S7). */}
        <g data-part="aiguilles" transform={MIGRATION} suppressHydrationWarning>
          <line
            className={styles.hourHand}
            data-aiguille="heures"
            x1="190"
            y1="290"
            x2="190"
            y2="235"
            strokeWidth="4.5"
            transform={`rotate(${POSE.heures} 190 290)`}
            suppressHydrationWarning
          />
          <line
            className={styles.minuteHand}
            data-aiguille="minutes"
            x1="190"
            y1="290"
            x2="190"
            y2="202"
            strokeWidth="2.8"
            transform={`rotate(${POSE.minutes} 190 290)`}
            suppressHydrationWarning
          />
          <circle className={styles.handsCap} cx="190" cy="290" r="6" />
        </g>

        {/* Trotteuse centrale et axe du chronographe, état 2, en laiton ; l'accent les
            recouvre en fondu à l'état 3. Aucun pixel d'accent avant (MONTRE.md). */}
        <g
          className={styles.l2}
          data-part="trotteuse"
          data-aiguille="secondes"
          transform={`rotate(${POSE.secondes} 190 290)`}
          suppressHydrationWarning
        >
          <line className={styles.seconds} x1="190" y1="310" x2="190" y2="190" strokeWidth="3" />
          <line
            className={styles.secondsAccent}
            data-couleur="accent"
            x1="190"
            y1="310"
            x2="190"
            y2="190"
            strokeWidth="3"
          />
        </g>
        <g className={styles.l2}>
          <circle className={styles.cap} cx="190" cy="290" r="7" />
          <circle className={styles.capAccent} cx="190" cy="290" r="7" />
        </g>

        {/* Zone de prise de la couronne (anneau, couronne, tige), plus large que le dessin.
            Pointeur fin seulement : au pouce, c'est trop imprécis (BRIEF.md), les onglets
            suffisent. Le clavier passe par le repère des époques : rien ici n'est
            focalisable. Glisser fait défiler jusqu'à l'époque voisine. */}
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

      {/* Le poussoir de 1 h 30 : un vrai bouton, posé sur le dessin. À la première visite, il
          lance l'intro ; ensuite, il arrête et relance le chrono (WCAG 2.2.2 : tout ce qui
          bouge plus de 5 s doit pouvoir s'arrêter). */}
      <button
        type="button"
        className={styles.chrono}
        data-poussoir=""
        aria-label={intro === 'vue' ? LIBELLE_CHRONO : LIBELLE_INTRO}
        aria-pressed={intro === 'vue' ? !marche : undefined}
        onClick={() => (intro === 'vue' ? basculerChrono() : void jouerIntro())}
        suppressHydrationWarning
      />
    </div>
  );
}
