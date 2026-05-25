import type { Team, TeamWithNumbers } from "@/types";

const TOTAL_GAMES = 144;

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

// 공식: (144 - 경쟁팀 패배수 + 1) - 현재팀 승수
function calcMagic(leader: Team, rival: Team): number | null {
  if (leader.games === 0) return null;
  const magic = TOTAL_GAMES - rival.losses + 1 - leader.wins;
  return magic <= 0 ? 0 : magic;
}

// 트래직 = 9위가 꼴찌 대비 매직: (144 - 꼴찌 패배수 + 1) - 9위 승수
function calcTragic(lastPlace: Team, ninthPlace: Team): number | null {
  if (lastPlace.games === 0) return null;
  const tragic = TOTAL_GAMES - lastPlace.losses + 1 - ninthPlace.wins;
  return tragic <= 0 ? 0 : tragic;
}

// ─── 매직보드 (팀 × 순위 매트릭스) ───────────────────────────────────────────

export type CellState =
  | { type: "confirmed" }            // 확보 (파랑)
  | { type: "impossible" }           // 불가 (마룬)
  | { type: "magic"; value: number } // 매직넘버 (초록)
  | { type: "contest"; value: number } // 경합 (올리브)
  | { type: "tragic"; value: number }; // 트래직넘버 (빨강)

export type MagicBoard = {
  teams: Team[];
  // cells[teamIdx][posIdx], posIdx 0 = k=1, posIdx 8 = k=9
  cells: CellState[][];
};

/**
 * 10팀 × 9순위 매직보드 계산
 * cell(team_i, k):
 *   - rank_i ≤ k (상위권): 매직 = (144 - rank_{k+1}.losses + 1) - team_i.wins
 *   - rank_i > k (하위권): 트래직 = (144 - team_i.losses + 1) - rank_k.wins
 */
export function calcMagicBoard(teams: Team[]): MagicBoard {
  if (teams.length === 0) return { teams: [], cells: [] };

  const sorted = [...teams].sort((a, b) => a.rank - b.rank);
  const n = sorted.length; // 10
  const numPositions = n - 1; // 9 (위치 1~9)

  const cells: CellState[][] = sorted.map((team, teamIdx) => {
    const r = teamIdx + 1; // 1-based 현재 순위

    return Array.from({ length: numPositions }, (_, posIdx) => {
      const k = posIdx + 1; // 목표 순위 k (1~9)

      if (r <= k) {
        // 팀이 이미 top-k 안에 있음 → 경계: rank k+1 팀
        const boundary = sorted[k]; // rank k+1 (0-indexed)
        if (!boundary) return { type: "confirmed" } as CellState;

        const value = TOTAL_GAMES - boundary.losses + 1 - team.wins;
        if (value <= 0) return { type: "confirmed" } as CellState;
        if (r === k) return { type: "contest", value } as CellState;
        return { type: "magic", value } as CellState;
      } else {
        // 팀이 top-k 밖에 있음 → 트래직: rank k 팀이 team_i 위를 확정하기까지
        const boundary = sorted[k - 1]; // rank k (0-indexed)
        const value = TOTAL_GAMES - team.losses + 1 - boundary.wins;
        if (value <= 0) return { type: "impossible" } as CellState;
        return { type: "tragic", value } as CellState;
      }
    });
  });

  return { teams: sorted, cells };
}
