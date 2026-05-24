import { NextResponse } from "next/server";
import { crawlStandings } from "@/lib/crawl";
import { calcMagicNumbers } from "@/lib/calc";
import type { TeamWithNumbers } from "@/types";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export const revalidate = 300;

export async function GET() {
  try {
    const teams = await crawlStandings();
    if (teams.length === 0) throw new Error("KBO 순위 데이터를 가져오지 못했습니다.");

    const teamsWithNumbers = calcMagicNumbers(teams);

    return NextResponse.json({
      date: dayjs().tz("Asia/Seoul").format("YYYY-MM-DD"),
      teams: teamsWithNumbers,
    } satisfies { date: string; teams: TeamWithNumbers[] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
