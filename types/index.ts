export type TeamName =
  | "KIA"
  | "삼성"
  | "LG"
  | "두산"
  | "KT"
  | "SSG"
  | "롯데"
  | "한화"
  | "NC"
  | "키움";

export interface Team {
  rank: number;
  name: TeamName;
  games: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  remainingGames: number;
  gamesBehind: number;
}

export type TeamWithNumbers = Team & {
  magicNumber: number | null;
  tragicNumber: number | null;
};

// ─── API response shapes ───────────────────────────────────────────────────

/** /api/kbo 및 /api/history 공통 응답 */
export interface KboApiResponse {
  date: string;
  teams: TeamWithNumbers[];
}

/** /api/snapshot 성공 응답 */
export interface SnapshotResponse {
  id: string;
  date: string;
  createdAt: string;
}

// ─── Magic Board ───────────────────────────────────────────────────────────

export type CellState =
  | { type: "confirmed" }              // 확보
  | { type: "impossible" }             // 불가
  | { type: "magic"; value: number }   // 매직넘버
  | { type: "contest"; value: number } // 경합
  | { type: "tragic"; value: number }; // 트래직넘버

export interface MagicBoard {
  teams: Team[];
  /** cells[teamIdx][posIdx]  posIdx 0 = 1위, posIdx 8 = 9위 */
  cells: CellState[][];
}
