import { NextResponse } from 'next/server';
import { getLeaderboard, getMatches, isLive } from '@/lib/queries';
import { getLastSyncAt } from '@/lib/footballData';

export const dynamic = 'force-dynamic';

export function GET() {
  const entries = getLeaderboard();
  const matches = getMatches();
  const liveMatches = matches.filter(isLive);

  return NextResponse.json({
    entries,
    lastSyncAt: getLastSyncAt(),
    live: liveMatches.map((m) => ({
      id: m.id,
      home: m.homeTeamName,
      away: m.awayTeamName,
      homeCode: m.homeTeamCode,
      awayCode: m.awayTeamCode,
      ftHome: m.ftHome,
      ftAway: m.ftAway,
      status: m.status,
    })),
  });
}
