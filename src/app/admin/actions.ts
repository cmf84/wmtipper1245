'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { matches, participants, tips } from '@/lib/db/schema';
import { checkPassword, getSession, isAdmin } from '@/lib/auth';
import { recomputeAllPoints } from '@/lib/points';
import { syncMatches } from '@/lib/footballData';
import { tendency } from '@/lib/scoring';

async function assertAdmin() {
  if (!(await isAdmin())) throw new Error('Nicht autorisiert.');
}

export async function login(formData: FormData) {
  const password = String(formData.get('password') ?? '');
  if (!checkPassword(password)) {
    redirect('/admin/login?error=1');
  }
  const session = await getSession();
  session.isAdmin = true;
  await session.save();
  redirect('/admin');
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect('/');
}

export async function syncNow() {
  await assertAdmin();
  await syncMatches();
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/spiele');
}

export async function addParticipant(formData: FormData) {
  await assertAdmin();
  const name = String(formData.get('name') ?? '').trim();
  if (name) {
    db.insert(participants).values({ name }).run();
    revalidatePath('/admin/teilnehmer');
    revalidatePath('/');
  }
}

export async function renameParticipant(formData: FormData) {
  await assertAdmin();
  const id = Number(formData.get('id'));
  const name = String(formData.get('name') ?? '').trim();
  if (id && name) {
    db.update(participants).set({ name }).where(eq(participants.id, id)).run();
    revalidatePath('/admin/teilnehmer');
    revalidatePath('/');
  }
}

export async function deleteParticipant(formData: FormData) {
  await assertAdmin();
  const id = Number(formData.get('id'));
  if (id) {
    db.delete(participants).where(eq(participants.id, id)).run();
    revalidatePath('/admin/teilnehmer');
    revalidatePath('/');
  }
}

/**
 * Speichert die Tipps aller Teilnehmer für ein Spiel.
 * Felder: tip_<participantId>_home / tip_<participantId>_away.
 * Leere Felder löschen einen evtl. vorhandenen Tipp.
 */
export async function saveTips(formData: FormData) {
  await assertAdmin();
  const matchId = Number(formData.get('matchId'));
  if (!matchId) return;

  const people = db.select({ id: participants.id }).from(participants).all();

  db.transaction((tx) => {
    for (const p of people) {
      const rawHome = formData.get(`tip_${p.id}_home`);
      const rawAway = formData.get(`tip_${p.id}_away`);
      const homeStr = rawHome == null ? '' : String(rawHome).trim();
      const awayStr = rawAway == null ? '' : String(rawAway).trim();

      if (homeStr === '' || awayStr === '') {
        tx.delete(tips)
          .where(and(eq(tips.participantId, p.id), eq(tips.matchId, matchId)))
          .run();
        continue;
      }

      const home = Math.max(0, Math.trunc(Number(homeStr)));
      const away = Math.max(0, Math.trunc(Number(awayStr)));
      if (Number.isNaN(home) || Number.isNaN(away)) continue;

      tx.insert(tips)
        .values({ participantId: p.id, matchId, homeGoals: home, awayGoals: away })
        .onConflictDoUpdate({
          target: [tips.participantId, tips.matchId],
          set: { homeGoals: home, awayGoals: away, updatedAt: new Date().toISOString() },
        })
        .run();
    }
  });

  recomputeAllPoints();
  revalidatePath('/admin/tipps');
  revalidatePath('/');
  revalidatePath(`/spiele/${matchId}`);
}

/**
 * Manuelles Ergebnis-Override für ein Spiel.
 * Felder: matchId, ftHome, ftAway, optional penHome/penAway, duration, clear (=Override entfernen).
 */
export async function saveOverride(formData: FormData) {
  await assertAdmin();
  const matchId = Number(formData.get('matchId'));
  if (!matchId) return;

  if (formData.get('clear')) {
    db.update(matches).set({ manualOverride: false }).where(eq(matches.id, matchId)).run();
    recomputeAllPoints();
    revalidatePath('/');
    revalidatePath('/admin/ergebnisse');
    return;
  }

  const ftHome = Math.max(0, Math.trunc(Number(formData.get('ftHome'))));
  const ftAway = Math.max(0, Math.trunc(Number(formData.get('ftAway'))));
  if (Number.isNaN(ftHome) || Number.isNaN(ftAway)) return;

  const penHomeRaw = String(formData.get('penHome') ?? '').trim();
  const penAwayRaw = String(formData.get('penAway') ?? '').trim();
  const hasPens = penHomeRaw !== '' && penAwayRaw !== '';
  const penHome = hasPens ? Math.max(0, Math.trunc(Number(penHomeRaw))) : null;
  const penAway = hasPens ? Math.max(0, Math.trunc(Number(penAwayRaw))) : null;

  const duration = hasPens
    ? 'PENALTY_SHOOTOUT'
    : String(formData.get('duration') ?? 'REGULAR') || 'REGULAR';

  // Sieger inkl. Elfmeter bestimmen.
  const effHome = ftHome + (penHome ?? 0);
  const effAway = ftAway + (penAway ?? 0);
  const t = tendency(effHome, effAway);
  const winner = t === 'HOME' ? 'HOME_TEAM' : t === 'AWAY' ? 'AWAY_TEAM' : 'DRAW';

  db.update(matches)
    .set({
      ftHome,
      ftAway,
      penHome,
      penAway,
      duration,
      winner,
      status: 'FINISHED',
      manualOverride: true,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(matches.id, matchId))
    .run();

  recomputeAllPoints();
  revalidatePath('/');
  revalidatePath('/admin/ergebnisse');
  revalidatePath(`/spiele/${matchId}`);
}
