import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { crawlStandings } from "@/lib/crawl";
import dayjs from "dayjs";

export const dynamic = "force-dynamic";

// 현재 순위를 크롤링해 DB에 날짜 기준 upsert
export async function POST() {
  try {
    const teams = await crawlStandings();
    const date = dayjs().format("YYYY-MM-DD");

    const snapshot = await prisma.snapshot.upsert({
      where: { date },
      create: { date, data: teams },
      update: { data: teams },
    });

    return NextResponse.json({ id: snapshot.id, date: snapshot.date, createdAt: snapshot.createdAt });
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
      createdAt: snapshot.createdAt,
      teams: snapshot.data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
