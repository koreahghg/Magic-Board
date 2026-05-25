import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma, fromJson } from "@/lib/prisma";
import { errResponse } from "@/lib/api";
import type { KboApiResponse, TeamWithNumbers } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const date = request.nextUrl.searchParams.get("date");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "날짜 파라미터가 올바르지 않습니다. (예: ?date=2025-05-01)" },
      { status: 400 }
    );
  }

  try {
    // 요청 날짜 이하 중 가장 최근 스냅샷 (정확히 일치하면 그 날짜, 없으면 가장 가까운 과거)
    const snapshot = await prisma.snapshot.findFirst({
      where: { date: { lte: date } },
      orderBy: { date: "desc" },
    });

    if (!snapshot) {
      return NextResponse.json({ error: "데이터 없음" }, { status: 404 });
    }

    const body: KboApiResponse = {
      date: snapshot.date,
      teams: fromJson<TeamWithNumbers[]>(snapshot.data),
    };
    return NextResponse.json(body);
  } catch (err) {
    return errResponse(err);
  }
}
