import { NextResponse } from "next/server";
import { crawlStandings } from "@/lib/crawl";
import { calcMagicNumbers } from "@/lib/calc";
import { kstToday } from "@/lib/dayjs";
import { errResponse } from "@/lib/api";
import type { KboApiResponse } from "@/types";

export const revalidate = 300;

export async function GET(): Promise<NextResponse> {
  try {
    const teams = await crawlStandings();
    if (teams.length === 0) throw new Error("KBO 순위 데이터를 가져오지 못했습니다.");

    const body: KboApiResponse = {
      date: kstToday(),
      teams: calcMagicNumbers(teams),
    };
    return NextResponse.json(body);
  } catch (err) {
    return errResponse(err);
  }
}
