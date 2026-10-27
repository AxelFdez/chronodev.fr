# DESIGN — chronodev.fr (v1)

Direction : laiton + cyan électrique en sombre, laiton + brique en clair.
Tous les ratios ci-dessous sont **mesurés**, pas estimés.

## Règle d'usage

Le risque de cette direction est le cliché steampunk-cyber. Garde-fous :

- **Laiton** : matière et filets. Boîtier, couronne, poussoir, surtitres, séparateurs.
  Jamais un aplat de pleine largeur. Porté par le **hero et la montre**, vus par tout
  le monde, et par les étiquettes des époques — jamais par le fond d'une époque.
- **Accent** : seul accent du site. Interaction (survol, focus, état actif), données
  en direct, époque 3. Un seul accent par thème.
- Le reste est neutre. C'est ce qui rend le site lisible et professionnel.

Répartition visée sur l'ensemble du site : **neutre ~76 %, laiton ~16 %, accent ~8 %**.

## Tokens

Deux jeux de valeurs sur un seul jeu de tokens. L'accent et le laiton **changent de
valeur selon le thème** : ce ne sont pas des tokens uniques.

```css
:root,
:root[data-theme="dark"] {
  --bg:          #0B0D10;
  --surface:     #12161B;
  --border:      #262B33;
  --text:        #E8E6E1;
  --text-muted:  #8A8F98;
  --brass:       #B8893B;  /* encre ET matière en sombre */
  --brass-light: #D9B26A;
  --accent:      #3FE0F0;
  --accent-ink:  #0B0D10;  /* texte posé sur --accent */
}

:root[data-theme="light"] {
  --bg:          #F6F5F2;
  --surface:     #FFFFFF;
  --border:      #DDD7CA;
  --text:        #16181C;
  --text-muted:  #5E636B;
  --brass:       #7A5A1E;  /* encre uniquement */
  --brass-light: #C9A05A;  /* matière uniquement, jamais du texte */
  --accent:      #B84A3B;
  --accent-ink:  #FFFFFF;  /* texte posé sur --accent */
}
```

### Contrastes mesurés

**Thème sombre, sur `--bg` #0B0D10**

| Couleur | Ratio | Usage |
|---|---|---|
| `--text` #E8E6E1 | 15.60:1 | tout texte |
| `--text-muted` #8A8F98 | 5.99:1 | texte secondaire (5.59:1 sur `--surface`) |
| `--accent` #3FE0F0 | 12.17:1 | texte, aplats, aiguilles |
| `--brass-light` #D9B26A | 9.75:1 | surtitres |
| `--brass` #B8893B | 6.19:1 | **valeur la plus basse de la palette.** Titrage et filets uniquement, à éviter en mono 11 px. |

**Thème clair, sur `--bg` #F6F5F2**

| Couleur | Ratio | Usage |
|---|---|---|
| `--text` #16181C | 16.30:1 | tout texte |
| `--text-muted` #5E636B | 5.55:1 | texte secondaire |
| `--accent` #B84A3B | 4.72:1 | texte et liens. Blanc dessus : **5.15:1** |
| `--brass` #7A5A1E | 5.82:1 | surtitres, filets, états |
| `--brass-light` #C9A05A | — | **aplat uniquement**, avec encre #16181C : 7.33:1 |

### Ce qui ne traverse pas les thèmes

- `#3FE0F0` sur fond clair : **1.47:1**. Inutilisable, en texte comme en fond de bouton.
- `#B8893B` en texte sur fond clair : **2.88:1**. Le laiton cesse d'être une encre en clair.
- `#B84A3B` sur fond sombre : **3.78:1**. Échoue AA. Si la brique devait un jour servir
  en sombre, sa valeur remonte à `#CF5A45` (4.82:1).

### Conséquence sur la narration

En sombre, l'arc des époques va du laiton au cyan : chaud vers froid, « hier » vers
« demain ». En clair, l'accent brique est chaud comme le laiton : **l'arc de température
n'existe pas**. En thème clair, la progression des époques doit passer entièrement par
la valeur et le grain. Ne compte pas sur la couleur pour la raconter.

## Bascule de thème

Sombre par défaut pour tout le monde, `prefers-color-scheme` volontairement ignoré au
premier chargement. Le choix du visiteur persiste et **doit s'appliquer avant le premier
paint**, sinon un visiteur en clair reçoit un flash de fond noir à chaque visite :

```html
<!-- dans <head>, inline, bloquant : ni async, ni defer, ni src -->
<script>
  try {
    var t = localStorage.getItem('chronodev-theme');
    if (t === 'light') document.documentElement.dataset.theme = 'light';
  } catch (e) {}
</script>
```

Deux drapeaux en stockage local : `chronodev-theme` et `chronodev-intro-vue`.
Les deux lectures sont enveloppées dans un `try/catch` (navigation privée, stockage bloqué).
Si le stockage est illisible, l'intro n'est **pas** jouée : elle ne pourrait jamais être
marquée comme vue, et se rejouerait à chaque visite.

Implémentation : `lib/html-state.ts`, qui pose aussi `data-js` et `data-intro` sur `<html>`.
React 19 range les feuilles de style **avant** ce script dans `<head>`, et on ne peut pas
changer cet ordre sans retoucher le HTML généré. C'est sans conséquence : le navigateur ne
rend rien avant d'avoir atteint `<body>`, et le script s'exécute pendant l'analyse du
`<head>`. C'est vérifié par un test : CSS et JS retardés de 800 ms, le premier frame est déjà
en thème clair, avant le chargement de React.

## Typographie

- Titrage et texte courant : **Space Grotesk** (400, 500, 600, 700)
- Données, chrono, timestamps, étiquettes : **JetBrains Mono** (400, 500, 700)
- Deux familles maximum. **Pas de serif**, décidé : une troisième famille, et un
  basculement serif vers sans lirait comme un changement de marque, pas de temps.
  La matière de l'époque 1 vient du laiton et du grain, pas de la typo.
- Chargement : **`next/font/google`**, auto-hébergé. Les fichiers sont téléchargés au
  build et servis depuis chronodev.fr ; le navigateur du visiteur n'envoie aucune requête
  à Google (RGPD, voir `PLAN.md` C10). Pas de `<link>` vers `fonts.googleapis.com`, pas de
  `preconnect`, et `font-src 'self'` dans la CSP.
- Réglages : `subsets: ['latin']` (couvre le français : accents, œ, « », espaces fines),
  `display: 'swap'`. Les polices sont exposées en variables CSS `--font-sans` et
  `--font-mono` sur `<html>`. Les deux familles sont variables : un seul fichier chacune.
  Les graisses listées plus haut sont celles qu'on utilise, pas des fichiers à charger.
- Préchargement : Space Grotesk seulement, puisqu'elle porte le `h1` du hero. JetBrains
  Mono en `preload: false`, **même** pour le surtitre mono du hero : mesuré en tranche 2,
  la précharger retarde l'accroche (LCP de 1,8 à 2,5 s, Lighthouse de 98 à 95). Le
  surtitre s'affiche d'abord dans la police de repli, sans décalage (CLS 0).
- Repli : `next/font` génère une police de repli aux métriques ajustées
  (`adjustFontFallback`) pour limiter le décalage au chargement. Pile déclarée derrière :
  `'Helvetica Neue', Arial, sans-serif` et `ui-monospace, monospace`.

## Grain

Overlay en `repeating-linear-gradient` horizontal, `pointer-events: none`, par-dessus
le fond, sous le contenu. L'opacité porte la progression des époques :

| Époque | Opacité du grain |
|---|---|
| Avant | 4,5 % |
| Pendant | 2,2 % |
| Après | 0 % |

En thème clair, l'opacité et la teinte du grain sont à régler à part : un grain laiton
clair sur papier clair ne se voit pas. Prévois un réglage par époque **et** par thème.

Réglage retenu (tranche 3, `styles/tokens.css`) :

| Thème | Teinte | Avant | Pendant | Après |
|---|---|---|---|---|
| Sombre | `--brass-light` | 4,5 % | 2,2 % | 0 |
| Clair | `--text` #16181C | 6 % | 3 % | 0 |

Le texte posé sur le grain le plus dense reste au-dessus de 4.5:1 (mesuré par
`npm run check:contrast`), **sauf l'accent en thème clair**. Celui-ci tombe à 4.20:1 sur
le grain d'Avant, et sous 4.5:1 dès 3 % de grain. D'où la règle : **aucun texte en accent
en Avant ni en Pendant**. Elle découle déjà de « l'accent arrive à l'époque 3 », et un
test la vérifie.

## Motion

| Usage | Durée | Easing (GSAP) |
|---|---|---|
| Micro-interaction (survol, focus) | 150–250 ms | `power2.out` |
| Appui sur le poussoir | 200 ms enfoncé, 400 ms retour | `back.out(1.7)` |
| Transition de section | 600–900 ms | `power3.inOut` |
| Changement d'époque | 1,2–2 s | `power2.inOut` |

Règles :
- Une seule timeline GSAP pilote la montre ; les époques sont des plages de cette timeline.
- Le contenu clé (accroche, offres, contact) ne s'anime **jamais** en boucle et reste
  lisible sans animation.
- Sous `prefers-reduced-motion` : pas de parallaxe, fondus courts, et
  toute boucle à l'arrêt (y compris la trotteuse de la montre).
- L'intro ne dépasse pas **2 s** entre l'appui sur le poussoir et l'affichage du hero.
  Le poussoir est cliquable au premier frame, sans mise en place préalable.
  L'intro joue l'assemblage 1 → 2 seulement (`MONTRE.md` § Budget) : l'assemblage
  complet ne tient pas dans ces 2 s.

## Hiérarchie du hero

En cinq secondes, un visiteur doit comprendre : ce que fait Axel, pour qui, comment le
contacter. **La montre n'est jamais au même niveau que ces trois informations.**
Elle est latérale, plus basse en contraste, et ne retarde rien.
