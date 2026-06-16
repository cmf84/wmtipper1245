/**
 * Client für die football-data.org REST API (v4) und Sync in die lokale DB.
 * Doku: https://docs.football-data.org/general/v4/match.html
 */
import { eq } from 'drizzle-orm';
import { db } from './db';
import { matches, meta, type NewMatch } from './db/schema';
import { recomputeAllPoints } from './points';

const API_BASE = 'https://api.football-data.org/v4';

interface FdScorePart {
  home: number | null;
  away: number | null;
}

interface FdMatch {
  id: number;
  utcDate: string;
  status: string;
  stage: string | null;
  group: string | null;
  matchday: number | null;
  homeTeam: { id: number | null; name: string | null; tla: string | null; crest: string | null };
  awayTeam: { id: number | null; name: string | null; tla: string | null; crest: string | null };
  score: {
    winner: string | null;
    duration: string | null;
    fullTime: FdScorePart;
    halfTime: FdScorePart;
    regularTime?: FdScorePart;
    extraTime?: FdScorePart;
    penalties?: FdScorePart;
  };
}

interface FdMatchesResponse {
  matches: FdMatch[];
}

function competition(): string {
  return process.env.FOOTBALL_DATA_COMPETITION ?? 'WC';
}

function apiKey(): string {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) throw new Error('FOOTBALL_DATA_API_KEY ist nicht gesetzt.');
  return key;
}

/** Holt alle Spiele des Wettbewerbs von football-data.org. */
export async function fetchMatches(): Promise<FdMatch[]> {
  const res = await fetch(`${API_BASE}/competitions/${competition()}/matches`, {
    headers: { 'X-Auth-Token': apiKey() },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`football-data.org Fehler ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as FdMatchesResponse;
  return data.matches ?? [];
}

/** Mappt eine API-Antwort auf eine Zeile unserer matches-Tabelle. */
function mapMatch(m: FdMatch): NewMatch {
  const pen = m.score.penalties;
  return {
    id: m.id,
    utcDate: m.utcDate,
    status: m.status,
    stage: m.stage ?? null,
    group: m.group ?? null,
    matchday: m.matchday ?? null,
    homeTeamName: m.homeTeam?.name ?? 'TBD',
    homeTeamCode: m.homeTeam?.tla ?? null,
    homeTeamCrest: m.homeTeam?.crest ?? null,
    awayTeamName: m.awayTeam?.name ?? 'TBD',
    awayTeamCode: m.awayTeam?.tla ?? null,
    awayTeamCrest: m.awayTeam?.crest ?? null,
    ftHome: m.score.fullTime?.home ?? null,
    ftAway: m.score.fullTime?.away ?? null,
    winner: m.score.winner ?? null,
    duration: m.score.duration ?? null,
    penHome: pen?.home ?? null,
    penAway: pen?.away ?? null,
    updatedAt: new Date().toISOString(),
  };
}

export interface SyncResult {
  fetched: number;
  upserted: number;
  skippedManual: number;
  scoredMatches: number;
}

/**
 * Synchronisiert die Spiele von der API in die DB und berechnet anschließend die Punkte neu.
 * Spiele mit manuellem Override werden nicht überschrieben.
 */
export async function syncMatches(): Promise<SyncResult> {
  const apiMatches = await fetchMatches();

  const overridden = new Set(
    db
      .select({ id: matches.id })
      .from(matches)
      .where(eq(matches.manualOverride, true))
      .all()
      .map((r) => r.id),
  );

  let upserted = 0;
  let skippedManual = 0;
  const rows = apiMatches.map(mapMatch);

  db.transaction((tx) => {
    for (const row of rows) {
      if (overridden.has(row.id!)) {
        skippedManual++;
        continue;
      }
      tx.insert(matches)
        .values(row)
        .onConflictDoUpdate({
          target: matches.id,
          set: {
            utcDate: row.utcDate,
            status: row.status,
            stage: row.stage,
            group: row.group,
            matchday: row.matchday,
            homeTeamName: row.homeTeamName,
            homeTeamCode: row.homeTeamCode,
            homeTeamCrest: row.homeTeamCrest,
            awayTeamName: row.awayTeamName,
            awayTeamCode: row.awayTeamCode,
            awayTeamCrest: row.awayTeamCrest,
            ftHome: row.ftHome,
            ftAway: row.ftAway,
            winner: row.winner,
            duration: row.duration,
            penHome: row.penHome,
            penAway: row.penAway,
            updatedAt: row.updatedAt,
          },
        })
        .run();
      upserted++;
    }
  });

  const scoredMatches = recomputeAllPoints();

  db.insert(meta)
    .values({ key: 'lastSyncAt', value: new Date().toISOString() })
    .onConflictDoUpdate({ target: meta.key, set: { value: new Date().toISOString() } })
    .run();

  return { fetched: apiMatches.length, upserted, skippedManual, scoredMatches };
}

export function getLastSyncAt(): string | null {
  const row = db.select().from(meta).where(eq(meta.key, 'lastSyncAt')).get();
  return row?.value ?? null;
}
