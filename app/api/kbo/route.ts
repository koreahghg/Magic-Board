import { NextResponse } from "next/server";
import { crawlStandings } from "@/lib/crawl";
import { calcMagicNumbers } from "@/lib/calc";
import type { StandingsResponse } from "@/types";
import dayjs from "dayjs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const teams = await crawlStandings();
    const magicNumbers = calcMagicNumbers(teams);

    const body: StandingsResponse = {
      snapshot: {
        id: crypto.randomUUID(),
        crawledAt: dayjs().toISOString(),
        teams,
      },
      magicNumbers,
    };

    return NextResponse.json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
