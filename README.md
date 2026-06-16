# WM-Tippspiel 2026 ⚽🏆

Familieninternes Tippspiel zur Fußball-WM 2026. Administratoren tragen die Tipps der Teilnehmer
ein, die App holt die echten Ergebnisse automatisch von [football-data.org](https://www.football-data.org)
und zeigt eine animierte Live-Rangliste.

## Punkteregeln

Pro Spiel (es zählt die höchste zutreffende Stufe):

- **3 Punkte** – genaues Endergebnis (inkl. Verlängerung **und** Elfmeterschießen).
- **2 Punkte** – richtiger Sieger (kein Remis) **und** richtige Tordifferenz.
- **1 Punkt** – richtige Tendenz (richtiger Sieger, oder bei Remis ein Remis getippt).
- **0 Punkte** – sonst.

Bei Elfmeterschießen werden die Elfmetertore zum Endstand addiert (z. B. 1:1 n. V. + 5:3 i. E. ⇒
Endstand **6:4**), und der Tipp wird gegen diesen Endstand gewertet.

## Tech-Stack

Next.js 15 (App Router) · SQLite (Drizzle ORM + better-sqlite3) · Tailwind CSS · framer-motion ·
iron-session · node-cron. Läuft als **ein** Docker-Container, die Datenbank liegt in einem Volume.

## Voraussetzungen

- **Node.js 22 LTS** (lokal). Eine `.node-version` liegt bei.
- Ein kostenloser **football-data.org API-Key**: https://www.football-data.org/client/register

## Lokale Entwicklung

```bash
cp .env.example .env        # Werte eintragen (mind. SESSION_SECRET, ADMIN_PASSWORD)
npm install
npm run db:migrate          # Datenbank anlegen
npm run dev                 # http://localhost:3000
```

Optional Beispieldaten zum Ausprobieren: `npx tsx scripts/seed.ts`
Echte Ergebnisse einmalig abrufen (API-Key nötig): `npm run sync`

Tests: `npm run test`

## Umgebungsvariablen

| Variable | Pflicht | Bedeutung |
| --- | --- | --- |
| `FOOTBALL_DATA_API_KEY` | ✅ | API-Key von football-data.org |
| `ADMIN_PASSWORD` | ✅ | Passwort für den Admin-Login |
| `SESSION_SECRET` | ✅ | ≥ 32 Zeichen, signiert die Session-Cookies |
| `FOOTBALL_DATA_COMPETITION` | – | Wettbewerbs-Code (Default `WC` = WM) |
| `SYNC_CRON` | – | Abruf-Intervall, Cron-Syntax (Default `*/2 * * * *`) |
| `ENABLE_SYNC` | – | Hintergrund-Poller aktivieren (`true`/`false`) |
| `DATABASE_PATH` | – | Pfad zur SQLite-Datei (im Container `/data/wmtipper.db`) |
| `TZ` | – | Zeitzone für die Anzeige (Default `Europe/Berlin`) |

## Deployment auf TrueNAS Scale

1. Repository auf den Server kopieren.
2. `.env` mit den Pflichtwerten anlegen (siehe oben).
3. Container bauen und starten:
   ```bash
   docker compose up -d --build
   ```
4. Die App läuft auf Port **3000**. Migrationen und der Ergebnis-Poller starten automatisch.

**Persistenz:** Das benannte Volume `wmtipper-data` (gemountet auf `/data`) hält die SQLite-Datenbank.
Auf TrueNAS empfiehlt sich, statt des benannten Volumes einen Host-Pfad bzw. ein Dataset zu mappen,
z. B. in `docker-compose.yml`:

```yaml
    volumes:
      - /mnt/pool/apps/wmtipper:/data
```

Alternativ als „Custom App" (YAML) in der TrueNAS-Oberfläche mit demselben Image, Port und Volume.

## Bedienung

- **Öffentlich:** Rangliste (`/`), Spiele (`/spiele`), Spiel-Detail, Teilnehmer-Detail.
  Tipps werden erst ab Anpfiff sichtbar.
- **Admin** (`/admin`, Login mit `ADMIN_PASSWORD`):
  - Teilnehmer verwalten
  - Tipps eintragen (pro Spiel für alle Teilnehmer)
  - Ergebnisse manuell setzen/überschreiben (Fallback, falls die API verzögert)
  - „Jetzt synchronisieren" für einen sofortigen Abruf
# wmtipper1245
