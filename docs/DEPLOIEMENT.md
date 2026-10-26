# Déploiement — Dokploy

L'image est construite par le `Dockerfile` à la racine. Une étape Node produit l'export
statique et sa CSP, puis nginx sert `out/` sur le port 80. TLS et le nom de domaine sont
gérés par Dokploy (Traefik).

## Application Dokploy

- Source : le repo GitHub, branche à déployer. Type de build : **Dockerfile**.
- Port du conteneur : **80**. Domaine `chronodev.fr`, HTTPS avec Let's Encrypt.
- Le build a besoin d'Internet : `next/font` télécharge les polices depuis Google **au
  build**, jamais depuis le navigateur des visiteurs.

## Variables

| Nom | Type | Aperçu | Production |
|---|---|---|---|
| `ROBOTS_TAG` | variable d'environnement (exécution) | `noindex, nofollow` (défaut) | `all` |
| `PRODUCTION` | argument de build | `0` (défaut) | `1` : le build échoue s'il reste une valeur entre crochets (`[EMAIL]`, `[PRIX]`…) |

## Aperçu protégé

Tant que le site contient des valeurs manquantes, il reste derrière une authentification
HTTP basique, ajoutée côté Traefik dans les réglages de sécurité de l'application Dokploy,
avec `ROBOTS_TAG` à sa valeur par défaut. On retire la protection et on passe
`ROBOTS_TAG=all` et `PRODUCTION=1` en même temps, quand Axel a fourni toutes les valeurs.

## Veille (`docs/VEILLE.md`)

Le site lit `/veille/derniere.json`. En production, ce dossier est un **volume** monté
par-dessus celui de l'image :
- dans Dokploy, application du site : montage du dossier hôte `/srv/chronodev/veille`
  sur `/usr/share/nginx/html/veille`, en **lecture seule** ;
- côté n8n : le même dossier hôte, en écriture.

Le dossier doit contenir dès le départ un `derniere.json` sans entrée (copie de
`public/veille/derniere.json`). Sinon, la requête renvoie une 404, que le navigateur
signale dans la console : le module reste masqué, mais Lighthouse pénalise l'erreur.

## Vérifier un déploiement

```sh
curl -sI https://chronodev.fr/ | grep -i -E 'content-security-policy|x-robots-tag|cache-control'
curl -s https://chronodev.fr/ | grep -o '<h1[^>]*>[^<]*</h1>'
```

Le test sur un vrai téléphone, iPhone (WebKit) compris, se fait sur l'URL d'aperçu.
