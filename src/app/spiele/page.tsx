import Link from 'next/link';
import { TeamBadge } from '@/components/Team';
import { dayKey, formatDay, formatKickoff, stageLabel, statusLabel } from '@/lib/format';
import { getMatches, hasKickedOff, isFinished, isLive } from '@/lib/queries';
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

function MatchRow({ m }: { m: Match }) {
  return (
    <Link
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
  );
}

function groupByDay(ms: Match[]): Map<string, Match[]> {
  const groups = new Map<string, Match[]>();
  for (const m of ms) {
    const key = dayKey(m.utcDate);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }
  return groups;
}

function DayGroup({ dayMatches }: { dayMatches: Match[] }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-white/50">
        {formatDay(dayMatches[0].utcDate)}
      </h2>
      <div className="card divide-y divide-white/10 overflow-hidden">
        {dayMatches.map((m) => (
          <MatchRow key={m.id} m={m} />
        ))}
      </div>
      <p className="px-1 text-xs text-white/30">
        {stageLabel(dayMatches[0].stage, dayMatches[0].group)}
      </p>
    </section>
  );
}

export default function SpielePage() {
  const matches = getMatches();

  const liveMatches = matches.filter(isLive);

  const upcoming = matches
    .filter((m) => !hasKickedOff(m))
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());

  const past = matches
    .filter((m) => hasKickedOff(m) && !isLive(m))
    .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime());

  const upcomingGroups = groupByDay(upcoming);
  const pastGroups = groupByDay(past);

  // Nächster Spieltag immer sichtbar, Rest im ausklappbaren Bereich
  const upcomingEntries = [...upcomingGroups.entries()];
  const [nextDayEntry, ...laterEntries] = upcomingEntries;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Spiele ⚽</h1>

      {matches.length === 0 && (
        <div className="card p-8 text-center text-white/70">
          Noch keine Spiele geladen. Im Admin-Bereich „Jetzt synchronisieren" auslösen.
        </div>
      )}

      {liveMatches.length > 0 && (
        <section className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-red-300">
            <span className="h-2 w-2 animate-pulse-live rounded-full bg-red-400" />
            Live
          </h2>
          <div className="card divide-y divide-white/10 overflow-hidden border-red-400/30 bg-red-500/10">
            {liveMatches.map((m) => (
              <MatchRow key={m.id} m={m} />
            ))}
          </div>
        </section>
      )}

      {laterEntries.length > 0 && (
        <details className="group space-y-4">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white/50 hover:text-white/80">
            <span className="transition-transform group-open:rotate-90">▶</span>
            Zukünftige Spiele ({upcoming.length - (nextDayEntry?.[1].length ?? 0)})
          </summary>
          <div className="space-y-6">
            {laterEntries.map(([key, dayMatches]) => (
              <DayGroup key={key} dayMatches={dayMatches} />
            ))}
          </div>
        </details>
      )}

      {nextDayEntry && <DayGroup dayMatches={nextDayEntry[1]} />}

      {[...pastGroups.entries()].map(([key, dayMatches]) => (
        <DayGroup key={key} dayMatches={dayMatches} />
      ))}
    </div>
  );
}
