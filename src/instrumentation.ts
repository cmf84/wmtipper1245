/**
 * Wird einmalig beim Serverstart ausgeführt (Next.js Instrumentation Hook).
 * Startet den Cron-Poller, der die Ergebnisse von football-data.org abruft.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  // Hinweis: DB-Migrationen laufen separat über scripts/migrate.mjs (vor dem Serverstart),
  // nicht hier – sonst zöge der drizzle-Migrator (node:crypto) den Instrumentation-Compile lahm.

  if (process.env.ENABLE_SYNC !== 'true') return;
  if (!process.env.FOOTBALL_DATA_API_KEY) {
    console.warn('[sync] FOOTBALL_DATA_API_KEY fehlt – Poller wird nicht gestartet.');
    return;
  }

  const cron = (await import('node-cron')).default;
  const { syncMatches } = await import('@/lib/footballData');

  const expr = process.env.SYNC_CRON || '*/2 * * * *';

  const run = () =>
    syncMatches()
      .then((r) => console.log('[sync]', new Date().toISOString(), r))
      .catch((err) => console.error('[sync] Fehler:', err.message));

  if (!cron.validate(expr)) {
    console.error(`[sync] Ungültiger SYNC_CRON-Ausdruck: ${expr}`);
    return;
  }

  console.log(`[sync] Poller aktiv (${expr}).`);
  // Einmal direkt beim Start synchronisieren, danach nach Zeitplan.
  void run();
  cron.schedule(expr, run);
}
