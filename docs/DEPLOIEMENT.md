# Déploiement

Deux cibles, décidées par Axel :
- **Aperçu** : GitHub Pages, publié par la CI à chaque push vert sur `main`. Il sert à
  tester sur de vrais téléphones et à montrer le site avant la mise en ligne.
- **Production** : Dokploy, sur le VPS d'Axel, avec une image construite et publiée par la
  CI. Ce n'est pas encore en place : cette partie se fera au moment de la mise en ligne,
  quand les valeurs entre crochets seront fournies.

## Aperçu — GitHub Pages

Le job `apercu` de `.github/workflows/ci.yml` tourne sur `main`, seulement quand
« Vérifier » est vert. Il construit l'export statique et le publie sur
`https://axelfdez.github.io/chronodev.fr/`.

Ce n'est pas l'image de production :

| | Aperçu (Pages) | Production (nginx) |
|---|---|---|
| Chemin | sous `/chronodev.fr/` (`BASE_PATH`) | racine |
| Indexation | `<meta name="robots" content="noindex, nofollow">` (`APERCU=1`) | `X-Robots-Tag` (`ROBOTS_TAG`) |
| En-têtes (CSP, HSTS, X-Frame-Options…) | aucun : Pages n'en permet pas | `deploy/nginx/` |
| Accès | **public**, sans mot de passe | public |

Ce qu'on y juge : le rendu, les animations, l'intro, le thème, le comportement sur
téléphone. Les en-têtes et la CSP sont testés par la CI contre l'image nginx.

Mise en place, une fois, côté GitHub :
1. Dépôt **public** : Pages n'est gratuit qu'à cette condition.
2. `main` en **branche par défaut** (Settings → General), **avant** d'activer Pages.
   L'environnement `github-pages` n'accepte par défaut que la branche par défaut : sinon,
   le déploiement depuis `main` est refusé.
3. Settings → Pages → Source : **GitHub Actions**.
4. Protéger `main` (Settings → Branches) : PR obligatoire, check « Vérifier » requis.

## Production — Dokploy

Décision : la CI construit l'image avec `PRODUCTION=1`, la publie sur GHCR, et Dokploy la
récupère telle quelle. Ce qui tourne en production est donc exactement l'image testée, et
le VPS ne construit rien. Avec `PRODUCTION=1`, cette construction échoue tant qu'il reste
une valeur entre crochets.

- Application Dokploy de type **image Docker** : `ghcr.io/axelfdez/chronodev.fr`. Si le
  paquet est privé, il faut un jeton GitHub en lecture seule sur les paquets.
- Port du conteneur : **80**. Domaine `chronodev.fr`, HTTPS avec Let's Encrypt (Traefik).
- Le build a besoin d'Internet : `next/font` télécharge les polices depuis Google **au
  build**, jamais depuis le navigateur des visiteurs.

| Nom | Type | Défaut | Production |
|---|---|---|---|
| `ROBOTS_TAG` | variable d'environnement (exécution) | `noindex, nofollow` | `all` |
| `PRODUCTION` | argument de build (CI) | `0` | `1` : le build échoue s'il reste une valeur entre crochets (`[EMAIL]`, `[PRIX]`…) |

**DNS (OVH).** `chronodev.fr` pointe aujourd'hui sur la page « Site en construction »
d'OVH, en IPv4 **et** en IPv6 (`A` et `AAAA`). Les deux doivent pointer sur le VPS, ou
l'`AAAA` être supprimé, de même que `www`. Sinon, Let's Encrypt, qui essaie l'IPv6 en
premier, échoue, et les visiteurs mobiles en IPv6 voient encore la page d'OVH.

**Répétition.** Avant de changer les DNS, faire tourner l'application sur un sous-domaine
de test : c'est la première fois que Traefik, le certificat et l'image tourneront ensemble.

## Veille (`docs/VEILLE.md`)

Le site lit `/veille/derniere.json`. En production, ce dossier est un **volume** monté
par-dessus celui de l'image :
- dans Dokploy, application du site : montage du dossier hôte `/srv/chronodev/veille`
  sur `/usr/share/nginx/html/veille`, en **lecture seule** ;
- côté n8n : le même dossier hôte, en écriture.

Le dossier doit contenir dès le départ un `derniere.json` sans entrée (copie de
`public/veille/derniere.json`). Sinon, la requête renvoie une 404, que le navigateur
signale dans la console : le module reste masqué, mais Lighthouse pénalise l'erreur.

Sur l'aperçu Pages, c'est le fichier livré avec le site (sans entrée) : le module y reste
masqué.

## Vérifier un déploiement de production

```sh
curl -sI https://chronodev.fr/ | grep -i -E 'content-security-policy|x-robots-tag|cache-control'
curl -s https://chronodev.fr/ | grep -o '<h1[^>]*>[^<]*</h1>'
```
