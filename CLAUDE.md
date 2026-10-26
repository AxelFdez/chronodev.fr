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
- `aria-label` sur tout bouton sans libellé visible (le poussoir de thème, la couronne).
- Cibles tactiles ≥ 44 px, avec au moins 8 px entre deux cibles adjacentes.
- Tout SVG décoratif porte `aria-hidden="true"` ; tout SVG porteur de sens porte
  `role="img"` et un `aria-label`.

## Décisions prises — ne pas rouvrir sans l'accord d'Axel

| Sujet | Décision |
|---|---|
| Hero | **Hero double.** Intro à la première visite, hero de conversion ensuite. |
| Intro | Joue l'assemblage **1 → 2 seulement**, 2 s au plus. Voir `docs/MONTRE.md` § Budget. |
| Rendu | **Pas de three.js, pas de WebGL.** La montre et l'intro sont en SVG + GSAP. |
| Époques | Le projet **du client** : avant / pendant / après. Pas le CV d'Axel. |
| Molette | Position par défaut au chargement : **Après**. |
| Thème | **Sombre par défaut**, `prefers-color-scheme` ignoré au premier chargement. Clair accessible par toggle. |
| Accent sombre | Cyan `#3FE0F0`. |
| Accent clair | Brique `#B84A3B`, accent unique du thème clair. |
| Toggle | Second poussoir du chronographe, en capsule 54×46, dans la **barre du haut, unique**, commune à l'intro et au hero. Doublé d'une entrée en mots dans le menu de la couronne. |
| Typographie | Space Grotesk + JetBrains Mono. Deux familles, pas de serif. |
| Montre | Régulateur sur boîtier travaillé. Un seul sous-cadran, à 6 h. Secondes au centre. |
| Construction | La montre gagne des calques d'une époque à l'autre. Voir `docs/MONTRE.md`. |

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
- Le passage de l'état 2 (fin de l'intro) à l'état 3 (hero, molette sur Après), et la
  justification de l'intro 1 → 2 (voir `docs/MONTRE.md` § Budget, `docs/PLAN.md` C2).

## Commandes

- `npm run dev` : serveur de développement.
- `npm run build` : export statique dans `out/`, puis calcul de la CSP (`build/csp/`).
- `npm run serve` : sert `out/` comme nginx en production (en-têtes, CSP, gzip).
- `npm run verify` : lint, build, types, contrastes, valeurs manquantes, tests Playwright
  (dont axe), Lighthouse mobile. Les captures vont dans `artifacts/screens/` : les **lire**
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
