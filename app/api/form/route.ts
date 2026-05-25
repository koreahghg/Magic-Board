import { NextResponse } from "next/server";
import { prisma, fromJson } from "@/lib/prisma";
import { errResponse } from "@/lib/api";
import type { TeamWithNumbers, FormResponse, FormEntry } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const snapshots = await prisma.snapshot.findMany({
      orderBy: { date: "desc" },
      take: 7,
      select: { date: true, data: true },
    });

    if (snapshots.length < 2) {
      return NextResponse.json({ form: {} } satisfies FormResponse);
    }

    const form: Record<string, FormEntry[]> = {};

    for (let i = 0; i < snapshots.length - 1; i++) {
      const curr = fromJson<TeamWithNumbers[]>(snapshots[i].data);
      const prev = fromJson<TeamWithNumbers[]>(snapshots[i + 1].data);

      for (const team of curr) {
        const prevTeam = prev.find((t) => t.name === team.name);
        if (!prevTeam) continue;

        if (!form[team.name]) form[team.name] = [];
        if (form[team.name].length >= 5) continue;

        const wDiff = Math.max(0, team.wins - prevTeam.wins);
        const lDiff = Math.max(0, team.losses - prevTeam.losses);
        const dDiff = Math.max(0, team.draws - prevTeam.draws);

        for (let w = 0; w < wDiff && form[team.name].length < 5; w++)
          form[team.name].push("W");
        for (let l = 0; l < lDiff && form[team.name].length < 5; l++)
          form[team.name].push("L");
        for (let d = 0; d < dDiff && form[team.name].length < 5; d++)
          form[team.name].push("D");
      }
    }

    return NextResponse.json({ form } satisfies FormResponse);
  } catch (err) {
    return errResponse(err);
  }
}
