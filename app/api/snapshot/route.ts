import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { crawlStandings } from "@/lib/crawl";
import { calcMagicNumbers } from "@/lib/calc";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export const dynamic = "force-dynamic";

// Vercel Cron: 매일 23:30 KST (14:30 UTC)
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const teams = await crawlStandings();
    if (teams.length === 0) {
      return NextResponse.json({ skipped: true, reason: "경기 데이터 없음" });
    }

    const teamsWithNumbers = calcMagicNumbers(teams);
    const date = dayjs().tz("Asia/Seoul").format("YYYY-MM-DD");

    const snapshot = await prisma.snapshot.upsert({
      where: { date },
      create: { date, data: teamsWithNumbers as unknown as Prisma.InputJsonValue },
      update: { data: teamsWithNumbers as unknown as Prisma.InputJsonValue },
    });

    return NextResponse.json({
      id: snapshot.id,
      date: snapshot.date,
      createdAt: snapshot.createdAt.toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// 현재 순위를 크롤링해 DB에 날짜 기준 upsert (수동 트리거용)
export async function POST() {
  try {
    const teams = await crawlStandings();
    if (teams.length === 0) throw new Error("크롤링된 데이터가 없습니다.");
    const date = dayjs().tz("Asia/Seoul").format("YYYY-MM-DD");

    const snapshot = await prisma.snapshot.upsert({
      where: { date },
      create: { date, data: teams as unknown as Prisma.InputJsonValue },
      update: { data: teams as unknown as Prisma.InputJsonValue },
    });

    return NextResponse.json({ id: snapshot.id, date: snapshot.date, createdAt: snapshot.createdAt.toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
