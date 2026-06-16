import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { matches, participants, tips } from '@/lib/db/schema';
import { getLastSyncAt } from '@/lib/footballData';
import { syncNow } from './actions';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  if (!(await isAdmin())) redirect('/admin/login');

  const matchCount = db.select().from(matches).all().length;
  const finishedCount = db.select().from(matches).all().filter((m) => m.status === 'FINISHED').length;
  const participantCount = db.select().from(participants).all().length;
  const tipCount = db.select().from(tips).all().length;
  const lastSync = getLastSyncAt();
  const hasApiKey = Boolean(process.env.FOOTBALL_DATA_API_KEY);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Teilnehmer" value={participantCount} />
        <Stat label="Spiele" value={matchCount} />
        <Stat label="beendet" value={finishedCount} />
        <Stat label="Tipps" value={tipCount} />
      </div>

      <div className="card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">Ergebnisse synchronisieren</div>
            <div className="text-xs text-white/50">
              {lastSync
                ? `Zuletzt: ${new Intl.DateTimeFormat('de-DE', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(lastSync))}`
                : 'Noch nie synchronisiert'}
            </div>
          </div>
          <form action={syncNow}>
            <button className="btn-gold" disabled={!hasApiKey}>
              Jetzt synchronisieren
            </button>
          </form>
        </div>
        {!hasApiKey && (
          <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-200">
            ⚠️ <code>FOOTBALL_DATA_API_KEY</code> ist nicht gesetzt. Trage ihn in der{' '}
            <code>.env</code> ein, damit der automatische Abruf funktioniert.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/teilnehmer" className="btn-ghost">
          → Teilnehmer verwalten
        </Link>
        <Link href="/admin/tipps" className="btn-ghost">
          → Tipps eintragen
        </Link>
        <Link href="/admin/ergebnisse" className="btn-ghost">
          → Ergebnisse manuell setzen
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-4 text-center">
      <div className="font-display text-3xl font-bold text-gold-400">{value}</div>
      <div className="text-xs text-white/50">{label}</div>
    </div>
  );
}
