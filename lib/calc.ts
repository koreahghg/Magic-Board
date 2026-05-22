import type { Team, MagicNumber } from "@/types";

export function calcMagicNumbers(teams: Team[]): MagicNumber[] {
  if (teams.length === 0) return [];

  const sorted = [...teams].sort((a, b) => b.winRate - a.winRate);
  const leader = sorted[0];

  return sorted.slice(1).map((challenger) => {
    const magic = challenger.wins + challenger.remainingGames - leader.wins + 1;
    return {
      teamName: leader.name,
      target: challenger.name,
      magicNumber: magic <= 0 ? null : magic,
    };
  });
}
