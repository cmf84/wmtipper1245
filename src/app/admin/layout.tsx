import Link from 'next/link';
import { isAdmin } from '@/lib/auth';
import { logout } from './actions';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Admin 🔧</h1>
        {admin && (
          <form action={logout}>
            <button className="btn-ghost text-sm">Abmelden</button>
          </form>
        )}
      </div>

      {admin && (
        <nav className="flex flex-wrap gap-2 text-sm">
          <Link href="/admin" className="btn-ghost">
            Übersicht
          </Link>
          <Link href="/admin/teilnehmer" className="btn-ghost">
            Teilnehmer
          </Link>
          <Link href="/admin/tipps" className="btn-ghost">
            Tipps eintragen
          </Link>
          <Link href="/admin/ergebnisse" className="btn-ghost">
            Ergebnisse
          </Link>
        </nav>
      )}

      {children}
    </div>
  );
}
