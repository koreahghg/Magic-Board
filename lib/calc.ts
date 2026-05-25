import { KBO_SEASON_GAMES } from "@/lib/constants";
import type { Team, TeamWithNumbers, CellState, MagicBoard } from "@/types";

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

// 공식: (총경기 - 경쟁팀 패배수 + 1) - 현재팀 승수
function calcMagic(leader: Team, rival: Team): number | null {
  if (leader.games === 0) return null;
  const magic = KBO_SEASON_GAMES - rival.losses + 1 - leader.wins;
  return magic <= 0 ? 0 : magic;
}

// 트래직 = 9위가 꼴찌 대비 매직: (총경기 - 꼴찌 패배수 + 1) - 9위 승수
function calcTragic(lastPlace: Team, ninthPlace: Team): number | null {
  if (lastPlace.games === 0) return null;
  const tragic = KBO_SEASON_GAMES - lastPlace.losses + 1 - ninthPlace.wins;
  return tragic <= 0 ? 0 : tragic;
}

// ─── 매직보드 (팀 × 순위 매트릭스) ───────────────────────────────────────────

/**
 * 10팀 × 9순위 매직보드 계산
 * cell(team_i, k):
 *   - rank_i ≤ k (상위권): 매직 = (총경기 - rank_{k+1}.losses + 1) - team_i.wins
 *   - rank_i > k (하위권): 트래직 = (총경기 - team_i.losses + 1) - rank_k.wins
 */
export function calcMagicBoard(teams: Team[]): MagicBoard {
  if (teams.length === 0) return { teams: [], cells: [] };

  const sorted = [...teams].sort((a, b) => a.rank - b.rank);
  const n = sorted.length;
  const numPositions = n - 1;

  const cells: CellState[][] = sorted.map((team, teamIdx) => {
    const r = teamIdx + 1;

    return Array.from({ length: numPositions }, (_, posIdx) => {
      const k = posIdx + 1;

      if (r <= k) {
        const boundary = sorted[k];
        if (!boundary) return { type: "confirmed" } as CellState;

        const value = KBO_SEASON_GAMES - boundary.losses + 1 - team.wins;
        if (value <= 0) return { type: "confirmed" } as CellState;
        if (r === k) return { type: "contest", value } as CellState;
        return { type: "magic", value } as CellState;
      } else {
        const boundary = sorted[k - 1];
        const value = KBO_SEASON_GAMES - team.losses + 1 - boundary.wins;
        if (value <= 0) return { type: "impossible" } as CellState;
        return { type: "tragic", value } as CellState;
      }
    });
  });

  return { teams: sorted, cells };
}
