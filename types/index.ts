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

export interface Snapshot {
  id: string;
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO 8601
  teams: TeamWithNumbers[];
}

export interface StandingsResponse {
  snapshot: Snapshot;
}
