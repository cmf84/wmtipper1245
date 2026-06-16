/** Punkte-Neuberechnung für alle Tipps anhand der aktuellen Spielergebnisse. */
import { eq } from 'drizzle-orm';
import { db } from './db';
import { matches, tips } from './db/schema';
import { effectiveResult, computePoints } from './scoring';

/**
 * Berechnet die Punkte aller Tipps neu und schreibt sie nach tips.points.
 * Tipps zu Spielen ohne Ergebnis bekommen points = null.
 * Gibt die Anzahl der Spiele mit verfügbarem Ergebnis zurück.
 */
export function recomputeAllPoints(): number {
  const allMatches = db.select().from(matches).all();
  const allTips = db.select().from(tips).all();

  const resultByMatch = new Map<number, ReturnType<typeof effectiveResult>>();
  let scoredMatches = 0;
  for (const m of allMatches) {
    const r = effectiveResult(m);
    resultByMatch.set(m.id, r);
    if (r) scoredMatches++;
  }

  db.transaction((tx) => {
    for (const tip of allTips) {
      const result = resultByMatch.get(tip.matchId) ?? null;
      const points = result ? computePoints(tip.homeGoals, tip.awayGoals, result) : null;
      if (points !== tip.points) {
        tx.update(tips).set({ points }).where(eq(tips.id, tip.id)).run();
      }
    }
  });

  return scoredMatches;
}
