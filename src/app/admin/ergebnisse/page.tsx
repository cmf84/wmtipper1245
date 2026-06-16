import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { formatKickoff, stageLabel } from '@/lib/format';
import { getMatches } from '@/lib/queries';
import { saveOverride } from '../actions';

export const dynamic = 'force-dynamic';

export default async function ErgebnissePage() {
  if (!(await isAdmin())) redirect('/admin/login');
  const matches = getMatches();

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/60">
        Manuelle Ergebnisse überschreiben den automatischen Abruf für das jeweilige Spiel. Für
        Elfmeterschießen die Elfmeter-Felder ausfüllen – der Endstand zur Wertung enthält dann die
        Elfmetertore.
      </p>

      {matches.map((m) => (
        <form
          key={m.id}
          action={saveOverride}
          className="card flex flex-wrap items-center gap-3 p-4"
        >
          <input type="hidden" name="matchId" value={m.id} />
          <div className="min-w-[200px] flex-1">
            <div className="font-medium">
              {m.homeTeamName} <span className="text-white/40">–</span> {m.awayTeamName}
            </div>
            <div className="text-xs text-white/50">
              {stageLabel(m.stage, m.group)} · {formatKickoff(m.utcDate)}
              {m.manualOverride && <span className="ml-2 text-gold-400">· manuell</span>}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              name="ftHome"
              defaultValue={m.ftHome ?? ''}
              placeholder="–"
              className="input w-14 text-center"
            />
            <span className="text-white/40">:</span>
            <input
              type="number"
              min={0}
              name="ftAway"
              defaultValue={m.ftAway ?? ''}
              placeholder="–"
              className="input w-14 text-center"
            />
          </div>

          <div className="flex items-center gap-1 text-xs text-white/50">
            i.E.
            <input
              type="number"
              min={0}
              name="penHome"
              defaultValue={m.penHome ?? ''}
              placeholder="–"
              className="input w-12 text-center"
            />
            <span>:</span>
            <input
              type="number"
              min={0}
              name="penAway"
              defaultValue={m.penAway ?? ''}
              placeholder="–"
              className="input w-12 text-center"
            />
          </div>

          <button className="btn-gold text-sm">Setzen</button>
          {m.manualOverride && (
            <button name="clear" value="1" className="btn-ghost text-sm text-white/70">
              Override entfernen
            </button>
          )}
        </form>
      ))}
    </div>
  );
}
