/** Aggregierte Datenabfragen für die UI (Rangliste, Spielplan, Details). */
import { asc, eq } from 'drizzle-orm';
import { db } from './db';
import { matches, participants, tips, type Match } from './db/schema';
import { effectiveResult } from './scoring';

/** Hat das Spiel bereits angepfiffen? (Tipps werden erst ab Anpfiff aufgedeckt.) */
export function hasKickedOff(m: Pick<Match, 'utcDate' | 'status'>): boolean {
  if (m.status === 'IN_PLAY' || m.status === 'PAUSED' || m.status === 'FINISHED') return true;
  return new Date(m.utcDate).getTime() <= Date.now();
}

export function isLive(m: Pick<Match, 'status'>): boolean {
  return m.status === 'IN_PLAY' || m.status === 'PAUSED';
}

export function isFinished(m: Pick<Match, 'status'>): boolean {
  return m.status === 'FINISHED';
}

export interface LeaderboardEntry {
  id: number;
  name: string;
  points: number;
  exact: number; // Anzahl 3-Punkte-Tipps
  diffHits: number; // Anzahl 2-Punkte-Tipps
  tendencyHits: number; // Anzahl 1-Punkt-Tipps
  scored: number; // Anzahl gewerteter Tipps
  rank: number;
}

export function getLeaderboard(): LeaderboardEntry[] {
  const people = db.select().from(participants).all();
  const allTips = db.select().from(tips).all();

  const byParticipant = new Map<number, LeaderboardEntry>();
  for (const p of people) {
    byParticipant.set(p.id, {
      id: p.id,
      name: p.name,
      points: 0,
      exact: 0,
      diffHits: 0,
      tendencyHits: 0,
      scored: 0,
      rank: 0,
    });
  }

  for (const t of allTips) {
    const entry = byParticipant.get(t.participantId);
    if (!entry || t.points == null) continue;
    entry.points += t.points;
    entry.scored += 1;
    if (t.points === 3) entry.exact += 1;
    else if (t.points === 2) entry.diffHits += 1;
    else if (t.points === 1) entry.tendencyHits += 1;
  }

  const entries = [...byParticipant.values()].sort(
    (a, b) => b.points - a.points || b.exact - a.exact || b.diffHits - a.diffHits || a.name.localeCompare(b.name),
  );

  // Plätze vergeben (gleiche Punktzahl ⇒ gleicher Rang).
  let rank = 0;
  let prevKey = '';
  entries.forEach((e, i) => {
    const key = `${e.points}|${e.exact}|${e.diffHits}`;
    if (key !== prevKey) {
      rank = i + 1;
      prevKey = key;
    }
    e.rank = rank;
  });

  return entries;
}

export function getMatches(): Match[] {
  return db.select().from(matches).orderBy(asc(matches.utcDate)).all();
}

export interface MatchTip {
  participantId: number;
  name: string;
  homeGoals: number;
  awayGoals: number;
  points: number | null;
}

export interface MatchDetail {
  match: Match;
  kickedOff: boolean;
  tips: MatchTip[];
}

export function getMatchDetail(id: number): MatchDetail | null {
  const match = db.select().from(matches).where(eq(matches.id, id)).get();
  if (!match) return null;

  const kickedOff = hasKickedOff(match);
  const rows = db
    .select({
      participantId: tips.participantId,
      name: participants.name,
      homeGoals: tips.homeGoals,
      awayGoals: tips.awayGoals,
      points: tips.points,
    })
    .from(tips)
    .innerJoin(participants, eq(tips.participantId, participants.id))
    .where(eq(tips.matchId, id))
    .all();

  rows.sort((a, b) => (b.points ?? -1) - (a.points ?? -1) || a.name.localeCompare(b.name));

  // Tipps erst ab Anpfiff offenlegen.
  return { match, kickedOff, tips: kickedOff ? rows : [] };
}

export interface ParticipantDetail {
  participant: { id: number; name: string };
  totalPoints: number;
  rows: Array<{
    match: Match;
    homeGoals: number | null;
    awayGoals: number | null;
    points: number | null;
  }>;
}

export function getParticipantDetail(id: number): ParticipantDetail | null {
  const participant = db.select().from(participants).where(eq(participants.id, id)).get();
  if (!participant) return null;

  const allMatches = getMatches();
  const personTips = db.select().from(tips).where(eq(tips.participantId, id)).all();
  const tipByMatch = new Map(personTips.map((t) => [t.matchId, t]));

  let totalPoints = 0;
  const rows = allMatches.map((match) => {
    const t = tipByMatch.get(match.id);
    if (t?.points != null) totalPoints += t.points;
    return {
      match,
      homeGoals: t?.homeGoals ?? null,
      awayGoals: t?.awayGoals ?? null,
      points: t?.points ?? null,
    };
  });

  return { participant: { id: participant.id, name: participant.name }, totalPoints, rows };
}

/** Liefert das maßgebliche Ergebnis (inkl. Elfmeter) oder null. */
export function matchResult(m: Match) {
  return effectiveResult(m);
}
