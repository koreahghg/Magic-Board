import type { Team, TeamName } from "@/types";

const VALID_TEAM_NAMES = new Set<string>([
  "KIA", "삼성", "LG", "두산", "KT", "SSG", "롯데", "한화", "NC", "키움",
]);

function isValidTeamName(name: string): name is TeamName {
  return VALID_TEAM_NAMES.has(name);
}

// sports.naver.com/kbaseball/record/index.nhn 은 React SPA이므로 HTML 파싱 불가.
// 해당 페이지가 내부적으로 호출하는 JSON API를 직접 사용한다.
const NAVER_KBO_API = "https://api-gw.sports.naver.com/statistics/categories/kbo";

// KBO 정규시즌 팀당 총 경기수 (잔여경기 계산 기준)
const KBO_SEASON_GAMES = 144;

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

    const json = (await res.json()) as {
      result?: { seasonTeamStats?: NaverTeamStat[] };
    };

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
