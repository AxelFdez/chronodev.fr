import { estManquante } from '@/content/site';

/** Lien e-mail ou téléphone ; texte brut tant que la valeur manque (pas de lien cassé). */
export function ContactValue({ type, valeur }: { type: 'email' | 'telephone'; valeur: string }) {
  if (estManquante(valeur)) return <span>{valeur}</span>;
  const href = type === 'email' ? `mailto:${valeur}` : `tel:${valeur.replace(/[^+\d]/g, '')}`;
  return <a href={href}>{valeur}</a>;
}
