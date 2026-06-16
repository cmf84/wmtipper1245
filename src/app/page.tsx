import Leaderboard from '@/components/Leaderboard';
import { getLastSyncAt } from '@/lib/footballData';
import { getLeaderboard, getMatches, isLive } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const entries = getLeaderboard();
  const live = getMatches()
    .filter(isLive)
    .map((m) => ({
      id: m.id,
      home: m.homeTeamName,
      away: m.awayTeamName,
      homeCode: m.homeTeamCode,
      awayCode: m.awayTeamCode,
      ftHome: m.ftHome,
      ftAway: m.ftAway,
      status: m.status,
    }));

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">
        Rangliste <span className="text-gold-400">🏆</span>
      </h1>
      <Leaderboard initial={{ entries, live, lastSyncAt: getLastSyncAt() }} />
    </div>
  );
}
