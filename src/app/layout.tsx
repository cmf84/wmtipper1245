import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'WM-Tippspiel 2026',
  description: 'Familien-Tippspiel zur Fußball-WM 2026',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <div className="pitch-stripes min-h-screen">
          <header className="border-b border-white/10 bg-pitch-950/40 backdrop-blur">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
              <Link
                href="/"
                className="flex shrink-0 items-center gap-2 whitespace-nowrap font-display text-base font-bold tracking-tight sm:text-xl"
              >
                <span className="text-2xl">⚽</span>
                <span>
                  WM-Tippspiel <span className="text-gold-400">2026</span>
                </span>
              </Link>
              <nav className="flex items-center gap-1 text-sm font-medium">
                <Link href="/" className="rounded-lg px-3 py-2 hover:bg-white/10">
                  Rangliste
                </Link>
                <Link href="/spiele" className="rounded-lg px-3 py-2 hover:bg-white/10">
                  Spiele
                </Link>
                <Link href="/admin" className="rounded-lg px-3 py-2 text-white/60 hover:bg-white/10">
                  Admin
                </Link>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
          <footer className="mx-auto max-w-5xl px-4 py-8 text-center text-xs text-white/40">
            Familien-Tippspiel · Ergebnisse von football-data.org
          </footer>
        </div>
      </body>
    </html>
  );
}
