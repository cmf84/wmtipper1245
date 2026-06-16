/**
 * Manueller Sync von der Kommandozeile: `npm run sync`
 * Lädt .env (falls vorhanden) und ruft syncMatches() auf.
 */
import { existsSync, readFileSync } from 'node:fs';

function loadEnv(file = '.env') {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnv();

const { syncMatches } = await import('../src/lib/footballData');

syncMatches()
  .then((r) => {
    console.log('[sync] fertig:', r);
    process.exit(0);
  })
  .catch((err) => {
    console.error('[sync] Fehler:', err.message);
    process.exit(1);
  });
