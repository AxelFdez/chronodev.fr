# PLAN — chronodev.fr (session 1 : audit et découpage)

Statut : audit et plan, aucune ligne de code. Ce document **ne décide rien**. Les points
marqués **→ Axel** attendent sa réponse ; ne les tranche pas en code. Les décisions de
`CLAUDE.md` priment sur ce fichier.

**Décisions d'Axel appliquées dans les docs (26/10)** : pas de three.js ni de WebGL, intro
1 → 2 seulement, barre du haut unique, polices via `next/font`. Elles règlent C1, C3, C6
et C10, et une partie de C2.

Méthode : la géométrie du SVG est calculée, pas estimée ; le rendu est mesuré dans Chromium
(Playwright) avec GSAP 3.15. WebKit et Gecko n'ont **pas** été testés : seul Chromium est
disponible dans l'environnement de développement. Le test sur iPhone n'est donc pas optionnel.

---

## 1. Contradictions et ambiguïtés entre les fichiers

Plusieurs viennent de la v0 du brief (antérieure à Claude Design) : la v1 a changé le
concept mais a gardé des phrases écrites pour l'ancien.

### C1 — Trois intros différentes · ✓ réglé (pas de three.js, intro 1 → 2)
- `BRIEF.md` § Concept : « le boîtier s'ouvre, la caméra plonge dans le mécanisme ». Phrase
  héritée de la v0, pensée pour du WebGL.
- `MONTRE.md` § Budget : l'intro est **l'assemblage des calques** (1 → 2, ou complet).
- `montre.svg` : ni couvercle ni mécanisme. Il n'y a rien à ouvrir et rien où plonger.
- Plan de session : SVG + GSAP, **sans three.js**.

Proposition : l'intro = appui sur le poussoir, puis assemblage 1 → 2 en SVG (option 1).
Retirer « le boîtier s'ouvre, la caméra plonge » du brief.

### C2 — Molette par défaut sur « Après » contre récit de construction → Axel
L'intro 1 → 2 est décidée. Restent ouverts : la justification de l'option 1, et le moment
du passage 2 → 3.
- Avec le défaut sur Après, le visiteur arrive sur la montre **complète** (état 3, cyan
  présent). Son premier geste sur la molette l'amène à Pendant : la montre **perd** son cyan
  et un calque. Hors intro, la construction ne se voit qu'à l'envers.
- `MONTRE.md`, option 1 : « le cyan devient la récompense du premier tour de molette ».
  C'est faux avec le défaut sur Après : le cyan est déjà là avant tout geste.
- L'option 1 finit l'intro sur l'état 2, alors que le hero affiche l'état 3. Le passage
  2 → 3 n'a de place nulle part.

Version forte de l'état actuel : la molette remonte le temps. Revenir à Avant démonte la
montre, ce qui est cohérent avec un retour en arrière, et la reconstruction devient la
récompense du retour à Après.

Proposition : assumer cette lecture et réécrire la justification de l'option 1. L'intro
s'arrête sur l'état 2 ; la recoloration 2 → 3 (0,8 s) se joue **après** l'affichage du hero,
quand le contenu est déjà lisible. Elle ne compte donc pas dans les 2 s.

### C3 — « la barre du haut des trois heros » · ✓ réglé (barre unique)
La table des décisions de `CLAUDE.md` (ligne Toggle) parle de trois heros ; le hero est
double. C'est un reste des artboards. Proposition : « dans la barre du haut, commune à
l'intro et au hero ».

### C4 — L'indicateur jour/nuit viole la règle des compteurs → Axel
- `MONTRE.md` le dit « réel, piloté par le toggle de thème », et pose la règle « un
  compteur = une donnée réelle **et non redondante** ».
- Le thème se voit sur toute la page. Un indicateur qui le répète est redondant, selon
  l'argument même qui a fait retirer le compteur d'époque.
- Le sous-cadran de 6 h affiche 12 heures : il ne distingue pas 3 h de 15 h. Un jour/nuit
  piloté par **l'heure locale** porte exactement la donnée qui manque, et c'est sa fonction
  sur une vraie montre.

Proposition : jour/nuit = heure locale (jour de 6 h à 18 h). Le thème reste sur le poussoir.

### C5 — « Temps réel » contre le SVG et le fallback → Axel (touche `MONTRE.md`)
- La trotteuse en CSS démarre au chargement de la page et n'est pas synchronisée sur
  l'horloge. Elle est dessinée à 18° : synchronisée, elle afficherait 3 s d'avance.
- Les aiguilles h/m sont dessinées à une heure impossible : heures à 35,0° (1 h 10),
  minutes à 150° (25 min). À 1 h 25, l'aiguille des heures serait à 42,5°.
- Sous reduced-motion, « trotteuse à l'arrêt » donne une seconde figée, donc fausse.
- **WCAG 2.2.2 (niveau A)** : un contenu qui bouge plus de 5 s à côté d'autre contenu doit
  pouvoir être mis en pause, **même sans** préférence reduced-motion. Ni axe ni Lighthouse
  ne le détectent.

Proposition :
- Toutes les aiguilles sont dessinées à 0°. Un script de démarrage (pas GSAP, pas de boucle)
  pose des `animation-delay` négatifs sur trois animations CSS : 60 s `steps(60)`, 3 600 s
  et 43 200 s.
- Sous reduced-motion : h/m mises à jour par un minuteur de 60 s sans transition (un saut,
  pas une animation) ; trotteuse garée à 0. Une aiguille de chrono à l'arrêt repose à 0 :
  c'est un état vrai, pas un mensonge.
- Le poussoir du SVG devient un vrai `<button>` « Arrêter / relancer le chrono ». C'est le
  mécanisme de pause exigé par la 2.2.2, et il appartient à l'objet.

### C6 — WebGL, un fantôme de la v0 · ✓ réglé (pas de three.js)
Appliqué : les fallbacks visent « sans JavaScript ». La vérification 3 devient « JavaScript
désactivé », et l'absence de contexte WebGL reste testée en non-régression.
La v0 prévoyait « variables CSS + shader de transition ». La v1 a retiré le shader du
concept mais a gardé :
- « WebGL en couche d'enrichissement » (`BRIEF.md`, `CLAUDE.md`) ;
- « pas de shader » (`DESIGN.md`, `CLAUDE.md`) ;
- « Fallback sans WebGL » (`MONTRE.md`) ;
- la vérification n° 3 « WebGL désactivé ».

En SVG + GSAP, rien n'utilise WebGL. Cette vérification réussit d'office et ne protège rien.

Proposition : remplacer la vérification 3 par « **JavaScript désactivé** : la page reste
complète et lisible ». C'est le cas qu'un export statique doit tenir, et il couvre tout ce
que couvrait WebGL. Garder la règle « pas de WebGL sans décision ».

### C7 — « Compteur de veille » (plan des tranches, v0) contre `MONTRE.md`
`MONTRE.md` : le compteur de veille a été retiré et « ne doit pas revenir ». Le *module*
« Dernière veille » (une date écrite) reste. La tranche 6 s'appelle donc **Module Dernière
veille** (appliqué dans ce plan). Sinon, une session qui lit les deux fichiers hésitera, ou
remettra une aiguille.

### C8 — Jusqu'où va une époque ? → Axel
- `BRIEF.md` : « L'esthétique entière change d'une époque à l'autre. »
- Si « entière » veut dire toute la page, passer à Avant recouvre aussi le hero et la barre
  du haut : grain de 4,5 % sous le CTA. Et puisque le contact est « dans Après »,
  disparaît-il en Avant et en Pendant ?

Proposition : l'époque gouverne le contenu de la section des époques, l'état de la montre
et le grain (calque pleine page). Le hero (accroche, sous-titre, CTA, contact) et la barre du
haut ne changent pas. Le contact est toujours dans le hero, et détaillé dans Après.

### C9 — La couronne est à la fois menu et molette → Axel
- `BRIEF.md` : « la couronne devient une molette de temps (draggable) » **et** « couronne =
  menu ». `CLAUDE.md` : « entrée en mots dans le menu de la couronne ».
- Un même contrôle avec deux gestes crée trois ambiguïtés. Au pointeur : un glisser court
  vaut-il un clic ? Au clavier : les flèches font tourner un curseur, Entrée ouvre un menu.
  Au lecteur d'écran : est-ce un curseur ou un bouton de menu ?

Proposition : séparer les deux rôles. La couronne du SVG est la molette. Le menu est un
vrai `<button aria-expanded>` dans la barre du haut.

### C10 — Google Fonts et RGPD · ✓ réglé (`next/font`, appliqué dans `DESIGN.md`)
- `DESIGN.md` : « un seul `<link>` `fonts.googleapis.com` ».
- Charger les polices depuis les serveurs de Google transmet l'IP du visiteur sans
  consentement. Le LG München I l'a sanctionné le 20 janvier 2022 (3 O 17493/20). Axel
  présente « sécurité et RGPD » comme la part qui reste humaine.
- `next/font/google` télécharge les fichiers au build et les sert depuis le site : mêmes
  polices, aucune requête tierce, et des fallbacks aux métriques ajustées générés
  automatiquement.

Proposition : passer par `next/font`.

### C11 — Le module veille publie du texte de LLM non relu → Axel
- `BRIEF.md` : « flux filtrés + résumé LLM », publiés automatiquement.
- Le positionnement dit : « l'IA accélère, Axel décide et répond du résultat ».
- Publier sous son nom des résumés que personne n'a relus est l'exact contre-exemple de son
  argumentaire, sur son propre site. Un seul résumé halluciné suffit à le démontrer.

Proposition : une étape de validation dans n8n (approbation par mail ou Telegram) avant
publication du JSON. Côté site, le résumé est du texte non fiable : il est rendu en texte,
jamais en `innerHTML`.

### Points mineurs
- **Second poussoir** → Axel. Le dessin n'a qu'un poussoir (vers 1 h 30). Le « second
  poussoir » de thème n'existe que comme capsule dans la barre du haut. C'est acceptable,
  mais il faut le dire, ou ajouter un poussoir symétrique vers 10 h 30. Le rôle « retour
  accueil » de la v0 a disparu sans être remplacé.
- **Grain** → Axel. Un `repeating-linear-gradient` horizontal produit des lignes de balayage
  qui évoquent un écran, pas un grain qui évoque une matière ou une photo. Pour l'époque 1,
  un bruit `feTurbulence` rasterisé une fois au build serait plus fidèle à l'intention.
- **Mentions légales** : absentes de tous les docs, alors qu'elles sont obligatoires pour un
  site professionnel (LCEN, art. 6 III). La page est prévue en tranche 2, avec des
  placeholders `[SIRET]`, `[HEBERGEUR]`, etc.
- **Contrastes du thème clair sur `--surface` #FFFFFF**, absents de `DESIGN.md`. Mesurés
  ici : `--text-muted` 6.05:1, `--accent` 5.15:1, `--brass` 6.35:1. Les 16 ratios publiés
  dans `DESIGN.md` ont été remesurés et sont exacts.

---

## 2. Défauts de `assets/montre.svg` (mesurés)

| # | Défaut | Mesure | Correction |
|---|---|---|---|
| S1 | **Ordre des calques.** `#hands-central` est dans `#l1`, donc **sous** le cadran opaque de `#l2` (r 112) et sous `#subdial-hours`. Pendant le passage 1 → 2, les aiguilles disparaissent à mesure que `#l2` apparaît. Le temps fort de toute l'animation est invisible. | Après la migration, l'élément au premier plan en (190, 352) est le `circle` de `#subdial-hours`. Le rendu montre un sous-cadran vide aux états 2 et 3. | Restructurer en calques partagés, du fond vers le dessus : boîtier l1 → matière l2 → cadran commun → graduations (majeures communes, fines l2) → sous-cadran l2 → jour/nuit l3 → aiguilles h/m → trotteuse → axe. Les époques ne pilotent que l'opacité des parties l2 et l3. |
| S1' | Conséquence : le **fallback statique** de `MONTRE.md` (`#l2` et `#l3` à opacité 1) a lui aussi un sous-cadran vide. | Même mesure. | Corriger S1 dès la tranche 2, pas en tranche 4. |
| S2 | **Tweens sur éléments masqués.** `#ticks-major` (couleur du trait) et `#tick-180` (opacité) sont dans `#l1`, sous le cadran opaque de `#l2`. `#l2` redessine d'ailleurs déjà les graduations majeures en `#454C57`, sans celle de 180°. Deux modèles se mélangent : « l2 repeint tout » et « l1 reste et se transforme ». | Au premier plan en (190, 390) et en (290, 290) : des éléments de `#l2`. | Graduations majeures dessinées une seule fois dans le calque commun. Le tween de couleur devient alors réel. |
| S3 | **`transformOrigin` de GSAP.** Sur un élément SVG, GSAP calcule `transformOrigin` par rapport à la boîte englobante de l'élément. `'190px 290px'` place l'origine vers (374, 535) en coordonnées absolues. | Avec le code de `MONTRE.md`, le pivot migré arrive en **(309.6, 511.2)**, hors du `viewBox` (y max 453). | `svgOrigin: '190 290'`. Pivot mesuré en (190, 352). |
| S4 | **Le jour/nuit masque la trotteuse.** `#daynight` (l3, disque opaque de r 26) est dessiné après `#hand-seconds` (l2). | La trotteuse passe dessous de 56 s à 4 s, soit 9 s par minute. À 0 s, elle est cachée de r 36 à r 88, sur une longueur de 100. | Réglé par l'ordre de S1. |
| S5 | **Le reflet spéculaire sort de la silhouette.** Le chemin `M 62 267 A 124 124 0 0 1 167 162` a ses extrémités à r 130,05 alors que le rayon de l'arc vaut 124. | Centre réel de l'arc (184.7, 284.7) ; sommet à r 131,5 ; bord du trait à r 133. Il dépasse donc de 3 px du boîtier (r 130), en haut à gauche, sur fond noir. | Arc concentrique : `M 68 268.1 A 124 124 0 0 1 168.1 168`. |
| S6 | Trotteuse dessinée à 18° : incompatible avec le temps réel (C5). | 18,0°, longueur 100, queue 20. | La dessiner à 0°. |
| S7 | Aiguilles h/m figées sur une heure impossible (C5). | Heures 35,0°, minutes 150°. | Les dessiner à 0°, les piloter par l'heure. Sans JS, une pose cohérente. |
| S8 | **Couleurs en dur.** Toutes les couleurs sont littérales, y compris le cyan de `#daynight` et les tweens vers `'#3FE0F0'`. Le thème clair décrit dans `MONTRE.md` (cadran #FFF, graduations #B8B2A4, matière #C9A05A, accent brique, ombre à la place du reflet) est impossible en l'état. | — | `fill` et `stroke` via des `var(--w-*)` portées par des classes. La recoloration 2 → 3 anime une variable ou bascule une classe, jamais un littéral. |
| S9 | **Rôle ARIA.** La racine porte `role="img"` et un `aria-label`, alors que dans le hero la montre est décorative. La couronne et le poussoir ne peuvent pas être des éléments SVG cliquables (règle « vrais éléments »). | À 300 px de large, le poussoir (36×19 unités) mesure environ 28×15 px, sous les 44 px requis. | `aria-hidden="true"` sur le SVG. Des `<button>` superposés, avec une zone de clic d'au moins 44 px. |
| S10 | `viewBox` avec min-y = 41 et `transform-origin` CSS en px. | Pivot correct dans Chromium (mesuré en 190, 290) ; non vérifié dans WebKit ni Gecko. | Le vérifier sur iPhone. Sinon, passer toutes les rotations par `svgOrigin` de GSAP, ou dessiner les aiguilles dans un `<g>` translaté sur le pivot. |
| S11 | **Ids globaux.** Une fois le SVG inline, `#l1`, `#l2`, `#m-brass`, etc. entrent dans l'espace d'ids de la page. Une seconde copie (intro + hero) les duplique, et `url(#m-brass)` peut viser la copie masquée. | — | **Une seule instance**, déplacée de l'intro vers le hero (GSAP Flip), avec des ids préfixés `w-`. |

Les dégagements des graduations ont été vérifiés : 44 fines + 11 majeures, à 8,4 px du
sous-cadran et 8,0 px du jour/nuit. Les valeurs de `MONTRE.md` § Repère sont justes.

---

## 3. Architecture

**Choix imposé** : Next.js (App Router), `output: 'export'`, GSAP, SVG, sans three.js.

- **Rendu.** `app/page.tsx` est un composant serveur : tout le texte est dans le HTML au
  build. Îlots client : `ThemeToggle`, `EpochControl`, `Watch`, `Intro`, `Veille`. Options :
  `images.unoptimized`, `trailingSlash: true`. Pages : `/` et `/mentions-legales/`.
- **Contenu.** `content/site.ts`, typé, avec les placeholders `[EMAIL]`, `[TELEPHONE]`,
  `[PRIX]`, `[OFFRE_1_NOM]`, etc. Le script `check:placeholders` liste ceux qui restent, et
  fait échouer le build de production (`PRODUCTION=1`).
- **Premier paint.** Un script inline, premier enfant de `<head>`, lit `chronodev-theme` et
  `chronodev-intro-vue` dans un `try/catch`. Il pose `data-theme` et `data-intro` sur
  `<html>`, avec `suppressHydrationWarning`. L'intro n'existe que si ce script a tourné :
  sans JS, on arrive directement sur le hero. Il enregistre aussi un éventuel clic sur le
  poussoir avant l'hydratation (« cliquable au premier frame »).
- **Styles.** `styles/tokens.css` reprend les tokens de `DESIGN.md` mot pour mot ; un CSS
  Module par composant. Pas de Tailwind, pour ne pas ajouter un second système de tokens.
- **Polices.** `next/font/google`, auto-hébergées (voir `DESIGN.md` § Typographie).
- **Époque : une seule source de vérité.** `<fieldset>` + trois `<input type="radio"
  name="epoque">` + `<label>`, Après coché par défaut. Grâce à `:has()`, la section change
  de panneau **sans JS**. Sur desktop, la couronne est un habillage piloté par GSAP
  Draggable (`type: 'rotation'`, aimanté sur trois angles) qui coche le radio ; le clavier
  passe par les flèches natives du groupe radio. Sur mobile, les mêmes radios s'affichent en
  trois onglets d'au moins 44 px, espacés d'au moins 8 px. Un seul contrôle, deux
  habillages, aucun `role` ajouté.
- **Montre.** `components/watch/WatchSvg.tsx` est le SVG corrigé porté en JSX : instance
  unique, ids préfixés, couleurs en variables par thème. Après la tranche 2, le TSX fait foi ;
  `assets/montre.svg` reste la référence de dessin, et `MONTRE.md` doit le dire.
- **Motion.** `lib/motion.ts` contient une seule timeline maîtresse, avec les labels `avant`,
  `pendant` et `apres`. Changer d'époque lance `tl.tweenTo(label)` (1,2 à 2 s).
  `gsap.matchMedia()` gère reduced-motion : saut direct au label et fondu CSS de 200 ms.
  `@gsap/react` (`useGSAP`) assure le nettoyage. Depuis la 3.13, tous les plugins GSAP sont
  gratuits, usage commercial compris (Draggable, Flip).
- **Horloge.** `lib/clock.ts` pose les délais négatifs une seule fois et resynchronise sur
  `visibilitychange`. Aucune boucle `requestAnimationFrame`.
- **Intro.** Une couche par-dessus le hero. Le poussoir est un `<button>` ; « Passer » est un
  lien `<a href="#hero">`, qui fonctionne avant l'hydratation ; Échap ferme aussi. Une
  assertion de dev garantit `tl.duration() <= 2`. À la fin, le drapeau est posé et la montre
  passe dans le hero par Flip. Sur mobile, version allégée en fondu.
- **Module Dernière veille.** n8n publie `/veille.json` sur un volume servi par nginx. Le
  client le récupère ; le module est masqué par défaut et ne s'affiche que si l'entrée a
  moins de `[SEUIL_JOURS]`. Il échoue fermé (rien ne s'affiche en cas de doute). Il ne
  bloque pas le rendu et ne provoque pas de décalage de mise en page (emplacement réservé ou
  sous la ligne de flottaison).
- **Déploiement.** Un Dockerfile en deux étapes (`node:22` pour le build, `nginx:alpine`
  pour servir `out/`) et un `nginx.conf` :
  - cache `immutable` sur `/_next/static`, cache court sur le HTML ;
  - en-têtes de sécurité, avec une CSP qui autorise le script inline par son hash
    `sha256-…` calculé au build ;
  - pour l'aperçu : basic auth Traefik via Dokploy et `X-Robots-Tag: noindex`.
- **Outillage.** TypeScript strict, ESLint (config Next), Prettier, Playwright,
  `@axe-core/playwright`, `@lhci/cli`.

---

## 4. Tranches verticales

La correction des calques (S1, S4, S5, S8, S9, S11) passe de la tranche 4 à la **tranche 2** :
l'état final statique est cassé en l'état. La tranche 4 garde l'animation et le temps réel.

### T1 — Socle · ✓ livrée
Contenu :
- Next en export statique, tokens, polices.
- Script de `<head>` (thème + intro), barre du haut avec la capsule de thème 54×46
  fonctionnelle.
- Dockerfile, `nginx.conf`, squelette de `npm run verify`.

Vérification de fin :
- Le HTML servi contient le contenu ; le script de thème est inline et bloquant dans
  `<head>`. React 19 place les feuilles de style avant lui : voir `DESIGN.md` § Bascule
  de thème.
- Thème clair en stockage, CSS et JS retardés de 800 ms : au premier frame, le fond est
  déjà clair et React n'est pas chargé.
- Stockage qui lève une exception (navigation privée) : la page s'affiche en sombre, sans
  erreur.
- Un script recalcule les ratios de contraste depuis `tokens.css` et échoue sous 4.5:1.
- L'image Docker se construit et sert `/` (HTTP 200).

### T2 — Hero de conversion et montre statique corrigée
Contenu :
- Accroche, sous-titre (piste provisoire, marquée comme telle), CTA vers `#contact`, bloc
  contact avec `[EMAIL]` et `[TELEPHONE]`.
- Montre à l'état final : SVG restructuré, en variables, `aria-hidden`, instance unique.
- Page de mentions légales avec placeholders.
- Mise en ligne sur Dokploy derrière basic auth.

Vérification de fin :
- **Voir la source** contient l'accroche, le sous-titre et le contact.
- Les captures JS coupé et JS actif sont identiques (horloge mise à part).
- À 390 px, aucun débordement (`scrollWidth === clientWidth`).
- axe : 0 violation. Lighthouse a11y : 100. L'élément LCP est le `h1`, pas le SVG.
- Tests de non-régression SVG :
  - en (190, 352), l'élément au premier plan appartient aux aiguilles ;
  - à 0 s, en (190, 215), c'est la trotteuse ;
  - le reflet reste dans r ≤ 130.
- Revue des captures : la montre est latérale et moins contrastée que l'accroche.
- Test sur un vrai téléphone via l'URL d'aperçu.

### T3 — Molette sans animation
Contenu :
- Groupe radio Avant / Pendant / Après, Après par défaut.
- Contenu HTML complet des trois époques, tiré de `BRIEF.md`. Offres en placeholders.
  Section preuve explicitement vide, avec des placeholders, sans rien inventer.
- Couronne glissable sur desktop, onglets sur mobile.
- Grain par époque **et** par thème.
- La montre change d'état instantanément.

Vérification de fin :
- Voir la source contient le texte des trois époques et des offres.
- Clavier : Tab entre dans le groupe, les flèches changent d'époque, le focus est visible.
- À 390 px, onglets d'au moins 44 px, espacés d'au moins 8 px (boîtes mesurées dans
  Playwright).
- Sans JS, les radios changent bien de panneau.
- axe sur 3 époques × 2 thèmes.
- Le grain se voit en thème clair (écart mesuré entre captures avec et sans grain).

### T4 — Montre animée
Contenu :
- Timeline maîtresse, migration avec `svgOrigin`, recoloration 2 → 3 par variable.
- Temps réel par délais négatifs, branche reduced-motion.
- Pause 2.2.2 et source du jour/nuit selon les réponses à C4 et C5.

Vérification de fin :
- Durées dans les plages de `DESIGN.md` (1,2 à 2 s).
- Pivot mesuré en (190, 352) au label `pendant`.
- Heure figée par `page.clock.install()` : les angles correspondent à 1 pas près, et les
  captures sont déterministes.
- Sous reduced-motion : `document.getAnimations()` est vide et aucun tween GSAP ne tourne.
- Migration vérifiée sur iPhone (WebKit).

### T5 — Intro
Contenu : assemblage 1 → 2 seulement, une seule fois, sautable (bouton, lien, Échap), 2 s
au plus, poussoir actif au premier frame, passage de la montre dans le hero par Flip. Le
passage 2 → 3 attend la réponse à C2.

Vérification de fin :
- Deuxième visite : pas d'intro.
- Entre le clic sur le poussoir et le hero visible : 2 000 ms au plus (marques
  `performance`).
- Stockage bloqué : l'intro n'est pas jouée (décidé en T1, voir `DESIGN.md`), et rien ne
  casse.
- Sous reduced-motion : fondu court ou intro sautée.
- LCP en première visite comparé à la référence de T4 (`lhci`).

### T6 — Module Dernière veille
Contenu : schéma du JSON (date ISO, titre, résumé, URL de la source), récupération côté
client, échec fermé, seuil `[SEUIL_JOURS]`. Le workflow n8n vit hors du repo et est
documenté.

Vérification de fin :
- Jeux d'essai frais / périmé / malformé / 404 / lent : le module n'est visible que pour
  « frais ».
- CLS sous 0,1.
- Un résumé contenant du HTML s'affiche en texte brut.

### T7 — Passe finale
- Les six vérifications de `CLAUDE.md`.
- iPhone (WebKit) et Android (Chrome) réels.
- Lighthouse sur la production.
- Retrait de la basic auth et du `noindex` **seulement** une fois les placeholders
  remplis : la garde `PRODUCTION=1` l'impose.

---

## 5. Boucle de vérification (toutes les tranches)

`npm run verify` enchaîne :
1. Build, puis service statique de `out/`.
2. Captures Playwright sur la matrice :
   - largeur 390×844 et 1440×900 ;
   - thème sombre et clair ;
   - motion normal et `reduce` ;
   - **JS actif et JS coupé**.
   Les captures vont dans `artifacts/screens/` (ignoré par git) et Claude les **lit** avant
   d'annoncer « terminé ».
3. axe, puis Lighthouse CI (profil mobile) avec des budgets.
4. Vérifications de source (recherche dans `out/index.html`) et rapport des placeholders.

Limite connue : seul Chromium est disponible ici. WebKit se teste sur le téléphone, via
l'aperçu ; Gecko n'est pas couvert.
