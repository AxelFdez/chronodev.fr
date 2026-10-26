// Les trois époques du projet du client (BRIEF.md § Les trois époques). Textes d'Axel,
// mis en forme ; rien n'est ajouté. Offres et preuve : valeurs manquantes entre crochets.

export type EpoqueId = 'avant' | 'pendant' | 'apres';

export const EPOQUES: { id: EpoqueId; libelle: string; etat: 1 | 2 | 3 }[] = [
  { id: 'avant', libelle: 'Avant', etat: 1 },
  { id: 'pendant', libelle: 'Pendant', etat: 2 },
  { id: 'apres', libelle: 'Après', etat: 3 },
];

export const EPOQUE_PAR_DEFAUT: EpoqueId = 'apres'; // CLAUDE.md, décision « Molette »

export const avant = {
  titre: 'Aujourd’hui, le temps joue contre vous.',
  constats: [
    'Le devis qui met trois semaines et reste flou.',
    'Le délai qui n’engage personne.',
    'Le site qui date, et que plus personne n’ose toucher.',
    'Les données recopiées à la main, chaque semaine.',
  ],
};

export const pendant = {
  titre: 'Pendant le projet, vous voyez le temps passer. Pas filer.',
  engagements: [
    { quand: 'Jour 1', quoi: 'un prix et une date fermes, écrits.' },
    { quand: 'Chaque semaine', quoi: 'une version en ligne, cliquable.' },
    { quand: 'À tout moment', quoi: 'un seul interlocuteur.' },
    { quand: 'À la livraison', quoi: 'le code, les accès et la documentation sont à vous.' },
  ],
  ia: {
    titre: 'Ce que l’IA accélère',
    points: [
      'La mise en place',
      'Le code répétitif',
      'Les tests',
      'Les migrations',
      'La documentation',
    ],
  },
  humain: {
    titre: 'Ce qui reste humain',
    points: [
      'Le cadrage',
      'Les arbitrages',
      'La sécurité et le RGPD',
      'Ce qu’on refuse de faire',
      'La responsabilité du résultat',
    ],
  },
};

export const apres = {
  titre: 'Le temps joue pour vous.',
  // Nombre d'offres, noms, contenus et prix : à fournir par Axel.
  offres: [{ nom: '[OFFRE_NOM]', contenu: '[OFFRE_CONTENU]', prix: '[PRIX]' }],
  // Aucun projet livré ni client nommé à ce jour (CLAUDE.md, « La preuve client »).
  preuve: {
    projet: '[PREUVE_PROJET]',
    client: '[PREUVE_CLIENT]',
    resultat: '[PREUVE_AVANT_APRES]',
  },
};
