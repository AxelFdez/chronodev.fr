# BRIEF — chronodev.fr (v1)

Les points marqués ⚠ ne sont pas tranchés. Tout le reste est décidé.

## Objectif

Convaincre des clients de confier un projet à un développeur indépendant qui livre vite
grâce à l'IA, sans sacrifier la qualité.

**Le site sert à recruter** — obtenir des demandes de contact. La dimension « remarquer »
(Awwwards, portfolio) est un bonus, jamais une raison de dégrader la conversion.
Arbitrage découlant : le hero est **double** — intro à la première visite, hero de
conversion ensuite — et la montre n'est jamais au même niveau que l'accroche, le
sous-titre et le contact.

## Cible

PME, clients particuliers, startups. Collectivités : hors cible principale.

Besoin client à adresser : des délais qui dérapent, un budget flou, la peur de l'IA
(« est-ce que ça remplace le dev ? ») ou l'envie de l'utiliser sans savoir comment.

## Accroche

**Le temps ne joue plus contre vous.**

Sous-titre, piste actuelle : « Développement web et automatisation, accélérés par l'IA,
pilotés par un humain. » ⚠ **Réserve à lever** : la seconde moitié répond à une objection
au lieu d'affirmer un bénéfice. Elle laisse la peur du client écrire la phrase. Le cadrage,
lui, est fixe : l'IA accélère, Axel décide et répond du résultat.

## Concept

- **Intro** : une montre à gousset futuriste. Le visiteur appuie sur le poussoir du
  chronographe et la montre s'assemble, de l'état Avant à l'état Pendant (voir
  `MONTRE.md` § Budget). En SVG + GSAP, sans 3D. Jouée une seule fois, sautable,
  plafonnée à 2 s.
- **Site** : les trois époques **du projet du client** se lisent à la suite, en
  défilant : le problème (Avant), la méthode (Pendant), puis l'offre (Après). L'époque à
  l'écran change l'esthétique, et **la montre elle-même se construit** au fil de la
  lecture — voir `MONTRE.md`. La couronne fait défiler d'une époque à l'autre (desktop).
- La montre reste comme motif : couronne = navigation entre les époques, second poussoir = bascule de thème,
  chrono visible. Elle ne disparaît pas après l'intro. Le menu est un bouton « Menu »
  dans la barre du haut.
- « L'esthétique entière » change dans ces limites : l'état de la montre et le grain. Le
  hero, la barre du haut et le contact restent fixes.
- Ordre de lecture : Avant, Pendant, Après, **à la suite**. Décision d'Axel après le
  test iPhone : le visiteur doit lire le problème avant le résultat. Dans le hero, la
  montre est complète (`PLAN.md` § T8).

## Les trois époques — le projet du client

1. **Avant** — « Aujourd'hui, le temps joue contre vous. » Ce que le client vit avant
   d'avoir choisi un prestataire : le devis qui met trois semaines et reste flou, le délai
   qui n'engage personne, le site qui date et que plus personne n'ose toucher, les données
   recopiées à la main chaque semaine. Montre fruste, grain à 4,5 %, pas de cyan.
2. **Pendant** — « Pendant le projet, vous voyez le temps passer. Pas filer. » Ce que le
   client voit : jour 1, un prix et une date fermes, écrits ; chaque semaine, une version
   en ligne cliquable ; à tout moment, un seul interlocuteur ; à la livraison, le code, les
   accès et la documentation sont à lui. Plus le partage explicite entre ce que l'IA
   accélère (mise en place, code répétitif, tests, migrations, documentation) et ce qui
   reste humain (cadrage, arbitrages, sécurité et RGPD, ce qu'on refuse de faire, la
   responsabilité du résultat). Grain à 2,2 %, la matière apparaît.
3. **Après** — « Le temps joue pour vous. » Offres, preuves, contact. Grain à zéro,
   le cyan arrive.

## Preuve

**◐ C'est le manque le plus coûteux du projet, et aucun artboard ne le comble.**

L'état actuel : un module « Dernière veille » alimenté par n8n (flux filtrés + résumé LLM),
qui se masque si la dernière entrée a plus de **21 jours**. Chaque résumé est **validé par
Axel dans n8n** avant publication : rien de non relu ne sort sous son nom. Le module a son
propre titre, distinct de « Preuves » (voir `VEILLE.md`).

Ce module prouve qu'Axel suit l'actualité. Il ne prouve pas qu'il livre. Une PME qui hésite
à confier un budget ne se demande pas si son prestataire lit des flux RSS — elle se demande
si le dernier qui lui a promis une date l'a tenue. Dans une section intitulée « Preuve », sur
un site dont l'objectif est de recruter, c'est de la preuve d'activité déguisée en preuve
de compétence.

⚠ **À fournir** : deux ou trois projets livrés avec un avant/après chiffré, ou au minimum
un client qui accepte de mettre son nom. Tant que ça manque, l'époque 3 est un argumentaire
sans témoin.

## Exclusions

- Aucun élément de la franchise *Retour vers le futur* : pas de voiture, pas de tour de
  l'horloge, pas de « 88 », pas de réplique, pas de typo du titre.
- Aucune reproduction d'un cadran ou d'une interface Apple Watch. On garde les principes
  (lecture d'un coup d'œil, un accent, modules compacts), pas les éléments.
- Pas d'assets 3D de provenance incertaine.
- Pas de chiffre décoratif. Toute statistique affichée est réelle.

## Contraintes

- Contenu réel (offres, contact, preuves) en HTML indexable ; l'animation (SVG + GSAP)
  en couche d'enrichissement. Pas de WebGL.
- Intro sautable, non rejouée à la deuxième visite.
- Fallback statique propre sans JavaScript et sous `prefers-reduced-motion`.
- Mobile : intro allégée ; le repère Avant · Pendant · Après sert de navigation — glisser
  sur un cercle au pouce est trop imprécis.
- Thème sombre par défaut, clair par toggle. Le choix persiste et s'applique avant le
  premier paint.

## À trancher

- ⚠ Le sous-titre définitif (voir la réserve ci-dessus).
- ⚠ Les offres réelles affichées dans « Après » : noms, contenus, prix.
- ⚠ L'email et le téléphone de contact.
- ⚠ La preuve client.
- 3 à 5 références Awwwards annotées — ce qui plaît : rythme, transition, typo.
