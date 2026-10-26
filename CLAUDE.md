# chronodev.fr — contrat de projet

Site vitrine d'Axel, développeur indépendant à Nice. Objectif : **recruter** des demandes
de contact auprès de PME, clients particuliers et startups. La dimension « remarquer »
(Awwwards, portfolio) est un bonus, jamais une raison de dégrader la conversion.

Lis `docs/DESIGN.md` (tokens, typo, motion), `docs/MONTRE.md` (l'objet central et son animation)
et `docs/BRIEF.md` (contenu et positionnement) avant d'écrire du code.
`docs/PLAN.md` contient l'audit et le découpage en tranches ; ses propositions marquées
« → Axel » ne sont pas des décisions.

## Règles non négociables

**Contenu**
- Aucun chiffre inventé. Toute statistique affichée doit être réelle et vérifiable.
  Les valeurs manquantes restent entre crochets — `[PRIX]`, `[EMAIL]` — jusqu'à ce
  qu'Axel les fournisse. Ne les remplis jamais par des exemples plausibles.
- Aucun élément de la franchise *Retour vers le futur* : pas de voiture, pas de tour
  de l'horloge, pas de « 88 », pas de réplique, pas de typo du titre.
- Aucune reproduction d'un cadran ou d'une interface Apple Watch. On garde les
  principes (lecture d'un coup d'œil, un accent, modules compacts), pas les éléments.
- Pas d'assets 3D de provenance incertaine.

**Architecture**
- Le contenu réel (accroche, offres, preuves, contact) est en **HTML indexable**.
  L'animation (SVG + GSAP) est une couche d'enrichissement, jamais le support du contenu.
  Conséquence : rendu statique ou serveur, pas une SPA rendue côté client.
- Fallback propre sans JavaScript et sous `prefers-reduced-motion` : pas de parallaxe,
  transitions en fondu court. Le site reste entièrement utilisable.
- Aucune animation ne bloque l'accès au contact ou au contenu.
- L'intro est sautable et ne se rejoue pas à la deuxième visite.

**Accessibilité — vérifiée, pas supposée**
- Tous les textes à 4.5:1 minimum. Les valeurs mesurées sont dans `docs/DESIGN.md` ;
  ne les recalcule pas à l'estime, et ne substitue pas une teinte sans la remesurer.
- Vrais éléments : `<button>`, `<a href>`, `<input>` + `<label>`. Jamais `role` ou
  `onClick` sur un `div`.
- `aria-label` sur tout bouton sans libellé visible (le poussoir de thème).
- Cibles tactiles ≥ 44 px, avec au moins 8 px entre deux cibles adjacentes.
- Tout SVG décoratif porte `aria-hidden="true"` ; tout SVG porteur de sens porte
  `role="img"` et un `aria-label`.

## Décisions prises — ne pas rouvrir sans l'accord d'Axel

| Sujet | Décision |
|---|---|
| Hero | **Hero double.** Intro à la première visite, hero de conversion ensuite. |
| Intro | Joue l'assemblage **1 → 2 seulement**, 2 s au plus entre l'appui sur le poussoir et l'affichage du hero. Le passage 2 → 3 (0,8 s) se joue juste après l'apparition du hero. Voir `docs/MONTRE.md` § Budget. |
| Rendu | **Pas de three.js, pas de WebGL.** La montre et l'intro sont en SVG + GSAP. |
| Époques | Le projet **du client** : avant / pendant / après. Pas le CV d'Axel. |
| Molette | Position par défaut au chargement : **Après**. La **couronne de la montre** est la molette (glisser, desktop) ; le groupe radio Avant / Pendant / Après en est le contrôle clavier et, sur mobile, les onglets. |
| Menu | Un vrai bouton **« Menu »** dans la barre du haut, distinct de la couronne. |
| Portée d'une époque | L'époque change la section des époques, l'état de la montre et le grain (pleine page). Le hero, la barre du haut et le contact ne changent pas. |
| Thème | **Sombre par défaut**, `prefers-color-scheme` ignoré au premier chargement. Clair accessible par toggle. |
| Accent sombre | Cyan `#3FE0F0`. |
| Accent clair | Brique `#B84A3B`, accent unique du thème clair. |
| Toggle | Second poussoir du chronographe, en capsule 54×46, dans la **barre du haut, unique**, commune à l'intro et au hero. Doublé d'une entrée en mots dans le menu. |
| Typographie | Space Grotesk + JetBrains Mono. Deux familles, pas de serif. |
| Montre | Régulateur sur boîtier travaillé. Un seul sous-cadran, à 6 h. Secondes au centre. |
| Construction | La montre gagne des calques d'une époque à l'autre. Voir `docs/MONTRE.md`. |
| Heure | Aiguilles à l'heure réelle du visiteur ; jour/nuit piloté par l'heure locale (pas par le thème). |
| Chrono | Le poussoir de la montre est un vrai bouton « Arrêter le chrono » (pause, WCAG 2.2.2). Sous `prefers-reduced-motion`, chrono arrêté, trotteuse à 0. |
| Veille | Résumés LLM **validés par Axel dans n8n** avant publication. Module masqué au-delà de **21 jours**, et au moindre doute (échec fermé). Jamais présenté comme une preuve. Voir `docs/VEILLE.md`. |

## Points encore ouverts — demande, n'invente pas

- Les offres réelles affichées dans « Après » : noms, contenus, prix.
- L'email et le téléphone de contact.
- Les valeurs des mentions légales : nom, adresse, SIRET, hébergeur, durée de
  conservation des journaux (`content/site.ts`).
- Le libellé du CTA (« Parlons de votre projet ») et la ligne « pour qui », proposés en
  tranche 2.
- **La preuve client.** Le site n'a aujourd'hui aucun témoignage, aucun projet livré,
  aucun chiffre avant/après. Le module « Dernière veille » prouve qu'Axel suit
  l'actualité, pas qu'il livre. C'est le manque le plus coûteux du projet.
- Le sous-titre définitif (la piste actuelle est dans `docs/BRIEF.md`).

## Commandes

- `npm run dev` : serveur de développement.
- `npm run build` : export statique dans `out/`, puis calcul de la CSP (`build/csp/`).
- `npm run serve` : sert `out/` comme nginx en production (en-têtes, CSP, gzip).
- `npm run verify` : lint, build, types, contrastes, valeurs manquantes, tests Playwright
  (dont axe), Lighthouse mobile (médiane de 5 passages). Les captures vont dans `artifacts/screens/` : les **lire**
  avant de déclarer une tâche terminée. Le test sur un vrai téléphone reste manuel.
- Déploiement : `docs/DEPLOIEMENT.md`.

## Vérifications avant de considérer une tâche terminée

1. Contraste : chaque paire texte/fond mesurée, pas estimée.
2. `prefers-reduced-motion: reduce` : aucune animation en boucle ne subsiste.
3. JavaScript désactivé : la page reste complète et lisible. Aucun contexte WebGL n'est
   créé (non-régression).
4. Largeur 390 px : aucun débordement horizontal, aucun titre qui casse mal.
5. Thème : le choix persiste et s'applique **avant le premier paint** (pas de flash).
6. Le HTML servi contient le texte des offres et du contact (vérifier en « voir la source »,
   pas dans l'inspecteur).
