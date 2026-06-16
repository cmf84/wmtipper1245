import Link from 'next/link';
import { TeamBadge } from '@/components/Team';
import { dayKey, formatDay, formatKickoff, stageLabel, statusLabel } from '@/lib/format';
import { getMatches, isFinished, isLive } from '@/lib/queries';
import type { Match } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

function ResultBadge({ m }: { m: Match }) {
  if (m.ftHome == null || m.ftAway == null) {
    return <span className="text-sm text-white/60">{formatKickoff(m.utcDate)}</span>;
  }
  const pens = m.duration === 'PENALTY_SHOOTOUT' && m.penHome != null && m.penAway != null;
  return (
    <span className="text-center">
      <span className="font-display text-lg font-bold">
        {m.ftHome} : {m.ftAway}
      </span>
      {pens && (
        <span className="ml-1 text-xs text-white/60">
          (i.E. {m.penHome}:{m.penAway})
        </span>
      )}
    </span>
  );
}

export default function SpielePage() {
  const matches = getMatches();

  // nach Tag gruppieren
  const groups = new Map<string, Match[]>();
  for (const m of matches) {
    const key = dayKey(m.utcDate);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Spiele ⚽</h1>

      {matches.length === 0 && (
        <div className="card p-8 text-center text-white/70">
          Noch keine Spiele geladen. Im Admin-Bereich „Jetzt synchronisieren" auslösen.
        </div>
      )}

      {[...groups.entries()].map(([key, dayMatches]) => (
        <section key={key} className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/50">
            {formatDay(dayMatches[0].utcDate)}
          </h2>
          <div className="card divide-y divide-white/10 overflow-hidden">
            {dayMatches.map((m) => (
              <Link
                key={m.id}
                href={`/spiele/${m.id}`}
                className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3 hover:bg-white/5"
              >
                <div className="min-w-0">
                  <TeamBadge name={m.homeTeamName} code={m.homeTeamCode} crest={m.homeTeamCrest} />
                </div>
                <div className="flex flex-col items-center px-2">
                  <ResultBadge m={m} />
                  <span
                    className={`mt-0.5 text-[10px] uppercase tracking-wide ${
                      isLive(m)
                        ? 'animate-pulse-live font-bold text-red-300'
                        : isFinished(m)
                          ? 'text-white/40'
                          : 'text-white/40'
                    }`}
                  >
                    {isLive(m) ? '● live' : statusLabel(m.status)}
                  </span>
                </div>
                <div className="flex min-w-0 justify-end">
                  <TeamBadge
                    name={m.awayTeamName}
                    code={m.awayTeamCode}
                    crest={m.awayTeamCrest}
                    align="right"
                  />
                </div>
              </Link>
            ))}
          </div>
          <p className="px-1 text-xs text-white/30">{stageLabel(dayMatches[0].stage, dayMatches[0].group)}</p>
        </section>
      ))}
    </div>
  );
}
