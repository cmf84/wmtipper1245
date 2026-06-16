/**
 * Eigenständiger Migrations-Runner (nur better-sqlite3, kein drizzle-orm/tsx).
 * Wird in der Entwicklung via `npm run db:migrate` und im Container vor dem Serverstart ausgeführt.
 * Wendet die von drizzle-kit generierten SQL-Dateien aus ./drizzle der Reihe nach an.
 */
import Database from 'better-sqlite3';
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

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

const dbPath = process.env.DATABASE_PATH ?? './data/wmtipper.db';
const dir = dirname(dbPath);
if (dir && dir !== '.' && !existsSync(dir)) mkdirSync(dir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.exec('CREATE TABLE IF NOT EXISTS __migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');

const migDir = './drizzle';
const files = existsSync(migDir)
  ? readdirSync(migDir).filter((f) => f.endsWith('.sql')).sort()
  : [];
const applied = new Set(db.prepare('SELECT name FROM __migrations').all().map((r) => r.name));

let count = 0;
for (const file of files) {
  if (applied.has(file)) continue;
  const sql = readFileSync(join(migDir, file), 'utf8');
  const statements = sql
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter(Boolean);
  const tx = db.transaction(() => {
    for (const stmt of statements) db.exec(stmt);
    db.prepare('INSERT INTO __migrations (name, applied_at) VALUES (?, ?)').run(
      file,
      new Date().toISOString(),
    );
  });
  tx();
  count++;
  console.log('[migrate] angewendet:', file);
}

db.close();
console.log(`[migrate] fertig (${count} neue Migration(en)) → ${dbPath}`);
