import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { crawlStandings } from "@/lib/crawl";
import type { Team } from "@/types";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export const dynamic = "force-dynamic";

// 현재 순위를 크롤링해 DB에 날짜 기준 upsert
export async function POST() {
  try {
    const teams = await crawlStandings();
    if (teams.length === 0) throw new Error("크롤링된 데이터가 없습니다.");
    const date = dayjs().tz("Asia/Seoul").format("YYYY-MM-DD");

    const snapshot = await prisma.snapshot.upsert({
      where: { date },
      create: { date, data: teams },
      update: { data: teams },
    });

    return NextResponse.json({ id: snapshot.id, date: snapshot.date, createdAt: snapshot.createdAt.toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// 가장 최근 스냅샷 조회
export async function GET() {
  try {
    const snapshot = await prisma.snapshot.findFirst({
      orderBy: { date: "desc" },
    });

    if (!snapshot) {
      return NextResponse.json({ error: "스냅샷 없음" }, { status: 404 });
    }

    return NextResponse.json({
      id: snapshot.id,
      date: snapshot.date,
      createdAt: snapshot.createdAt.toISOString(),
      teams: snapshot.data as unknown as Team[],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
