import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

/**
 * Spiele der WM. `id` ist die football-data.org Match-ID.
 * `ftHome`/`ftAway` entsprechen score.fullTime (inkl. Verlängerung, OHNE Elfmeter).
 * `penHome`/`penAway` sind die Elfmetertore (nur bei PENALTY_SHOOTOUT gesetzt).
 * `winner` stammt aus score.winner und berücksichtigt das Elfmeterschießen.
 */
export const matches = sqliteTable('matches', {
  id: integer('id').primaryKey(),
  utcDate: text('utc_date').notNull(),
  status: text('status').notNull(), // SCHEDULED | TIMED | IN_PLAY | PAUSED | FINISHED | ...
  stage: text('stage'), // GROUP_STAGE | LAST_16 | ...
  group: text('group_name'),
  matchday: integer('matchday'),
  homeTeamName: text('home_team_name').notNull(),
  homeTeamCode: text('home_team_code'), // 3-Letter / TLA (z.B. GER)
  homeTeamCrest: text('home_team_crest'),
  awayTeamName: text('away_team_name').notNull(),
  awayTeamCode: text('away_team_code'),
  awayTeamCrest: text('away_team_crest'),
  ftHome: integer('ft_home'),
  ftAway: integer('ft_away'),
  winner: text('winner'), // HOME_TEAM | AWAY_TEAM | DRAW | null
  duration: text('duration'), // REGULAR | EXTRA_TIME | PENALTY_SHOOTOUT
  penHome: integer('pen_home'),
  penAway: integer('pen_away'),
  manualOverride: integer('manual_override', { mode: 'boolean' }).notNull().default(false),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export const participants = sqliteTable('participants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export const tips = sqliteTable(
  'tips',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    participantId: integer('participant_id')
      .notNull()
      .references(() => participants.id, { onDelete: 'cascade' }),
    matchId: integer('match_id')
      .notNull()
      .references(() => matches.id, { onDelete: 'cascade' }),
    homeGoals: integer('home_goals').notNull(),
    awayGoals: integer('away_goals').notNull(),
    points: integer('points'), // gecachte Punkte, null = noch nicht gewertet
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
  },
  (t) => ({
    uniqParticipantMatch: uniqueIndex('uniq_participant_match').on(t.participantId, t.matchId),
  }),
);

/** Einfacher Key/Value-Speicher für Metadaten (z.B. letzter Sync-Zeitpunkt). */
export const meta = sqliteTable('meta', {
  key: text('key').primaryKey(),
  value: text('value'),
});

export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
export type Participant = typeof participants.$inferSelect;
export type Tip = typeof tips.$inferSelect;
export type NewTip = typeof tips.$inferInsert;
