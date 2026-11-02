# MISE EN LIGNE — chronodev.fr

État au 26/10/2026, après la tranche 7. La partie vérifiable sans appareil ni serveur est
faite et passe. Ce qui suit est **à faire par Axel**, dans cet ordre.

## 1. Audit : les six vérifications de `CLAUDE.md`

Toutes sont automatisées dans `npm run verify`. Elles passent aussi contre l'**image Docker
de production** (nginx), pas seulement contre le serveur local.

| # | Vérification | Comment c'est prouvé |
|---|---|---|
| 1 | Contrastes ≥ 4.5:1, mesurés | `scripts/contrast.mjs` (35 paires, dont le texte sur le grain le plus dense) ; axe sur toutes les pages, les trois époques, l'intro, le menu ouvert et la veille, dans les deux thèmes. |
| 2 | Mouvement réduit : aucune boucle | Un parcours complet (époques, menu, thème, chrono) ne laisse ni boucle, ni mouvement, ni animation de plus de 250 ms. Pas d'intro, chrono au repos, GSAP jamais chargé. |
| 3 | Sans JavaScript : page complète | Accueil, époques (les trois sections, toutes visibles), menu, mentions légales et 404. Aucun contexte WebGL créé. |
| 4 | 390 px : ni débordement ni titre mal coupé | Contrôlé à 390 et à 360 px, sur les trois époques, les mentions, la 404 et l'intro. Un test vérifie qu'aucun mot de titre n'est coupé sur deux lignes. |
| 5 | Thème avant le premier paint | Au premier frame, CSS et JS retardés de 800 ms, le thème clair est déjà là. Il se conserve d'une page à l'autre, et un stockage bloqué ne casse rien. |
| 6 | Offres et contact dans le HTML servi | Vérifié sur le HTML brut renvoyé par le serveur, pas dans l'inspecteur. |

Vérifié en plus :
- **CSP stricte**, sans `unsafe-inline` ni `unsafe-eval` ; en-têtes de sécurité présents.
- **Aucune carte de sources** (`.map`) publiée.
- **`robots.txt` et `sitemap.xml`** en place.
- **Aucune erreur dans la console** sur un parcours complet.

Lighthouse mobile, en médiane de 5 passages :
- **Accueil (première visite, donc l'écran d'intro)** : performance 97, accessibilité,
  bonnes pratiques et SEO à 100.
- **Mentions légales** : 99, 100, 100, 100.

**Ce que rien de tout ça ne couvre :** Safari et WebKit (seul Chromium est disponible ici),
les vrais appareils, la production réelle, et le jugement humain. C'est l'objet des
étapes 3 à 5.

## 2. Contenu : ce qui bloque la mise en ligne

`PRODUCTION=1 npm run check:placeholders` refuse l'export tant qu'il reste une valeur
entre crochets. Le build Docker fait la même vérification avec `--build-arg PRODUCTION=1`.

**Valeurs à fournir** (`content/site.ts`, `content/epoques.ts`) :
- **Contact** : `[EMAIL]`, `[TELEPHONE]`.
- **Offres** : `[OFFRE_NOM]`, `[OFFRE_CONTENU]`, `[PRIX]`, avec autant d'offres que tu veux.
- **Preuve client** : `[PREUVE_PROJET]`, `[PREUVE_CLIENT]`, `[PREUVE_AVANT_APRES]`.
- **Mentions légales** : `[NOM_COMPLET]`, `[ADRESSE]`, `[SIRET]`,
  `[HEBERGEUR_RAISON_SOCIALE]`, `[HEBERGEUR_ADRESSE]`, `[HEBERGEUR_TELEPHONE]`,
  `[DUREE_CONSERVATION_JOURNAUX]`.

**Décisions à prendre :**
- **Sans preuve client au lancement, que montre-t-on ?** Si la sous-section « Preuves »
  disparaît, la veille se retrouve seule après les offres et se lira comme une preuve, ce
  contre quoi le brief met en garde (`BRIEF.md` § Preuve). C'est le point le plus coûteux.
- **Le sous-titre définitif** (la piste actuelle répond à une objection).
- **Les textes proposés pendant les tranches**, à valider ou remplacer :
  - le bouton « Parlons de votre projet » ;
  - la ligne « Pour les PME, les startups et les particuliers » ;
  - le surtitre « Axel · développeur indépendant · Nice » ;
  - la consigne de l'intro et le lien « Passer l'intro » ;
  - la mention de relecture de la veille.
- **L'icône ◐ du poussoir de thème** : générique, une marque propre à la montre serait plus
  juste.
- **Le titre de la page** (aujourd'hui « chronodev.fr ») et sa description, pour les
  résultats de recherche.

## 3. Aperçu (GitHub Pages)

Décision d'Axel : l'aperçu est sur GitHub Pages, Dokploy est réservé à la production
(`docs/DEPLOIEMENT.md`). Mise en place, une fois, côté GitHub, **dans cet ordre** :
1. passer le dépôt en **public** ;
2. faire de `main` la **branche par défaut** (Settings → General), avant l'étape 3 :
   l'environnement `github-pages` refuse sinon les déploiements depuis `main` ;
3. Settings → Pages → Source : **GitHub Actions** ;
4. protéger `main` (Settings → Branches) : PR obligatoire, check **« Vérifier »** requis.

Ensuite, chaque push vert sur `main` publie `https://axelfdez.github.io/chronodev.fr/`.

L'aperçu est **public et sans mot de passe** : les valeurs entre crochets y sont visibles.
Il porte une balise `noindex`, mais aucun en-tête de sécurité (Pages n'en permet pas).
C'est de quoi tester sur téléphone, pas l'image de production.

Contrôle :
```sh
curl -s https://axelfdez.github.io/chronodev.fr/ | grep -o '<meta name="robots"[^>]*>'
```

## 4. Vrais appareils : iPhone (Safari) et Android (Chrome)

Sur l'aperçu Pages. Pour chaque appareil, commencer par **effacer les données du site** :
c'est ce qui recrée une première visite. Sur iPhone : Réglages → Safari → Avancé →
Données des sites web, puis `axelfdez.github.io`.

1. **Intro.** La montre attend au centre, à l'état 1, à l'heure, avec le poussoir cerclé.
   Un toucher sur le poussoir doit amener le hero en moins de 2 s (sur mobile : fondu,
   sans trajet), puis l'accent arriver.
2. **Deuxième visite** : pas d'intro.
3. **Aiguilles.** Elles sont à l'heure, la trotteuse avance d'un pas par seconde et tourne
   autour du **bon centre** (risque S10 propre à WebKit), et le jour/nuit est cohérent
   avec l'heure.
4. **Époques.** En défilant, Avant, Pendant puis Après : le repère suit la section à
   l'écran, le grain apparaît (plus fort en Avant), et le cyan n'arrive qu'à Après. Sur
   tablette ou ordinateur, la montre suit : les aiguilles migrent dans le sous-cadran
   **sans saut ni décalage** (GSAP `svgOrigin` sous WebKit).
5. **Thème.** Basculer en clair, recharger : **aucun éclair noir**.
6. **Menu, poussoir chrono** (arrêt puis relance), **lien « Passer l'intro »**.
7. **Réduire les animations** (réglages d'accessibilité du téléphone) : pas d'intro,
   trotteuse à 0, changements d'époque instantanés.
8. **Paysage**, et le plus petit téléphone disponible.
9. **Juger, pas seulement vérifier :** la trotteuse cyan qui bat sous le bouton cyan
   attire-t-elle l'œil au détriment du contact ?

## 5. Test à froid (5 secondes)

C'est la seule mesure possible de ce que l'intro coûte, puisque le site n'a aucun outil
d'audience.
- **Hero de conversion.** Montrer le hero d'une deuxième visite pendant 5 s à 3 à 5
  personnes extérieures au projet, puis demander : que fait cette personne ? Pour qui ?
  Comment la contacter ? Si deux personnes ou plus butent sur une même question, on revoit
  le texte.
- **Première visite.** Leur donner le téléphone sans consigne et observer : appuient-elles,
  passent-elles l'intro, ou restent-elles perdues ?

## 6. Bascule en production

Quand les étapes 2 à 5 sont faites (détail dans `docs/DEPLOIEMENT.md` § Production) :
1. remplir toutes les valeurs, et constater que `PRODUCTION=1 npm run check:placeholders`
   passe ;
2. tranche de mise en production : la CI publie l'image sur GHCR, construite avec
   `PRODUCTION=1` ;
3. dans Dokploy : application de type image Docker, `ROBOTS_TAG=all`, dossier de veille
   créé sur l'hôte avec `derniere.json` sans entrée, puis monté ;
4. **répétition** sur un sous-domaine de test, avec les contrôles d'en-têtes ;
5. DNS chez OVH : `A` **et** `AAAA` de `chronodev.fr` (et `www`) vers le VPS ;
6. contrôler les en-têtes (`x-robots-tag: all`) et le HTML servi ;
7. passer l'URL de production dans PageSpeed Insights, en mobile ;
8. faire publier par n8n une première entrée de veille, validée.
