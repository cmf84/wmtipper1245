/**
 * Wertungslogik des WM-Tippspiels.
 *
 * Punkteregeln (höchste zutreffende Stufe gewinnt):
 *   3 Punkte – genaues Endergebnis (inkl. Verlängerung UND Elfmeterschießen).
 *   2 Punkte – kein exakter Treffer, aber richtiger Sieger (kein Remis) + richtige Tordifferenz.
 *   1 Punkt  – richtige Tendenz (richtiger Sieger, oder bei Remis ein Remis getippt).
 *   0 Punkte – sonst.
 *
 * Maßgeblicher Endstand: bei Elfmeterschießen werden die Elfmetertore zum fullTime-Stand
 * addiert (z.B. 1:1 n.V. + 5:3 i.E. ⇒ Endstand 6:4). Bei Verlängerung sind die Tore bereits
 * in fullTime enthalten.
 */

export type Tendency = 'HOME' | 'AWAY' | 'DRAW';

export interface MatchResult {
  home: number;
  away: number;
}

/** Felder, die zur Ergebnisermittlung nötig sind (Teilmenge der Match-Tabelle). */
export interface ScorableMatch {
  ftHome: number | null;
  ftAway: number | null;
  duration: string | null;
  penHome: number | null;
  penAway: number | null;
}

export function tendency(home: number, away: number): Tendency {
  if (home > away) return 'HOME';
  if (home < away) return 'AWAY';
  return 'DRAW';
}

/**
 * Ermittelt den maßgeblichen Endstand inkl. Elfmeterschießen.
 * Gibt null zurück, wenn (noch) kein Ergebnis vorliegt.
 */
export function effectiveResult(m: ScorableMatch): MatchResult | null {
  if (m.ftHome == null || m.ftAway == null) return null;
  if (m.duration === 'PENALTY_SHOOTOUT') {
    return { home: m.ftHome + (m.penHome ?? 0), away: m.ftAway + (m.penAway ?? 0) };
  }
  return { home: m.ftHome, away: m.ftAway };
}

/** Berechnet die Punkte für einen Tipp gegen einen feststehenden Endstand. */
export function computePoints(tipHome: number, tipAway: number, result: MatchResult): 0 | 1 | 2 | 3 {
  const { home: ah, away: aw } = result;

  // 3 Punkte: exakter Endstand.
  if (tipHome === ah && tipAway === aw) return 3;

  const tw = tendency(tipHome, tipAway);
  const rw = tendency(ah, aw);

  // Falsche Tendenz ⇒ keine Punkte.
  if (tw !== rw) return 0;

  // 2 Punkte: richtiger Sieger (kein Remis) + richtige Tordifferenz.
  if (rw !== 'DRAW' && tipHome - tipAway === ah - aw) return 2;

  // 1 Punkt: richtige Tendenz.
  return 1;
}

/**
 * Bequeme Gesamtfunktion: Punkte für einen Tipp gegen ein Match.
 * Gibt null zurück, wenn das Match noch kein Ergebnis hat.
 */
export function scoreTip(tipHome: number, tipAway: number, match: ScorableMatch): number | null {
  const result = effectiveResult(match);
  if (!result) return null;
  return computePoints(tipHome, tipAway, result);
}
