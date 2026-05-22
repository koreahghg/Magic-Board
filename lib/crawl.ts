import * as cheerio from "cheerio";
import type { Team, TeamName } from "@/types";

const VALID_TEAM_NAMES: readonly string[] = [
  "KIA", "삼성", "LG", "두산", "KT", "SSG", "롯데", "한화", "NC", "키움",
];

function isValidTeamName(name: string): name is TeamName {
  return VALID_TEAM_NAMES.includes(name);
}

const KBO_STANDINGS_URL =
  "https://www.koreabaseball.com/Record/TeamRank/TeamRankDaily.aspx";

export async function crawlStandings(): Promise<Team[]> {
  const res = await fetch(KBO_STANDINGS_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`크롤링 실패: ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  const teams: Team[] = [];

  $("table.tData tbody tr").each((_i, row) => {
    const cells = $(row).find("td");
    if (cells.length < 8) return;

    const rank = parseInt($(cells[0]).text().trim(), 10);
    const rawName = $(cells[1]).text().trim();
    if (!isValidTeamName(rawName)) return;

    const name: TeamName = rawName;
    const games = parseInt($(cells[2]).text().trim(), 10);
    const wins = parseInt($(cells[3]).text().trim(), 10);
    const losses = parseInt($(cells[4]).text().trim(), 10);
    const draws = parseInt($(cells[5]).text().trim(), 10);
    const winRate = parseFloat($(cells[6]).text().trim());
    const gamesBehind = parseFloat($(cells[7]).text().trim()) || 0;

    teams.push({ rank, name, games, wins, losses, draws, winRate, gamesBehind });
  });

  return teams;
}
