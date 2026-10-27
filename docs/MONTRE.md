# MONTRE — l'objet central et son animation

L'asset est `assets/montre.svg`. Il contient **les trois états en calques superposés**,
pas trois dessins. Chaque époque révèle un calque ; rien ne change de coordonnées,
sauf une exception documentée plus bas.

**Implémentation (depuis la tranche 2) : `components/watch/Watch.tsx` fait foi.**
`assets/montre.svg` reste la référence du dessin d'origine, avec ses défauts (voir
`PLAN.md` § 2). Le composant les corrige :
- calques réordonnés : les aiguilles h/m et la trotteuse sont au-dessus du cadran,
  du sous-cadran et du jour/nuit ;
- reflet ramené dans le boîtier ;
- aiguilles dessinées à 0° ;
- couleurs en variables par thème ;
- ids préfixés `w-`.

Les états 1, 2 et 3 passent par `data-etat` sur le `<svg>`. Depuis la tranche 3, l'état
suit le radio coché de la section des époques (Avant = 1, Pendant = 2, Après = 3). Sans
JavaScript, la montre reste à l'état 3. Les noms `#l1`, `#l2`,
`#hands-central`… de ce document désignent les parties du dessin, pas des sélecteurs
du code.

Type retenu : **régulateur sur boîtier travaillé**. Les secondes occupent le centre,
les heures et les minutes sont reléguées dans un sous-cadran à 6 h.

## Repère

`viewBox="0 41 380 412"` — déjà recadré sur le dessin, aucune marge fantôme.
Centre du boîtier : **(190, 290)**. Lunette : r 130. Cadran : r 112.
Chemin de fer : r 96 à 104 (majeures), r 99 à 104 (fines).
Sous-cadran des heures : centre (190, 352), r 36.
Indicateur jour/nuit : centre (190, 228), r 26.

Ne modifie aucune de ces valeurs sans remesurer les collisions : les graduations
fines de 168° à 192° sont **volontairement absentes** parce qu'elles passaient à moins
de 2 px du bord du sous-cadran. Une graduation qui frôle un bord lit comme un défaut
d'alignement, pas comme un choix.

## Les trois calques

### `#l1` — Avant · toujours visible

Boîtier complet mais en **aplat mat** (`#8A6A2E`, carrure `#5A4420`), cadran nu,
12 graduations ternes (`#ticks-major`, `#3A4049`), deux aiguilles centrales
(`#hands-central`), aucune seconde.

Fruste, **pas ancienne** : aucun chiffre romain, aucune patine, aucun guillochage.
C'est la pauvreté du cadran qui dit « avant ». C'est aussi ce qui évite le steampunk
que le brief exclut — ne cède pas à la tentation d'« enrichir » cet état.

### `#l2` — Pendant · `opacity: 0 → 1`

Redessine la même géométrie avec les dégradés, et ajoute :

- la matière : dégradé `#m-brass`, reflet spéculaire, moletage de carrure, joint d'ouverture
- `#ticks-minor` : 44 graduations fines, le chemin de fer passe de 12 à 60 divisions
- `#subdial-hours` : le sous-cadran de 6 h, **sans aiguilles propres**
- `#hand-seconds` : la trotteuse centrale, en laiton `#D9B26A` à ce stade
- `#cap-center` : l'axe du chronographe, laiton

Deux tweens de propriété accompagnent ce passage :
```js
gsap.to('#ticks-major', { stroke: '#454C57', duration: 0.6 });
gsap.to('#tick-180',    { opacity: 0, duration: 0.3 });   // masqué par le sous-cadran
```

### `#l3` — Après · `opacity: 0 → 1`

- `#daynight` : l'indicateur jour/nuit à 12 h — **réel**, piloté par l'**heure locale** du
  visiteur (décision d'Axel, `PLAN.md` C4). Un disque tourne en 24 h, sa moitié pleine en
  haut à midi. Le sous-cadran affiche 12 h : c'est le jour/nuit qui lève l'ambiguïté
  entre 3 h et 15 h.
- le filet clair intérieur de lunette
- et deux recolorations :
```js
gsap.to('#hand-seconds', { stroke: '#3FE0F0', duration: 0.8 });
gsap.to('#cap-center',   { fill:   '#3FE0F0', duration: 0.8 });
```

**Les états 1 et 2 ne contiennent pas un pixel de cyan.** C'est délibéré : l'arrivée de
l'accent *est* l'événement du passage 2 → 3, ce qui évite d'ajouter un compteur
décoratif pour donner de la matière à cette étape. Ne mets pas de cyan plus tôt.

## Le seul moment non additif

Au passage 1 → 2, `#hands-central` quitte le centre et migre dans le sous-cadran en
rétrécissant. C'est la relégation du régulateur rendue visible, et c'est **le temps fort
de toute l'animation** — soigne-le, le reste n'est qu'une apparition d'opacité.

```js
gsap.to('#hands-central', {
  y: 62,                        // (190,290) -> (190,352)
  scale: 0.35,
  svgOrigin: '190 290',         // PAS transformOrigin : sur un SVG, GSAP le rapporte à la
                                // boîte de l'élément, et les aiguilles sortent du cadre (S3)
  duration: 1.0,
  ease: 'power3.inOut'
});
```

Les longueurs d'aiguilles passent de 55 et 88 à 19,3 et 30,8. Les deux rapports exacts
seraient 0,364 et 0,341 : un `scale` unique de 0,35 est le compromis, l'écart est
invisible à cette taille.

## Les compteurs — un par donnée réelle

| Position | Donnée | Réelle ? |
|---|---|---|
| Centre | les secondes, au pas d'une seconde | oui, l'heure système |
| 6 h | heures et minutes | oui |
| 12 h (état 3) | jour / nuit | oui, l'heure locale (jour de 6 h à 18 h) |

Ont été **retirés**, et ne doivent pas revenir sans une donnée nouvelle :

- **Le compteur d'époque.** La molette l'affiche déjà en mots avec un marqueur actif.
  Un compteur qui répète n'est pas faux, il est redondant — et la redondance coûte le
  même espace visuel que le mensonge.
- **Le compteur de veille.** Le module « Dernière veille » donne déjà la date en texte.
  Une aiguille qui pointe un nombre de jours est moins lisible qu'une date écrite.

Règle générale : un compteur = une donnée réelle **et non redondante**. Le cadran a la
densité que les données autorisent, ni plus ni moins.

## Trotteuse

Rotation par **pas d'une seconde**, pas en balayage continu.

**Décidé (`PLAN.md` C5), implémenté en tranche 4 :**
- **Heure réelle.** Les aiguilles sont dessinées à 0°, puis orientées par l'attribut
  `transform="rotate(a 190 290)"`, sans transformation CSS (voir S10). Un script inline
  placé juste après la montre les met à l'heure avant le premier paint. Ensuite, un
  minuteur aligné sur la seconde avance la trotteuse d'un pas : aucune animation CSS, et
  pas de boucle `requestAnimationFrame`.
- **Pause (WCAG 2.2.2).** Le poussoir de 1 h 30 est un vrai `<button>` « Arrêter le
  chrono » (`aria-pressed`). Arrêté, la trotteuse se fige ; relancé, elle reprend
  l'heure réelle. Les heures et les minutes continuent : c'est l'heure.
- **`prefers-reduced-motion`.** Le chrono démarre arrêté, trotteuse garée à 0 : une
  aiguille de chrono au repos repose à 0, c'est un état vrai. Heures, minutes et
  jour/nuit sont mis à jour une fois par minute, par saut. Le visiteur peut relancer le
  chrono.

Une aiguille qui glisse en continu sur un cadran de cette taille, au milieu d'un hero,
capte l'attention en permanence. Un pas à 1 Hz est perceptible sans être intrusif, et
c'est ce qui rend la montre compatible avec la règle « le contenu clé ne s'anime jamais
en boucle ».

**À corriger à l'intégration :** la position de départ de `#hand-seconds` est à 18°,
soit pile sur une graduation (18 = 3 × 6°). Si tu changes cette position, garde un
multiple de 6°, sinon l'aiguille s'arrête entre les repères à chaque pas — invisible
sur un rendu fixe, mais ça fait « pas fini » dès que l'animation tourne.

## Budget de l'intro — décidé : 1 → 2 seulement

Le plafond de l'intro est de **2 s** entre l'appui sur le poussoir et l'affichage du hero
(voir `DESIGN.md`). L'assemblage complet Avant → Après ne tient pas dedans : il faut
3 à 4 s pour que la migration des aiguilles soit lisible.

**Décision d'Axel : l'intro joue 1 → 2 seulement**, en SVG + GSAP. La migration des
aiguilles garde le temps d'être lisible, et le cyan n'apparaît pas dans l'intro.

Écartées :
- l'assemblage complet en accéléré : tient dans le budget, mais la migration des
  aiguilles devient illisible, donc le temps fort est gâché ;
- une intro de 3,5 s : l'effet est complet, au prix en conversion que le hero double
  cherchait justement à éviter.

**Décidé (`PLAN.md` C2) :**
- **Justification.** L'option 1 tient parce que c'est la seule qui laisse la migration
  des aiguilles lisible en 2 s. L'argument d'origine, « le cyan devient la récompense du
  premier tour de molette », est abandonné : la molette est sur Après au chargement, donc
  le cyan est déjà là avant tout geste.
- **Passage 2 → 3.** Il se joue juste après l'apparition du hero, en 0,8 s, quand le
  texte est déjà lisible. Il ne compte pas dans les 2 s de l'intro, et l'accent arrive
  sans geste du visiteur.

## Montre et thème clair

Le SVG est écrit pour le fond sombre. En thème clair :
cadran `#FFFFFF`, graduations `#B8B2A4`, matière `#C9A05A`, accent `#B84A3B`,
et le reflet spéculaire **n'a pas d'équivalent** — il faut le remplacer par une ombre
portée douce, pas l'atténuer. Un boîtier laiton sur fond clair est une illustration,
là où sur fond sombre c'est un objet éclairé dans le noir. C'est le coût du thème clair
sur cet asset, et il est connu.

## Fallback statique

Sans JavaScript ou sous `prefers-reduced-motion` : sers le SVG avec `#l2` et `#l3` à
`opacity: 1`, `#hands-central` déjà transformé, et aucune animation. L'état final est
complet et lisible sans une seule ligne de JavaScript.

Sans JavaScript, la montre affiche une pose fixe (1 h 25 min 03 s) : l'heure réelle
demande un script. Sous `prefers-reduced-motion`, les changements d'époque sont
instantanés, sans aucune interpolation.
