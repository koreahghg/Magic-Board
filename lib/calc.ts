import type { Team, MagicNumber } from "@/types";

/**
 * 매직넘버 = (시즌 총 경기 수) - (1위 팀 승수) - (추격 팀 남은 경기 수) + 1
 * 매직넘버 <= 0 이면 이미 확정(null 반환)
 */
export function calcMagicNumbers(
  teams: Team[],
  totalGames = 144
): MagicNumber[] {
  if (teams.length === 0) return [];

  const sorted = [...teams].sort((a, b) => b.wins - a.wins);
  const leader = sorted[0];

  return sorted.slice(1).map((challenger) => {
    const remainingForChallenger =
      totalGames - challenger.wins - challenger.losses - challenger.draws;
    const magic =
      totalGames - leader.wins - remainingForChallenger + 1;

    return {
      teamName: leader.name,
      target: challenger.name,
      magicNumber: magic <= 0 ? null : magic,
    };
  });
}
