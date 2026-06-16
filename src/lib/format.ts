/** Anzeige-Helfer für Datum, Phasen und Status. */

const TZ = process.env.TZ || 'Europe/Berlin';

export function formatKickoff(utcDate: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ,
  }).format(new Date(utcDate));
}

export function formatDay(utcDate: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    timeZone: TZ,
  }).format(new Date(utcDate));
}

export function dayKey(utcDate: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: TZ,
  }).format(new Date(utcDate));
}

const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE: 'Gruppenphase',
  LEAGUE_STAGE: 'Gruppenphase',
  LAST_32: 'Sechzehntelfinale',
  LAST_16: 'Achtelfinale',
  QUARTER_FINALS: 'Viertelfinale',
  SEMI_FINALS: 'Halbfinale',
  THIRD_PLACE: 'Spiel um Platz 3',
  FINAL: 'Finale',
};

export function stageLabel(stage: string | null, group: string | null): string {
  if (!stage) return group ?? '';
  const base = STAGE_LABELS[stage] ?? stage.replaceAll('_', ' ');
  if (stage === 'GROUP_STAGE' && group) return `${base} · ${group.replace('GROUP_', 'Gruppe ')}`;
  return base;
}

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'geplant',
  TIMED: 'geplant',
  IN_PLAY: 'läuft',
  PAUSED: 'Halbzeit',
  FINISHED: 'beendet',
  SUSPENDED: 'unterbrochen',
  POSTPONED: 'verschoben',
  CANCELLED: 'abgesagt',
  AWARDED: 'gewertet',
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}
