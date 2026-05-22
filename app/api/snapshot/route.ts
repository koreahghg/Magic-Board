import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { crawlStandings } from "@/lib/crawl";
import dayjs from "dayjs";

export const dynamic = "force-dynamic";

// 현재 순위를 크롤링해 DB에 스냅샷으로 저장
export async function POST() {
  try {
    const teams = await crawlStandings();

    const snapshot = await prisma.snapshot.create({
      data: {
        teamsJson: JSON.stringify(teams),
        crawledAt: dayjs().toDate(),
      },
    });

    return NextResponse.json({ id: snapshot.id, crawledAt: snapshot.crawledAt });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// 가장 최근 스냅샷 조회
export async function GET() {
  try {
    const snapshot = await prisma.snapshot.findFirst({
      orderBy: { crawledAt: "desc" },
    });

    if (!snapshot) {
      return NextResponse.json({ error: "스냅샷 없음" }, { status: 404 });
    }

    return NextResponse.json({
      id: snapshot.id,
      crawledAt: snapshot.crawledAt,
      teams: JSON.parse(snapshot.teamsJson),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
