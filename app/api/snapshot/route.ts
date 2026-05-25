import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma, toJson } from "@/lib/prisma";
import { crawlStandings } from "@/lib/crawl";
import { calcMagicNumbers } from "@/lib/calc";
import { kstToday } from "@/lib/dayjs";
import { errResponse } from "@/lib/api";
import type { SnapshotResponse } from "@/types";

export const dynamic = "force-dynamic";

async function saveSnapshot(): Promise<SnapshotResponse | null> {
  const teams = await crawlStandings();
  if (teams.length === 0) return null;

  const date = kstToday();
  const data = toJson(calcMagicNumbers(teams));

  const snap = await prisma.snapshot.upsert({
    where: { date },
    create: { date, data },
    update: { data },
  });

  return { id: snap.id, date: snap.date, createdAt: snap.createdAt.toISOString() };
}

/** Vercel Cron: 매일 23:30 KST (14:30 UTC) */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await saveSnapshot();
    if (!result) return NextResponse.json({ skipped: true, reason: "경기 데이터 없음" });
    return NextResponse.json(result);
  } catch (err) {
    return errResponse(err);
  }
}

/** 수동 트리거 */
export async function POST(): Promise<NextResponse> {
  try {
    const result = await saveSnapshot();
    if (!result) throw new Error("크롤링된 데이터가 없습니다.");
    return NextResponse.json(result);
  } catch (err) {
    return errResponse(err);
  }
}
