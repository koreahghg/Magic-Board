"use client";

import { useState, useEffect } from "react";
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
import type { TeamWithNumbers } from "@/types";

type KboResponse = { date: string; teams: TeamWithNumbers[] };

const HEADERS = [
  "순위", "팀명", "경기수", "승", "패", "무",
  "승률", "게임차", "잔여경기", "매직넘버", "트래직넘버",
];

// Intl API는 서버 측에서도 실행 가능하나, hydration mismatch 방지를 위해
// 클라이언트 mount 후에만 사용한다.
function todayKST(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(
    new Date()
  );
}

class NotFoundError extends Error {
  constructor() {
    super("해당 날짜 데이터가 없습니다.");
    this.name = "NotFoundError";
  }
}

async function fetchLive(): Promise<KboResponse> {
  const res = await fetch("/api/kbo");
  if (!res.ok) throw new Error("순위 데이터를 불러오지 못했습니다.");
  return res.json();
}

async function fetchHistory(date: string): Promise<KboResponse> {
  const res = await fetch(`/api/history?date=${date}`);
  if (res.status === 404) throw new NotFoundError();
  if (!res.ok) throw new Error("데이터를 불러오지 못했습니다.");
  return res.json();
}

function magicClass(n: number): string {
  if (n <= 5) return "text-blue-600 font-semibold";
  if (n <= 10) return "text-blue-500";
  if (n <= 20) return "text-blue-400";
  return "text-blue-300";
}

function tragicClass(n: number): string {
  if (n <= 5) return "text-red-600 font-semibold";
  if (n <= 10) return "text-red-500";
  if (n <= 20) return "text-red-400";
  return "text-red-300";
}

function fmtWinRate(r: number): string {
  if (!isFinite(r)) return "-";
  return r.toFixed(3).replace(/^0/, "");
}

function fmtGb(gb: number): string {
  return gb === 0 ? "-" : String(gb);
}

export function StandingsTable() {
  const [date, setDate] = useState("");

  useEffect(() => {
    setDate(todayKST());
  }, []);

  const isToday = date !== "" && date === todayKST();

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
    <div className="space-y-4">
      {/* 날짜 선택 */}
      <div className="flex items-center gap-3">
        <label htmlFor="date-picker" className="text-sm font-medium">
          날짜
        </label>
        <input
          id="date-picker"
          type="date"
          value={date}
          max={date !== "" ? todayKST() : undefined}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {isToday && <Badge>실시간</Badge>}
      </div>

      {/* 컨텐츠 영역 */}
      {showSkeleton ? (
        <StandingsSkeleton />
      ) : isNotFound ? (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          해당 날짜 데이터가 없습니다.
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "오류가 발생했습니다."}
        </div>
      ) : (
        <div className="space-y-2">
          {!isToday && data?.date !== date && (
            <p className="text-xs text-amber-600">
              선택한 날짜의 데이터가 없어 가장 가까운{" "}
              <span className="font-medium">{data?.date}</span> 데이터를 표시합니다.
            </p>
          )}
          <p className="text-xs text-muted-foreground text-right">
            기준일: {data?.date}
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center w-12">순위</TableHead>
                <TableHead>팀명</TableHead>
                <TableHead className="text-center">경기수</TableHead>
                <TableHead className="text-center">승</TableHead>
                <TableHead className="text-center">패</TableHead>
                <TableHead className="text-center">무</TableHead>
                <TableHead className="text-center">승률</TableHead>
                <TableHead className="text-center">게임차</TableHead>
                <TableHead className="text-center">잔여경기</TableHead>
                <TableHead className="text-center text-blue-500">매직넘버</TableHead>
                <TableHead className="text-center text-red-500">트래직넘버</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.teams.map((team) => (
                <TableRow key={team.name}>
                  <TableCell className="text-center font-medium">{team.rank}</TableCell>
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell className="text-center tabular-nums">{team.games}</TableCell>
                  <TableCell className="text-center tabular-nums">{team.wins}</TableCell>
                  <TableCell className="text-center tabular-nums">{team.losses}</TableCell>
                  <TableCell className="text-center tabular-nums">{team.draws}</TableCell>
                  <TableCell className="text-center tabular-nums">{fmtWinRate(team.winRate)}</TableCell>
                  <TableCell className="text-center tabular-nums">{fmtGb(team.gamesBehind)}</TableCell>
                  <TableCell className="text-center tabular-nums">{team.remainingGames}</TableCell>
                  <TableCell
                    className={`text-center tabular-nums ${
                      team.magicNumber !== null
                        ? magicClass(team.magicNumber)
                        : "text-muted-foreground"
                    }`}
                  >
                    {team.magicNumber ?? "-"}
                  </TableCell>
                  <TableCell
                    className={`text-center tabular-nums ${
                      team.tragicNumber !== null
                        ? tragicClass(team.tragicNumber)
                        : "text-muted-foreground"
                    }`}
                  >
                    {team.tragicNumber ?? "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function StandingsSkeleton() {
  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Skeleton className="h-3 w-28" />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {HEADERS.map((h) => (
              <TableHead key={h} className="text-center">
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 10 }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: 11 }).map((_, j) => (
                <TableCell key={j} className="text-center">
                  <Skeleton className="h-4 w-8 mx-auto" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
