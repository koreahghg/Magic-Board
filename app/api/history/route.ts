import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type SnapshotRow = Awaited<ReturnType<typeof prisma.snapshot.findMany>>[number];

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshots = await prisma.snapshot.findMany({
      orderBy: { date: "desc" },
      take: 30,
    });

    const result = snapshots.map((s: SnapshotRow) => ({
      id: s.id,
      date: s.date,
      createdAt: s.createdAt,
      teams: s.data,
    }));

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
