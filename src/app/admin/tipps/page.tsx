import Link from 'next/link';
import { redirect } from 'next/navigation';
import { asc } from 'drizzle-orm';
import { isAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { participants, tips } from '@/lib/db/schema';
import { formatKickoff, stageLabel } from '@/lib/format';
import { getMatches } from '@/lib/queries';
import { saveTips } from '../actions';

export const dynamic = 'force-dynamic';

export default async function TippsPage({
  searchParams,
}: {
  searchParams: Promise<{ alle?: string }>;
}) {
  if (!(await isAdmin())) redirect('/admin/login');
  const { alle } = await searchParams;
  const showAll = alle === '1';

  const people = db.select().from(participants).orderBy(asc(participants.name)).all();
  const allTips = db.select().from(tips).all();
  const tipMap = new Map(allTips.map((t) => [`${t.matchId}:${t.participantId}`, t]));

  let matches = getMatches();
  if (!showAll) matches = matches.filter((m) => m.status !== 'FINISHED');

  if (people.length === 0) {
    return (
      <div className="card p-6 text-center text-white/70">
        Lege zuerst{' '}
        <Link href="/admin/teilnehmer" className="text-gold-400 underline">
          Teilnehmer
        </Link>{' '}
        an.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-sm">
        <p className="text-white/60">
          {showAll ? 'Alle Spiele' : 'Kommende & laufende Spiele'} · {matches.length}
        </p>
        <Link href={showAll ? '/admin/tipps' : '/admin/tipps?alle=1'} className="text-gold-400 underline">
          {showAll ? 'nur kommende zeigen' : 'alle Spiele zeigen'}
        </Link>
      </div>

      {matches.length === 0 && (
        <div className="card p-6 text-center text-white/60">
          Keine Spiele. Im Admin-Bereich „Jetzt synchronisieren" auslösen.
        </div>
      )}

      {matches.map((m) => (
        <form key={m.id} action={saveTips} className="card overflow-hidden">
          <input type="hidden" name="matchId" value={m.id} />
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 bg-white/5 px-4 py-3">
            <div className="font-semibold">
              {m.homeTeamName} <span className="text-white/40">–</span> {m.awayTeamName}
            </div>
            <div className="text-xs text-white/50">
              {stageLabel(m.stage, m.group)} · {formatKickoff(m.utcDate)}
            </div>
          </div>
          <div className="divide-y divide-white/10">
            {people.map((p) => {
              const t = tipMap.get(`${m.id}:${p.id}`);
              return (
                <div key={p.id} className="flex items-center gap-2 px-4 py-2">
                  <span className="flex-1 truncate text-sm">{p.name}</span>
                  <input
                    type="number"
                    min={0}
                    name={`tip_${p.id}_home`}
                    defaultValue={t?.homeGoals ?? ''}
                    className="input w-14 text-center"
                    inputMode="numeric"
                  />
                  <span className="text-white/40">:</span>
                  <input
                    type="number"
                    min={0}
                    name={`tip_${p.id}_away`}
                    defaultValue={t?.awayGoals ?? ''}
                    className="input w-14 text-center"
                    inputMode="numeric"
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-end border-t border-white/10 px-4 py-3">
            <button className="btn-gold text-sm">Tipps speichern</button>
          </div>
        </form>
      ))}
    </div>
  );
}
