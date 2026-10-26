import type { Metadata } from 'next';
import { JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import { TopBar } from '@/components/TopBar';
import { site } from '@/content/site';
import { HEAD_SCRIPT } from '@/lib/html-state';
import './globals.css';

// Polices auto-hébergées au build (docs/DESIGN.md § Typographie) : aucune requête vers Google.
const sans = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  fallback: ['Helvetica Neue', 'Arial', 'sans-serif'],
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  preload: false,
  fallback: ['ui-monospace', 'monospace'],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: site.nom,
  description: site.accroche,
  // Pas de favicon pour l'instant : évite une 404 à chaque visite.
  icons: { icon: 'data:,' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* Bloquant et premier : le thème est posé avant le premier paint. */}
        <script dangerouslySetInnerHTML={{ __html: HEAD_SCRIPT }} />
      </head>
      <body>
        <a className="skip-link" href="#contenu">
          Aller au contenu
        </a>
        <TopBar />
        {children}
      </body>
    </html>
  );
}
