import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TeamBadge } from '@/components/Team';
import { formatKickoff, stageLabel, statusLabel } from '@/lib/format';
import { getMatchDetail, isLive } from '@/lib/queries';

export const dynamic = 'force-dynamic';

function PointsPill({ points }: { points: number | null }) {
  if (points == null) return <span className="text-xs text-white/40">—</span>;
  const styles: Record<number, string> = {
    3: 'bg-gold-500 text-pitch-950',
    2: 'bg-green-400/80 text-pitch-950',
    1: 'bg-white/20 text-white',
    0: 'bg-black/30 text-white/50',
  };
  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${styles[points] ?? styles[0]}`}>
      {points} P
    </span>
  );
}

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = getMatchDetail(Number(id));
  if (!detail) notFound();

  const { match: m, kickedOff, tips } = detail;
  const hasResult = m.ftHome != null && m.ftAway != null;
  const pens = m.duration === 'PENALTY_SHOOTOUT' && m.penHome != null && m.penAway != null;

  return (
    <div className="space-y-6">
      <Link href="/spiele" className="text-sm text-white/60 hover:text-white">
        ← Alle Spiele
      </Link>

      <div className="card p-6">
        <div className="mb-3 text-center text-xs uppercase tracking-wide text-white/50">
          {stageLabel(m.stage, m.group)}
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex justify-end">
            <TeamBadge name={m.homeTeamName} code={m.homeTeamCode} crest={m.homeTeamCrest} align="right" />
          </div>
          <div className="text-center">
            {hasResult ? (
              <div className="font-display text-4xl font-bold">
                {m.ftHome} : {m.ftAway}
              </div>
            ) : (
              <div className="text-sm text-white/60">{formatKickoff(m.utcDate)}</div>
            )}
            {pens && (
              <div className="text-xs text-white/60">
                i.E. {m.penHome}:{m.penAway}
              </div>
            )}
            <div
              className={`mt-1 text-[10px] uppercase tracking-wide ${
                isLive(m) ? 'animate-pulse-live font-bold text-red-300' : 'text-white/40'
              }`}
            >
              {isLive(m) ? '● live' : statusLabel(m.status)}
            </div>
          </div>
          <div className="flex justify-start">
            <TeamBadge name={m.awayTeamName} code={m.awayTeamCode} crest={m.awayTeamCrest} />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <h2 className="border-b border-white/10 px-4 py-3 font-semibold">Tipps</h2>
        {!kickedOff ? (
          <p className="px-4 py-6 text-center text-sm text-white/60">
            🔒 Die Tipps werden erst mit Anpfiff sichtbar.
          </p>
        ) : tips.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-white/60">Keine Tipps für dieses Spiel.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {tips.map((t) => (
              <li key={t.participantId} className="flex items-center gap-3 px-4 py-2.5">
                <Link href={`/teilnehmer/${t.participantId}`} className="flex-1 truncate hover:underline">
                  {t.name}
                </Link>
                <span className="font-display font-semibold text-white/80">
                  {t.homeGoals}:{t.awayGoals}
                </span>
                <span className="w-12 text-right">
                  <PointsPill points={t.points} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
