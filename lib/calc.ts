import type { Team, TeamWithNumbers } from "@/types";

export function calcMagicNumbers(teams: Team[]): TeamWithNumbers[] {
  if (teams.length === 0) return [];

  const sorted = [...teams].sort((a, b) => b.winRate - a.winRate);
  const leader = sorted[0];
  const secondPlace = sorted[1];
  const lastPlace = sorted[sorted.length - 1];
  const ninthPlace = sorted.length >= 2 ? sorted[sorted.length - 2] : null;

  const leaderMagic = secondPlace ? calcMagic(leader, secondPlace) : null;
  const lastTragic = ninthPlace ? calcTragic(lastPlace, ninthPlace) : null;

  return sorted.map((team) => ({
    ...team,
    magicNumber: team.name === leader.name ? leaderMagic : null,
    tragicNumber: team.name === lastPlace.name ? lastTragic : null,
  }));
}

// 공식: 2위 최대승리가능수 - 1위 현재승 + 1
function calcMagic(leader: Team, secondPlace: Team): number | null {
  if (leader.games === 0) return null;
  const magic = secondPlace.wins + secondPlace.remainingGames - leader.wins + 1;
  return magic <= 0 ? 0 : magic;
}

// 공식: 꼴찌 최대승리가능수 - 9위 현재승 + 1
function calcTragic(lastPlace: Team, ninthPlace: Team): number | null {
  if (lastPlace.games === 0) return null;
  const tragic = lastPlace.wins + lastPlace.remainingGames - ninthPlace.wins + 1;
  return tragic <= 0 ? 0 : tragic;
}
