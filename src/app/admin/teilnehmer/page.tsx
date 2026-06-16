import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { participants } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';
import { addParticipant, deleteParticipant, renameParticipant } from '../actions';

export const dynamic = 'force-dynamic';

export default async function TeilnehmerPage() {
  if (!(await isAdmin())) redirect('/admin/login');

  const people = db.select().from(participants).orderBy(asc(participants.name)).all();

  return (
    <div className="space-y-5">
      <form action={addParticipant} className="card flex gap-2 p-4">
        <input name="name" placeholder="Name des Teilnehmers" required className="input flex-1" />
        <button className="btn-gold">Hinzufügen</button>
      </form>

      <div className="card divide-y divide-white/10 overflow-hidden">
        {people.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-white/60">Noch keine Teilnehmer.</p>
        )}
        {people.map((p) => (
          <div key={p.id} className="flex items-center gap-2 px-4 py-3">
            <form action={renameParticipant} className="flex flex-1 gap-2">
              <input type="hidden" name="id" value={p.id} />
              <input name="name" defaultValue={p.name} className="input flex-1" />
              <button className="btn-ghost text-sm">Speichern</button>
            </form>
            <form action={deleteParticipant}>
              <input type="hidden" name="id" value={p.id} />
              <button className="btn-ghost text-sm text-red-300 hover:bg-red-500/20">Löschen</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
