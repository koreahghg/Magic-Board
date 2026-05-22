import type { Team, MagicNumber } from "@/types";

/**
 * 매직넘버 = (추격팀 최대 가능 승수) - (1위 팀 현재 승수) + 1
 *          = (challenger.wins + remainingForChallenger) - leader.wins + 1
 * 매직넘버 <= 0 이면 이미 확정(null 반환)
 */
export function calcMagicNumbers(
  teams: Team[],
  totalGames = 144
): MagicNumber[] {
  if (teams.length === 0) return [];

  const sorted = [...teams].sort((a, b) => b.winRate - a.winRate);
  const leader = sorted[0];

  return sorted.slice(1).map((challenger) => {
    const remainingForChallenger =
      totalGames - challenger.wins - challenger.losses - challenger.draws;
    const magic =
      challenger.wins + remainingForChallenger - leader.wins + 1;

    return {
      teamName: leader.name,
      target: challenger.name,
      magicNumber: magic <= 0 ? null : magic,
    };
  });
}
