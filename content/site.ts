// Contenu du site. Les valeurs manquantes restent entre crochets jusqu'à ce qu'Axel les
// fournisse (CLAUDE.md) : ne jamais les remplacer par des exemples plausibles.
export const site = {
  nom: 'chronodev.fr',
  url: 'https://chronodev.fr',
  surtitre: 'Axel · développeur indépendant · Nice',
  accroche: 'Le temps ne joue plus contre vous.',
  // ⚠ Provisoire (BRIEF.md § Accroche) : la seconde moitié répond à une objection au lieu
  // d'affirmer un bénéfice. À remplacer par le sous-titre définitif d'Axel.
  sousTitre: 'Développement web et automatisation, accélérés par l’IA, pilotés par un humain.',
  // Proposé en tranche 2, à valider par Axel : le hero doit dire « pour qui »
  // (DESIGN.md § Hiérarchie du hero) ; la cible vient de BRIEF.md § Cible.
  cible: 'Pour les PME, les startups et les particuliers.',
  // Proposé en tranche 2, à valider par Axel.
  cta: 'Parlons de votre projet',
} as const;

export const contact = {
  email: '[EMAIL]',
  telephone: '[TELEPHONE]',
  ville: 'Nice',
} as const;

export const mentions = {
  editeur: '[NOM_COMPLET]',
  adresse: '[ADRESSE]',
  siret: '[SIRET]',
  hebergeurNom: '[HEBERGEUR_RAISON_SOCIALE]',
  hebergeurAdresse: '[HEBERGEUR_ADRESSE]',
  hebergeurTelephone: '[HEBERGEUR_TELEPHONE]',
  dureeJournaux: '[DUREE_CONSERVATION_JOURNAUX]',
} as const;

/** Une valeur pas encore fournie par Axel. */
export const estManquante = (valeur: string) => /^\[[A-Z0-9_]+\]$/.test(valeur);
