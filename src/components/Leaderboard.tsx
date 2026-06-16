'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import useSWR from 'swr';
import type { LeaderboardEntry } from '@/lib/queries';

interface LiveMatch {
  id: number;
  home: string;
  away: string;
  homeCode: string | null;
  awayCode: string | null;
  ftHome: number | null;
  ftAway: number | null;
  status: string;
}

interface LeaderboardData {
  entries: LeaderboardEntry[];
  lastSyncAt: string | null;
  live: LiveMatch[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const MEDALS = ['🥇', '🥈', '🥉'];

function fireConfetti() {
  import('canvas-confetti').then(({ default: confetti }) => {
    confetti({ particleCount: 120, spread: 75, origin: { y: 0.3 }, colors: ['#fbbf24', '#16a34a', '#ffffff'] });
  });
}

export default function Leaderboard({ initial }: { initial: LeaderboardData }) {
  const { data } = useSWR<LeaderboardData>('/api/leaderboard', fetcher, {
    fallbackData: initial,
    refreshInterval: 30_000,
  });

  const entries = data?.entries ?? [];
  const live = data?.live ?? [];
  const prevLeader = useRef<number | null>(entries[0]?.id ?? null);

  useEffect(() => {
    const leader = entries[0]?.id ?? null;
    if (leader != null && prevLeader.current != null && leader !== prevLeader.current) {
      fireConfetti();
    }
    prevLeader.current = leader;
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="card p-8 text-center text-white/70">
        Noch keine Teilnehmer. Lege im{' '}
        <Link href="/admin" className="text-gold-400 underline">
          Admin-Bereich
        </Link>{' '}
        welche an.
      </div>
    );
  }

  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="space-y-6">
      {live.length > 0 && (
        <div className="card border-red-400/30 bg-red-500/10 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-red-300">
            <span className="h-2 w-2 animate-pulse-live rounded-full bg-red-400" /> LIVE
          </div>
          <div className="flex flex-wrap gap-3">
            {live.map((m) => (
              <Link
                key={m.id}
                href={`/spiele/${m.id}`}
                className="rounded-lg bg-black/20 px-3 py-1.5 text-sm hover:bg-black/30"
              >
                <span className="font-medium">{m.homeCode ?? m.home}</span>{' '}
                <span className="font-bold text-gold-400">
                  {m.ftHome ?? 0}:{m.ftAway ?? 0}
                </span>{' '}
                <span className="font-medium">{m.awayCode ?? m.away}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Podium */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 0, 2].map((slot) => {
          const e = podium[slot];
          if (!e) return <div key={slot} />;
          // indexiert nach Platz (slot): Gold am höchsten, dann Silber, dann Bronze
          const heights = ['h-36', 'h-28', 'h-24'];
          return (
            <motion.div key={e.id} layout className="flex flex-col items-center justify-end">
              <Link href={`/teilnehmer/${e.id}`} className="flex w-full flex-col items-center">
                <div className="mb-1 text-3xl">{MEDALS[slot]}</div>
                <div className="mb-1 max-w-full truncate px-1 text-center text-sm font-semibold">
                  {e.name}
                </div>
                <div
                  className={`flex w-full flex-col items-center justify-center rounded-t-xl bg-gradient-to-b from-gold-400/80 to-gold-600/40 ${heights[slot]}`}
                >
                  <div className="font-display text-3xl font-bold text-pitch-950">{e.points}</div>
                  <div className="text-xs font-semibold text-pitch-900">Punkte</div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Restliche Plätze */}
      <div className="card divide-y divide-white/10 overflow-hidden">
        <AnimatePresence initial={false}>
          {rest.map((e) => (
            <motion.div
              key={e.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, type: 'spring' }}
            >
              <Link
                href={`/teilnehmer/${e.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/5"
              >
                <span className="w-7 text-center font-display text-lg font-bold text-white/50">
                  {e.rank}
                </span>
                <span className="flex-1 truncate font-medium">{e.name}</span>
                <span className="hidden gap-1 text-xs text-white/50 sm:flex">
                  <span title="genaue Ergebnisse">🎯 {e.exact}</span>
                  <span title="richtige Tordifferenz">±{e.diffHits}</span>
                  <span title="richtige Tendenz">✓ {e.tendencyHits}</span>
                </span>
                <span className="w-12 text-right font-display text-xl font-bold text-gold-400">
                  {e.points}
                </span>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {data?.lastSyncAt && (
        <p className="text-center text-xs text-white/40">
          Zuletzt aktualisiert:{' '}
          {new Intl.DateTimeFormat('de-DE', {
            dateStyle: 'short',
            timeStyle: 'short',
          }).format(new Date(data.lastSyncAt))}
        </p>
      )}
    </div>
  );
}
