// Les trois époques du projet du client (BRIEF.md § Les trois époques). Textes d'Axel,
// mis en forme ; rien n'est ajouté. Offres et preuve : valeurs manquantes entre crochets.
// Prototype « sections à la suite » : Pendant raccourci, proposition à valider par Axel.

export type EpoqueId = 'avant' | 'pendant' | 'apres';

export const EPOQUES: { id: EpoqueId; libelle: string; etat: 1 | 2 | 3 }[] = [
  { id: 'avant', libelle: 'Avant', etat: 1 },
  { id: 'pendant', libelle: 'Pendant', etat: 2 },
  { id: 'apres', libelle: 'Après', etat: 3 },
];

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
  // Deux lignes au lieu de deux listes de cinq. Retirés : « les migrations » (jargon pour
  // un client) et « ce qu'on refuse de faire » (trop vague sans exemple).
  partage: [
    {
      qui: 'Ce que l’IA accélère',
      quoi: 'la mise en place, le code répétitif, les tests, la documentation.',
    },
    {
      qui: 'Ce qui reste humain',
      quoi: 'le cadrage, les arbitrages, la sécurité et le RGPD, la responsabilité du résultat.',
    },
  ],
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
