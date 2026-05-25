"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { KboApiResponse, TeamWithNumbers, CellState } from "@/types";
import { calcMagicBoard } from "@/lib/calc";

// ─── Date helpers ──────────────────────────────────────────────────────────

function todayKST(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function fmtDateDisplay(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(d);
}

// ─── Fetch helpers ─────────────────────────────────────────────────────────

class NotFoundError extends Error {
  constructor() {
    super("해당 날짜 데이터가 없습니다.");
    this.name = "NotFoundError";
  }
}

async function fetchLive(): Promise<KboApiResponse> {
  const res = await fetch("/api/kbo");
  if (!res.ok) throw new Error("순위 데이터를 불러오지 못했습니다.");
  return res.json();
}

async function fetchHistory(date: string): Promise<KboApiResponse> {
  const res = await fetch(`/api/history?date=${date}`);
  if (res.status === 404) throw new NotFoundError();
  if (!res.ok) throw new Error("데이터를 불러오지 못했습니다.");
  return res.json();
}

// ─── Format helpers ────────────────────────────────────────────────────────

function fmtWinRate(r: number): string {
  if (!isFinite(r)) return "-";
  return r.toFixed(3).replace(/^0/, "");
}

function fmtGb(gb: number): string {
  return gb === 0 ? "-" : String(gb);
}

// ─── Team logo ─────────────────────────────────────────────────────────────

function TeamLogo({ name, size = 24 }: { name: string; size?: number }) {
  return (
    <Image
      src={`/logos/${name}.png`}
      alt={name}
      width={size}
      height={size}
      className="object-contain"
    />
  );
}

// ─── Magic Board cell styling ──────────────────────────────────────────────

function cellBg(type: CellState["type"]): string {
  switch (type) {
    case "confirmed":  return "bg-blue-900";
    case "magic":      return "bg-green-800";
    case "contest":    return "bg-yellow-900";
    case "tragic":     return "bg-red-900";
    case "impossible": return "bg-red-950";
  }
}

function cellLabel(state: CellState): string {
  if (state.type === "magic" || state.type === "contest" || state.type === "tragic") {
    return String(state.value);
  }
  return "";
}

function impossibleText(largestK: number): string {
  if (largestK >= 5) return `포스트시즌 진출 실패\n(${largestK}위 불가)`;
  return `${largestK}위 불가`;
}

// ─── Magic Board ───────────────────────────────────────────────────────────

function MagicBoardTable({ teams }: { teams: TeamWithNumbers[] }) {
  const { teams: sorted, cells } = calcMagicBoard(teams);
  const numPositions = sorted.length - 1; // 9

  const displayK = Array.from({ length: numPositions }, (_, i) => numPositions - i);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg">
        <table className="text-sm border-collapse w-full">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-slate-300 bg-slate-900 border border-slate-700 min-w-20 text-base">
                구단
              </th>
              {displayK.map((k) => (
                <th
                  key={k}
                  className="px-3 py-3 text-center text-slate-300 bg-slate-900 border border-slate-700 min-w-14 font-bold text-base"
                >
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((team, teamIdx) => {
              const rowCells = cells[teamIdx];
              const display = displayK.map((k) => ({ k, state: rowCells[k - 1] }));

              let confirmedCount = 0;
              while (confirmedCount < display.length && display[confirmedCount].state.type === "confirmed") {
                confirmedCount++;
              }

              let impossibleCount = 0;
              const remaining = display.length - confirmedCount;
              while (
                impossibleCount < remaining &&
                display[display.length - 1 - impossibleCount].state.type === "impossible"
              ) {
                impossibleCount++;
              }

              const middle = display.slice(
                confirmedCount,
                impossibleCount > 0 ? display.length - impossibleCount : undefined
              );

              const confirmedLabel = confirmedCount > 0
                ? `${display[confirmedCount - 1].k}위 확보`
                : null;

              const largestImpossibleK = impossibleCount > 0
                ? display[display.length - impossibleCount].k
                : null;

              return (
                <tr key={team.name}>
                  <td className="px-4 py-3 text-white bg-slate-900 border border-slate-700 font-semibold whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <TeamLogo name={team.name} size={28} />
                      {team.name}
                    </div>
                  </td>

                  {confirmedCount > 0 && (
                    <td
                      colSpan={confirmedCount}
                      className="px-3 py-3 text-center text-blue-200 bg-blue-900 border border-slate-700 font-semibold text-sm"
                    >
                      {confirmedLabel}
                    </td>
                  )}

                  {middle.map(({ k, state }) => (
                    <td
                      key={k}
                      className={`px-3 py-3 text-center text-white border border-slate-700/60 tabular-nums font-semibold text-sm ${cellBg(state.type)}`}
                    >
                      {cellLabel(state)}
                    </td>
                  ))}

                  {impossibleCount > 0 && largestImpossibleK !== null && (
                    <td
                      colSpan={impossibleCount}
                      className="px-3 py-3 text-center text-red-300/70 bg-red-950 border border-slate-700 whitespace-pre-line text-xs leading-snug"
                    >
                      {impossibleText(largestImpossibleK)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-5 flex-wrap text-xs">
        {(
          [
            ["bg-blue-900", "확보"],
            ["bg-green-800", "매직 넘버"],
            ["bg-yellow-900", "경합"],
            ["bg-red-900", "트래직 넘버"],
            ["bg-red-950", "불가"],
          ] as [string, string][]
        ).map(([bg, label]) => (
          <span key={label} className="flex items-center gap-1.5 text-muted-foreground">
            <span className={`inline-block w-3 h-3 rounded-sm ${bg}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Standings Table (compact) ─────────────────────────────────────────────

function CompactStandings({ teams }: { teams: TeamWithNumbers[] }) {
  return (
    <Table className="text-xs">
      <TableHeader>
        <TableRow className="border-slate-700">
          <TableHead className="text-center w-10 py-2">순위</TableHead>
          <TableHead className="py-2">팀명</TableHead>
          <TableHead className="text-center py-2">경기</TableHead>
          <TableHead className="text-center py-2">승</TableHead>
          <TableHead className="text-center py-2">패</TableHead>
          <TableHead className="text-center py-2">무</TableHead>
          <TableHead className="text-center py-2">승률</TableHead>
          <TableHead className="text-center py-2">게임차</TableHead>
          <TableHead className="text-center py-2">잔여</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {teams.map((team) => (
          <TableRow key={team.name} className="border-slate-700/50">
            <TableCell className="text-center font-medium py-1.5">{team.rank}</TableCell>
            <TableCell className="font-medium py-1.5">
              <div className="flex items-center gap-1.5">
                <TeamLogo name={team.name} size={20} />
                {team.name}
              </div>
            </TableCell>
            <TableCell className="text-center tabular-nums py-1.5">{team.games}</TableCell>
            <TableCell className="text-center tabular-nums py-1.5">{team.wins}</TableCell>
            <TableCell className="text-center tabular-nums py-1.5">{team.losses}</TableCell>
            <TableCell className="text-center tabular-nums py-1.5">{team.draws}</TableCell>
            <TableCell className="text-center tabular-nums py-1.5">{fmtWinRate(team.winRate)}</TableCell>
            <TableCell className="text-center tabular-nums py-1.5">{fmtGb(team.gamesBehind)}</TableCell>
            <TableCell className="text-center tabular-nums py-1.5">{team.remainingGames}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export function StandingsTable() {
  const [date, setDate] = useState("");

  useEffect(() => {
    setDate(todayKST());
  }, []);

  const today = todayKST();
  const isToday = date !== "" && date === today;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["standings", date],
    queryFn: () => (isToday ? fetchLive() : fetchHistory(date)),
    enabled: date !== "",
    staleTime: isToday ? 5 * 60 * 1000 : Infinity,
    retry: (_, err) => !(err instanceof NotFoundError),
  });

  const isNotFound = isError && error instanceof NotFoundError;
  const showSkeleton = date === "" || isLoading;

  return (
    <div className="space-y-8">
      {/* 날짜 네비게이션 */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setDate(offsetDate(date, -1))}
          disabled={date === ""}
          className="flex items-center justify-center w-9 h-9 rounded-full text-slate-300 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-30 text-xl"
          aria-label="이전 날짜"
        >
          ‹
        </button>

        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight min-w-52 text-center">
            {fmtDateDisplay(date)}
          </span>
          {isToday && <Badge variant="secondary">실시간</Badge>}
        </div>

        <button
          onClick={() => setDate(offsetDate(date, 1))}
          disabled={date === "" || isToday}
          className="flex items-center justify-center w-9 h-9 rounded-full text-slate-300 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-30 text-xl"
          aria-label="다음 날짜"
        >
          ›
        </button>
      </div>

      {/* 컨텐츠 */}
      {showSkeleton ? (
        <BoardSkeleton />
      ) : isNotFound ? (
        <div className="rounded-lg border border-slate-700 p-12 text-center text-sm text-muted-foreground">
          해당 날짜 데이터가 없습니다.
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "오류가 발생했습니다."}
        </div>
      ) : data?.teams ? (
        <div className="space-y-8">
          {!isToday && data?.date !== date && (
            <p className="text-xs text-amber-500 text-center">
              가장 가까운 <span className="font-medium">{data?.date}</span> 데이터를 표시합니다.
            </p>
          )}

          {/* 매직 보드 (상단, 크게) */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight">매직 보드</h2>
            <MagicBoardTable teams={data.teams} />
          </section>

          {/* 순위표 (하단, 작게) */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">
              순위표
            </h2>
            <div className="w-1/2">
              <CompactStandings teams={data.teams} />
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────

function BoardSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      <div className="rounded-lg overflow-hidden border border-slate-700">
        {Array.from({ length: 11 }).map((_, i) => (
          <div key={i} className="flex border-b border-slate-700/50">
            {Array.from({ length: 10 }).map((_, j) => (
              <div key={j} className="flex-1 p-3">
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
