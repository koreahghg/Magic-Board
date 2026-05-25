import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { crawlGames } from "@/lib/crawl";
import { kstToday } from "@/lib/dayjs";
import { errResponse } from "@/lib/api";
import type { GamesResponse } from "@/types";

export const revalidate = 60;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const param = request.nextUrl.searchParams.get("date");
  const date =
    param && /^\d{4}-\d{2}-\d{2}$/.test(param) ? param : kstToday();

  try {
    const games = await crawlGames(date);
    const body: GamesResponse = { date, games };
    return NextResponse.json(body);
  } catch (err) {
    return errResponse(err);
  }
}
