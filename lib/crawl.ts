import { KBO_SEASON_GAMES } from "@/lib/constants";
import type { Team, TeamName, Game } from "@/types";

const VALID_TEAM_NAMES = new Set<string>([
  "KIA", "삼성", "LG", "두산", "KT", "SSG", "롯데", "한화", "NC", "키움",
]);

function isValidTeamName(name: string): name is TeamName {
  return VALID_TEAM_NAMES.has(name);
}

// sports.naver.com/kbaseball/record/index.nhn 은 React SPA이므로 HTML 파싱 불가.
// 해당 페이지가 내부적으로 호출하는 JSON API를 직접 사용한다.
const NAVER_KBO_API = "https://api-gw.sports.naver.com/statistics/categories/kbo";

type NaverTeamStat = {
  teamName?: unknown;
  ranking?: unknown;
  gameCount?: unknown;
  winGameCount?: unknown;
  loseGameCount?: unknown;
  drawnGameCount?: unknown;
  wra?: unknown;
  gameBehind?: unknown;
};

type NaverApiResponse = {
  result?: { seasonTeamStats?: NaverTeamStat[] };
};

export async function crawlStandings(): Promise<Team[]> {
  try {
    const year = new Date().getFullYear();
    const url = `${NAVER_KBO_API}/seasons/${year}/teams?gameType=REGULAR_SEASON`;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://sports.naver.com/kbaseball/record/index.nhn",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      throw new Error(`네이버 KBO API 요청 실패: ${res.status}`);
    }

    const json = (await res.json()) as NaverApiResponse;
    const stats = json?.result?.seasonTeamStats ?? [];
    if (stats.length === 0) return [];

    const teams: Team[] = [];

    for (const item of stats) {
      const rawName = String(item.teamName ?? "");
      if (!isValidTeamName(rawName)) continue;

      const games = Number(item.gameCount) || 0;

      teams.push({
        rank: Number(item.ranking),
        name: rawName,
        games,
        wins: Number(item.winGameCount),
        losses: Number(item.loseGameCount),
        draws: Number(item.drawnGameCount),
        winRate: Number(item.wra),
        remainingGames: Math.max(0, KBO_SEASON_GAMES - games),
        gamesBehind: Number(item.gameBehind) || 0,
      });
    }

    return teams;
  } catch (err) {
    console.error("[crawlStandings]", err);
    return [];
  }
}

// ─── Game schedule ─────────────────────────────────────────────────────────

const NAVER_SCHEDULE_API =
  "https://api-gw.sports.naver.com/schedule/categories/kbo";

type NaverScheduleGame = {
  gameId?: unknown;
  gameTime?: unknown;
  homeTeamName?: unknown;
  awayTeamName?: unknown;
  homeTeamScore?: unknown;
  awayTeamScore?: unknown;
  gameStatusCode?: unknown;
  stadiumName?: unknown;
  currentInningString?: unknown;
};

type NaverScheduleResponse = {
  result?: { games?: NaverScheduleGame[] };
};

function parseGameStatus(code: string): Game["status"] {
  switch (code.toUpperCase()) {
    case "RESULT":   return "final";
    case "LIVE":     return "live";
    case "CANCEL":   return "cancelled";
    case "POSTPONE": return "postponed";
    default:         return "scheduled";
  }
}

function parseScore(val: unknown): number | null {
  if (val == null || val === "" || val === "-") return null;
  const n = Number(val);
  return isFinite(n) ? n : null;
}

export async function crawlGames(dateStr: string): Promise<Game[]> {
  try {
    const date = dateStr.replace(/-/g, "");
    const url = `${NAVER_SCHEDULE_API}/games?gameType=REGULAR&date=${date}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://sports.naver.com/kbaseball/schedule/index.nhn",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) throw new Error(`Naver 일정 API 요청 실패: ${res.status}`);

    const json = (await res.json()) as NaverScheduleResponse;
    const raw = json?.result?.games ?? [];

    return raw
      .map((g): Game => ({
        gameId: String(g.gameId ?? Math.random()),
        homeTeam: String(g.homeTeamName ?? ""),
        awayTeam: String(g.awayTeamName ?? ""),
        homeScore: parseScore(g.homeTeamScore),
        awayScore: parseScore(g.awayTeamScore),
        status: parseGameStatus(String(g.gameStatusCode ?? "")),
        time: String(g.gameTime ?? ""),
        stadium: String(g.stadiumName ?? ""),
        inning: g.currentInningString ? String(g.currentInningString) : undefined,
      }))
      .filter((g) => g.homeTeam !== "" || g.awayTeam !== "");
  } catch (err) {
    console.error("[crawlGames]", err);
    return [];
  }
}
