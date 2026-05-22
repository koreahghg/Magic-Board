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
  gamesBehind: number;
}

export interface Snapshot {
  id: string;
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO 8601
  teams: Team[];
}

export interface MagicNumber {
  teamName: TeamName;
  target: TeamName;
  magicNumber: number | null; // null = 이미 확정 or 계산 불가
}

export interface StandingsResponse {
  snapshot: Snapshot;
  magicNumbers: MagicNumber[];
}
