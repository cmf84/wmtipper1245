import { describe, expect, it } from 'vitest';
import { computePoints, effectiveResult, scoreTip, tendency } from './scoring';

const base = { ftHome: null, ftAway: null, duration: null, penHome: null, penAway: null };

describe('tendency', () => {
  it('erkennt Heimsieg, Auswärtssieg und Remis', () => {
    expect(tendency(2, 1)).toBe('HOME');
    expect(tendency(1, 2)).toBe('AWAY');
    expect(tendency(1, 1)).toBe('DRAW');
  });
});

describe('computePoints – reguläre Spiele', () => {
  it('3 Punkte für exaktes Ergebnis', () => {
    expect(computePoints(2, 1, { home: 2, away: 1 })).toBe(3);
  });
  it('3 Punkte für exaktes Remis', () => {
    expect(computePoints(1, 1, { home: 1, away: 1 })).toBe(3);
  });
  it('2 Punkte für richtigen Sieger + richtige Tordifferenz', () => {
    expect(computePoints(2, 0, { home: 3, away: 1 })).toBe(2);
  });
  it('1 Punkt für richtige Tendenz (Sieger korrekt, Tordifferenz falsch)', () => {
    expect(computePoints(1, 0, { home: 3, away: 1 })).toBe(1);
  });
  it('1 Punkt für Remis getippt und Remis (anderer Stand)', () => {
    expect(computePoints(0, 0, { home: 2, away: 2 })).toBe(1);
  });
  it('kein 2-Punkte für Remis trotz gleicher (Null-)Tordifferenz', () => {
    expect(computePoints(0, 0, { home: 2, away: 2 })).toBe(1);
  });
  it('0 Punkte für falsche Tendenz', () => {
    expect(computePoints(0, 1, { home: 2, away: 0 })).toBe(0);
  });
});

describe('effectiveResult', () => {
  it('liefert null ohne Ergebnis', () => {
    expect(effectiveResult(base)).toBeNull();
  });
  it('nutzt fullTime bei regulärer Spielzeit', () => {
    expect(effectiveResult({ ...base, ftHome: 2, ftAway: 1, duration: 'REGULAR' })).toEqual({
      home: 2,
      away: 1,
    });
  });
  it('nutzt fullTime bei Verlängerung (Tore bereits enthalten)', () => {
    expect(effectiveResult({ ...base, ftHome: 2, ftAway: 1, duration: 'EXTRA_TIME' })).toEqual({
      home: 2,
      away: 1,
    });
  });
  it('addiert Elfmetertore zum Endstand', () => {
    expect(
      effectiveResult({
        ftHome: 1,
        ftAway: 1,
        duration: 'PENALTY_SHOOTOUT',
        penHome: 5,
        penAway: 3,
      }),
    ).toEqual({ home: 6, away: 4 });
  });
});

describe('scoreTip – Elfmeterschießen (Endstand inkl. Elfmeter)', () => {
  const shootout = {
    ftHome: 1,
    ftAway: 1,
    duration: 'PENALTY_SHOOTOUT',
    penHome: 5,
    penAway: 3,
  }; // Endstand 6:4

  it('Tipp 6:4 → 3 Punkte (exakter Endstand inkl. Elfmeter)', () => {
    expect(scoreTip(6, 4, shootout)).toBe(3);
  });
  it('Tipp 2:0 → 2 Punkte (Sieger + Tordifferenz +2)', () => {
    expect(scoreTip(2, 0, shootout)).toBe(2);
  });
  it('Tipp 2:1 → 1 Punkt (Sieger korrekt, Tordifferenz falsch)', () => {
    expect(scoreTip(2, 1, shootout)).toBe(1);
  });
  it('Tipp 1:1 (Remis) → 0 Punkte (Endstand hat einen Sieger)', () => {
    expect(scoreTip(1, 1, shootout)).toBe(0);
  });
});

describe('scoreTip – nicht gewertet', () => {
  it('liefert null ohne Ergebnis', () => {
    expect(scoreTip(2, 1, base)).toBeNull();
  });
});
