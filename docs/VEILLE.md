# VEILLE — le module « Dernière veille »

Décisions d'Axel (`PLAN.md` C11) : chaque résumé est **validé par Axel dans n8n** avant
publication, et le module se masque si la dernière entrée a **plus de 21 jours**.

Ce module montre qu'Axel suit l'actualité. Il ne prouve pas qu'il livre (`BRIEF.md`
§ Preuve) : il a donc son propre titre, « Dernière veille », et ne figure jamais sous
« Preuves ».

## Ce que fait le site

- Il charge `/veille/derniere.json` **après** le rendu (`components/veille/Veille.tsx`),
  sans jamais l'attendre : au-delà de 3 s, il abandonne.
- Il n'affiche l'entrée que si **tout** est valide (`lib/veille.ts`) : schéma version 1,
  champs présents et de longueur raisonnable, source en `https://`, validation humaine
  présente, date de moins de 21 jours et pas dans le futur. Sinon, rien ne s'affiche :
  c'est l'échec fermé.
- Le texte est rendu en **texte brut**. Un résumé qui contiendrait du HTML s'affiche tel
  quel ; il n'est jamais interprété.
- Le module apparaît dans l'époque Après, après les preuves et avant le CTA, sous la ligne
  de flottaison : il ne décale rien de visible au chargement.
- Mention affichée : « Résumé rédigé avec l'IA, relu et validé par {par} le {date} ». Elle
  est cohérente avec le positionnement (l'IA accélère, Axel décide), et elle est vraie
  puisque la validation est obligatoire.

## Le fichier

Schéma complet : `docs/veille.schema.json`. Exemple :

```json
{
  "version": 1,
  "entree": {
    "date": "2026-10-20",
    "titre": "…",
    "resume": "…",
    "source": { "nom": "…", "url": "https://…" },
    "validee": { "par": "Axel", "le": "2026-10-21T08:12:00Z" }
  }
}
```

`"entree": null` signifie qu'il n'y a rien à montrer. C'est le contenu du fichier livré
avec le site (`public/veille/derniere.json`) : pas de 404, donc pas d'erreur dans la
console.

## Le workflow n8n (hors du repo)

1. **Déclencheur planifié** (par exemple chaque lundi matin).
2. **Lecture des flux** (RSS), puis **filtrage** : sources et mots-clés retenus par Axel.
3. **Choix d'un article**, puis **résumé par le LLM**. Consignes : français, texte brut sans
   HTML ni Markdown, titre de 120 caractères au plus, résumé de 600 au plus.
4. **Validation humaine.** Le résumé est envoyé à Axel par e-mail ou par messagerie, et le
   workflow attend sa réponse : n8n propose une opération d'envoi avec attente d'une
   approbation (« Send and Wait for Response »), à vérifier dans la version installée.
   Axel approuve, corrige ou refuse.
5. **Si c'est approuvé :** construire le JSON, avec `validee.par = "Axel"` et
   `validee.le` = l'instant de l'approbation. L'écrire dans `derniere.json.tmp`, puis le
   renommer en `derniere.json`. Le renommage est atomique : le site ne lit jamais un
   fichier à moitié écrit.
6. **Si c'est refusé :** ne rien écrire. Le site garde l'entrée précédente, puis masque
   le module au-delà de 21 jours.

Le fichier peut être validé avant écriture avec `docs/veille.schema.json` : n8n dispose
d'un nœud de code pour cela.

## Déploiement

Voir `docs/DEPLOIEMENT.md` § Veille : le dossier `/veille/` est un volume partagé entre
n8n (écriture) et nginx (lecture).
