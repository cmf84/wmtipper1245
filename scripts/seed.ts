/**
 * Befüllt die DB mit Beispieldaten zum lokalen Testen: `npm run sync` ersetzt das später durch echte Daten.
 * Aufruf: npx tsx scripts/seed.ts
 */
import { existsSync, readFileSync } from 'node:fs';

function loadEnv(file = '.env') {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(k in process.env)) process.env[k] = v;
  }
}
loadEnv();

const { db } = await import('../src/lib/db');
const { matches, participants, tips } = await import('../src/lib/db/schema');
const { recomputeAllPoints } = await import('../src/lib/points');

// aufräumen
db.delete(tips).run();
db.delete(participants).run();
db.delete(matches).run();

const now = Date.now();
const h = 3600_000;

db.insert(matches)
  .values([
    {
      id: 1,
      utcDate: new Date(now - 48 * h).toISOString(),
      status: 'FINISHED',
      stage: 'GROUP_STAGE',
      group: 'GROUP_A',
      homeTeamName: 'Deutschland',
      homeTeamCode: 'GER',
      awayTeamName: 'Brasilien',
      awayTeamCode: 'BRA',
      ftHome: 3,
      ftAway: 1,
      winner: 'HOME_TEAM',
      duration: 'REGULAR',
    },
    {
      id: 2,
      utcDate: new Date(now - 24 * h).toISOString(),
      status: 'FINISHED',
      stage: 'LAST_16',
      group: null,
      homeTeamName: 'Spanien',
      homeTeamCode: 'ESP',
      awayTeamName: 'Frankreich',
      awayTeamCode: 'FRA',
      ftHome: 1,
      ftAway: 1,
      penHome: 5,
      penAway: 3,
      winner: 'HOME_TEAM',
      duration: 'PENALTY_SHOOTOUT',
    },
    {
      id: 3,
      utcDate: new Date(now - 1 * h).toISOString(),
      status: 'IN_PLAY',
      stage: 'GROUP_STAGE',
      group: 'GROUP_B',
      homeTeamName: 'Argentinien',
      homeTeamCode: 'ARG',
      awayTeamName: 'England',
      awayTeamCode: 'ENG',
      ftHome: 2,
      ftAway: 0,
      winner: 'HOME_TEAM',
      duration: 'REGULAR',
    },
    {
      id: 4,
      utcDate: new Date(now + 24 * h).toISOString(),
      status: 'SCHEDULED',
      stage: 'GROUP_STAGE',
      group: 'GROUP_C',
      homeTeamName: 'Portugal',
      homeTeamCode: 'POR',
      awayTeamName: 'Niederlande',
      awayTeamCode: 'NED',
    },
  ])
  .run();

const names = ['Oma Erna', 'Papa Klaus', 'Lena', 'Onkel Bob'];
db.insert(participants)
  .values(names.map((name) => ({ name })))
  .run();
const people = db.select().from(participants).all();

// Tipps: [matchId, home, away] je Person
const tipData: Record<string, Array<[number, number, number]>> = {
  'Oma Erna': [
    [1, 3, 1], // exakt -> 3
    [2, 6, 4], // exakt (inkl. Elfmeter) -> 3
    [3, 1, 0], // live: Tendenz Heim, Diff falsch -> 1
  ],
  'Papa Klaus': [
    [1, 2, 0], // Sieger + Diff -> 2
    [2, 2, 0], // Sieger + Diff (Endstand 6:4) -> 2
    [3, 2, 0], // exakt live -> 3
  ],
  Lena: [
    [1, 1, 0], // Tendenz -> 1
    [2, 1, 1], // Remis getippt, Endstand hat Sieger -> 0
    [3, 0, 1], // falsch -> 0
  ],
  'Onkel Bob': [
    [1, 0, 2], // falsch -> 0
    [2, 3, 0], // Sieger, Diff falsch -> 1
    [4, 1, 1], // zukünftiges Spiel
  ],
};

const idByName = new Map(people.map((p) => [p.name, p.id]));
const rows = Object.entries(tipData).flatMap(([name, list]) =>
  list.map(([matchId, homeGoals, awayGoals]) => ({
    participantId: idByName.get(name)!,
    matchId,
    homeGoals,
    awayGoals,
  })),
);
db.insert(tips).values(rows).run();

const scored = recomputeAllPoints();
console.log(`[seed] ${people.length} Teilnehmer, ${rows.length} Tipps, ${scored} gewertete Spiele.`);
process.exit(0);
