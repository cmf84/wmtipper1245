import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatKickoff } from '@/lib/format';
import { getParticipantDetail } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function ParticipantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = getParticipantDetail(Number(id));
  if (!detail) notFound();

  const { participant, totalPoints, rows } = detail;
  const withTip = rows.filter((r) => r.homeGoals != null);

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-white/60 hover:text-white">
        ← Rangliste
      </Link>

      <div className="card flex items-center justify-between p-6">
        <h1 className="font-display text-2xl font-bold">{participant.name}</h1>
        <div className="text-right">
          <div className="font-display text-3xl font-bold text-gold-400">{totalPoints}</div>
          <div className="text-xs text-white/50">Punkte gesamt</div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <h2 className="border-b border-white/10 px-4 py-3 font-semibold">Tipps</h2>
        {withTip.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-white/60">Noch keine Tipps eingetragen.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {withTip.map((r) => (
              <li key={r.match.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <Link href={`/spiele/${r.match.id}`} className="flex-1 truncate hover:underline">
                  {r.match.homeTeamName} – {r.match.awayTeamName}
                  <span className="ml-2 text-xs text-white/40">{formatKickoff(r.match.utcDate)}</span>
                </Link>
                <span className="font-display font-semibold text-white/80">
                  {r.homeGoals}:{r.awayGoals}
                </span>
                <span className="w-10 text-right font-semibold text-gold-400">
                  {r.points == null ? '–' : `${r.points}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
