import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Team } from "@/types";
import type { Snapshot } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshots = await prisma.snapshot.findMany({
      orderBy: { crawledAt: "desc" },
      take: 30,
    });

    const result = snapshots.map((s: Snapshot) => ({
      id: s.id,
      crawledAt: s.crawledAt,
      teams: JSON.parse(s.teamsJson) as Team[],
    }));

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
