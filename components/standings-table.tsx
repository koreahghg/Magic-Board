"use client";

import { useState, useEffect, Fragment } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type {
  KboApiResponse,
  TeamWithNumbers,
  CellState,
  GamesResponse,
  FormResponse,
  FormEntry,
  Game,
} from "@/types";
import { calcMagicBoard } from "@/lib/calc";

// ─── Date helpers ──────────────────────────────────────────────────────────

function todayKST(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(
    new Date()
  );
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

async function fetchGames(date: string): Promise<GamesResponse> {
  const res = await fetch(`/api/games?date=${date}`);
  if (!res.ok) throw new Error("경기 데이터 로드 실패");
  return res.json();
}

async function fetchForm(): Promise<FormResponse> {
  const res = await fetch("/api/form");
  if (!res.ok) throw new Error("최근 기록 로드 실패");
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
      className="object-contain shrink-0"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
}

// ─── Today's Games ─────────────────────────────────────────────────────────

function gameStatusInfo(status: Game["status"]): {
  label: string;
  cls: string;
} {
  switch (status) {
    case "final":     return { label: "종료",     cls: "text-slate-400" };
    case "live":      return { label: "진행중",   cls: "text-amber-400 font-semibold" };
    case "cancelled": return { label: "취소",     cls: "text-slate-500" };
    case "postponed": return { label: "우천순연", cls: "text-slate-500" };
    default:          return { label: "예정",     cls: "text-slate-300" };
  }
}

function GameCard({ game }: { game: Game }) {
  const { label, cls } = gameStatusInfo(game.status);
  const isLive = game.status === "live";
  const isFinal = game.status === "final";
  const hasScore = game.homeScore !== null && game.awayScore !== null;
  const awayWin = hasScore && game.awayScore! > game.homeScore!;
  const homeWin = hasScore && game.homeScore! > game.awayScore!;

  return (
    <div
      className={`w-52 shrink-0 rounded-xl border p-4 space-y-3 transition-all ${
        isLive
          ? "border-amber-500/40 bg-amber-950/20 shadow-lg shadow-amber-900/10"
          : "border-slate-800 bg-slate-900/60"
      }`}
    >
      {/* Status + Stadium */}
      <div className="flex items-center justify-between text-[11px]">
        <span className={`flex items-center gap-1 ${cls}`}>
          {isLive && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
          )}
          {label}
          {game.inning && ` · ${game.inning}`}
        </span>
        <span className="text-slate-600 truncate max-w-22 text-right">
          {game.stadium}
        </span>
      </div>

      {/* Away */}
      <div
        className={`flex items-center justify-between ${
          isFinal && !awayWin ? "opacity-40" : ""
        }`}
      >
        <div className="flex items-center gap-2">
          <TeamLogo name={game.awayTeam} size={22} />
          <span className="text-sm font-semibold text-slate-200">
            {game.awayTeam}
          </span>
          <span className="text-[10px] text-slate-600">원정</span>
        </div>
        {hasScore && (
          <span
            className={`text-xl font-bold tabular-nums ${
              awayWin ? "text-white" : "text-slate-500"
            }`}
          >
            {game.awayScore}
          </span>
        )}
      </div>

      {/* Home */}
      <div
        className={`flex items-center justify-between ${
          isFinal && !homeWin ? "opacity-40" : ""
        }`}
      >
        <div className="flex items-center gap-2">
          <TeamLogo name={game.homeTeam} size={22} />
          <span className="text-sm font-semibold text-slate-200">
            {game.homeTeam}
          </span>
          <span className="text-[10px] text-slate-600">홈</span>
        </div>
        {hasScore && (
          <span
            className={`text-xl font-bold tabular-nums ${
              homeWin ? "text-white" : "text-slate-500"
            }`}
          >
            {game.homeScore}
          </span>
        )}
      </div>

      {/* Scheduled time */}
      {!hasScore && game.time && (
        <div className="text-center text-sm text-slate-400 font-medium pt-1">
          {game.time}
        </div>
      )}
    </div>
  );
}

function TodayGamesSection({
  games,
  loading,
}: {
  games: Game[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-slate-500 tracking-widest uppercase">
          오늘의 경기
        </h2>
        <div className="flex gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="w-52 h-40 rounded-xl shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  if (games.length === 0) return null;

  const liveCount = games.filter((g) => g.status === "live").length;
  const finalCount = games.filter((g) => g.status === "final").length;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <h2 className="text-xs font-semibold text-slate-500 tracking-widest uppercase">
          오늘의 경기
        </h2>
        <span className="text-xs text-slate-600">
          {liveCount > 0 ? (
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
              {liveCount}경기 진행중
            </span>
          ) : finalCount > 0 ? (
            `${finalCount}/${games.length}경기 종료`
          ) : (
            `${games.length}경기 예정`
          )}
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
        {games.map((game) => (
          <div key={game.gameId} className="snap-start">
            <GameCard game={game} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Form helpers ──────────────────────────────────────────────────────────

function FormDots({ form }: { form: FormEntry[] }) {
  if (form.length === 0)
    return <span className="text-slate-700 text-xs">-</span>;
  return (
    <div className="flex items-center gap-0.5">
      {form.map((entry, i) => (
        <span
          key={i}
          title={entry === "W" ? "승" : entry === "L" ? "패" : "무"}
          className={`w-2.5 h-2.5 rounded-full ${
            entry === "W"
              ? "bg-emerald-500"
              : entry === "L"
              ? "bg-rose-500"
              : "bg-amber-400"
          }`}
        />
      ))}
    </div>
  );
}

function calcStreak(form: FormEntry[]): string {
  if (form.length < 2) return "";
  const first = form[0];
  let count = 0;
  for (const e of form) {
    if (e !== first) break;
    count++;
  }
  if (count < 2) return "";
  return first === "W" ? `${count}연승` : first === "L" ? `${count}연패` : `${count}연무`;
}

// ─── Magic Board cell helpers ──────────────────────────────────────────────

function cellBg(type: CellState["type"]): string {
  switch (type) {
    case "confirmed":  return "bg-sky-950";
    case "magic":      return "bg-emerald-950";
    case "contest":    return "bg-amber-950";
    case "tragic":     return "bg-rose-950";
    case "impossible": return "bg-slate-950";
  }
}

function cellText(type: CellState["type"]): string {
  switch (type) {
    case "confirmed":  return "text-sky-300";
    case "magic":      return "text-emerald-400 font-bold";
    case "contest":    return "text-amber-300 font-bold";
    case "tragic":     return "text-rose-400 font-bold";
    case "impossible": return "text-slate-700";
  }
}

function cellLabel(state: CellState): string {
  if (
    state.type === "magic" ||
    state.type === "contest" ||
    state.type === "tragic"
  ) {
    return String(state.value);
  }
  return "";
}

// ─── Magic Board ───────────────────────────────────────────────────────────

function MagicBoardTable({ teams }: { teams: TeamWithNumbers[] }) {
  const { teams: sorted, cells } = calcMagicBoard(teams);
  const numPositions = sorted.length - 1;
  const displayK = Array.from({ length: numPositions }, (_, i) => numPositions - i);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="text-sm border-collapse w-full">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-slate-500 bg-slate-900 border-b border-r border-slate-800 min-w-28 text-xs font-semibold tracking-wider uppercase">
                구단
              </th>
              {displayK.map((k) => (
                <th
                  key={k}
                  className={`px-3 py-3 text-center bg-slate-900 border-b border-r border-slate-800 min-w-14 text-sm font-bold ${
                    k <= 5 ? "text-emerald-400" : "text-slate-400"
                  }`}
                >
                  {k}위
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((team, teamIdx) => {
              const rowCells = cells[teamIdx];
              const display = displayK.map((k) => ({ k, state: rowCells[k - 1] }));

              let confirmedCount = 0;
              while (
                confirmedCount < display.length &&
                display[confirmedCount].state.type === "confirmed"
              ) confirmedCount++;

              let impossibleCount = 0;
              const remaining = display.length - confirmedCount;
              while (
                impossibleCount < remaining &&
                display[display.length - 1 - impossibleCount].state.type === "impossible"
              ) impossibleCount++;

              const middle = display.slice(
                confirmedCount,
                impossibleCount > 0 ? display.length - impossibleCount : undefined
              );

              const confirmedLabel =
                confirmedCount > 0
                  ? `${display[confirmedCount - 1].k}위 확보`
                  : null;

              const largestImpossibleK =
                impossibleCount > 0
                  ? display[display.length - impossibleCount].k
                  : null;

              return (
                <tr
                  key={team.name}
                  className="border-b border-slate-800/40 last:border-0 hover:bg-slate-800/20 transition-colors"
                >
                  <td className="px-3 py-2.5 bg-slate-900/50 border-r border-slate-800 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 text-xs w-4 text-right tabular-nums">
                        {team.rank}
                      </span>
                      <TeamLogo name={team.name} size={22} />
                      <span className="text-sm font-semibold text-slate-100">
                        {team.name}
                      </span>
                    </div>
                  </td>

                  {confirmedCount > 0 && (
                    <td
                      colSpan={confirmedCount}
                      className="px-3 py-2.5 text-center bg-sky-950 border-r border-slate-700/30"
                    >
                      <span className="text-sky-300 font-semibold text-xs">
                        {confirmedLabel}
                      </span>
                    </td>
                  )}

                  {middle.map(({ k, state }) => (
                    <td
                      key={k}
                      className={`px-3 py-2.5 text-center border-r border-slate-800/30 tabular-nums text-sm ${cellBg(state.type)} ${cellText(state.type)}`}
                    >
                      {cellLabel(state)}
                    </td>
                  ))}

                  {impossibleCount > 0 && largestImpossibleK !== null && (
                    <td
                      colSpan={impossibleCount}
                      className="px-2 py-2.5 text-center bg-slate-950 text-slate-700 text-[11px] whitespace-pre-line leading-tight border-r border-slate-800/20"
                    >
                      {largestImpossibleK >= 5
                        ? "포스트시즌\n진출 실패"
                        : `${largestImpossibleK}위\n불가`}
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
            ["bg-sky-950 border border-sky-800/40",       "text-sky-300",     "확보"],
            ["bg-emerald-950 border border-emerald-800/40", "text-emerald-400", "매직넘버"],
            ["bg-amber-950 border border-amber-800/40",   "text-amber-300",   "경합"],
            ["bg-rose-950 border border-rose-800/40",     "text-rose-400",    "트래직넘버"],
            ["bg-slate-950 border border-slate-700",      "text-slate-600",   "불가"],
          ] as [string, string, string][]
        ).map(([bg, text, label]) => (
          <span key={label} className="flex items-center gap-1.5 text-slate-500">
            <span className={`inline-block w-3 h-3 rounded-sm ${bg}`} />
            <span className={text}>{label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Enhanced Standings ────────────────────────────────────────────────────

const PLAYOFF_SPOTS = 5;

function EnhancedStandings({
  teams,
  form,
}: {
  teams: TeamWithNumbers[];
  form: Record<string, FormEntry[]>;
}) {
  const hasForm = Object.keys(form).length > 0;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-900/90 border-b border-slate-800">
            <th className="text-center px-3 py-2.5 text-slate-500 text-xs font-semibold w-8">순</th>
            <th className="px-4 py-2.5 text-slate-500 text-xs font-semibold text-left">팀명</th>
            <th className="text-center px-3 py-2.5 text-slate-500 text-xs font-semibold">경기</th>
            <th className="text-center px-3 py-2.5 text-slate-500 text-xs font-semibold">승</th>
            <th className="text-center px-3 py-2.5 text-slate-500 text-xs font-semibold">패</th>
            <th className="text-center px-3 py-2.5 text-slate-500 text-xs font-semibold hidden sm:table-cell">무</th>
            <th className="text-center px-3 py-2.5 text-slate-500 text-xs font-semibold">승률</th>
            <th className="text-center px-3 py-2.5 text-slate-500 text-xs font-semibold">게임차</th>
            <th className="text-center px-3 py-2.5 text-slate-500 text-xs font-semibold hidden md:table-cell">잔여</th>
            {hasForm && (
              <th className="text-center px-3 py-2.5 text-slate-500 text-xs font-semibold">최근5</th>
            )}
          </tr>
        </thead>
        <tbody>
          {teams.map((team, idx) => {
            const teamForm = form[team.name] ?? [];
            const streak = calcStreak(teamForm);
            const inPlayoff = idx < PLAYOFF_SPOTS;

            return (
              <Fragment key={team.name}>
                {idx === PLAYOFF_SPOTS && (
                  <tr>
                    <td colSpan={99} className="p-0">
                      <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-800/30">
                        <div className="flex-1 h-px bg-slate-700/60" />
                        <span className="text-[10px] text-slate-500 font-medium tracking-widest uppercase whitespace-nowrap">
                          포스트시즌 컷오프
                        </span>
                        <div className="flex-1 h-px bg-slate-700/60" />
                      </div>
                    </td>
                  </tr>
                )}
                <tr
                  className={`border-b border-slate-800/40 last:border-0 transition-colors ${
                    inPlayoff
                      ? "hover:bg-emerald-950/30"
                      : "hover:bg-slate-800/20"
                  }`}
                >
                  <td
                    className={`text-center px-3 py-2.5 tabular-nums font-bold text-sm ${
                      inPlayoff ? "text-emerald-400" : "text-slate-500"
                    }`}
                  >
                    {team.rank}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <TeamLogo name={team.name} size={20} />
                      <span
                        className={`font-semibold text-sm ${
                          inPlayoff ? "text-slate-100" : "text-slate-300"
                        }`}
                      >
                        {team.name}
                      </span>
                      {streak && (
                        <span
                          className={`text-[11px] font-medium tabular-nums ${
                            streak.includes("승")
                              ? "text-emerald-400"
                              : streak.includes("패")
                              ? "text-rose-400"
                              : "text-amber-400"
                          }`}
                        >
                          {streak}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="text-center tabular-nums px-3 py-2.5 text-slate-300 text-sm">
                    {team.games}
                  </td>
                  <td className="text-center tabular-nums px-3 py-2.5 text-slate-300 text-sm font-medium">
                    {team.wins}
                  </td>
                  <td className="text-center tabular-nums px-3 py-2.5 text-slate-300 text-sm">
                    {team.losses}
                  </td>
                  <td className="text-center tabular-nums px-3 py-2.5 text-slate-300 text-sm hidden sm:table-cell">
                    {team.draws}
                  </td>
                  <td className="text-center tabular-nums px-3 py-2.5 text-slate-200 text-sm font-medium">
                    {fmtWinRate(team.winRate)}
                  </td>
                  <td className="text-center tabular-nums px-3 py-2.5 text-slate-300 text-sm">
                    {fmtGb(team.gamesBehind)}
                  </td>
                  <td className="text-center tabular-nums px-3 py-2.5 text-slate-500 text-sm hidden md:table-cell">
                    {team.remainingGames}
                  </td>
                  {hasForm && (
                    <td className="text-center px-3 py-2.5">
                      <FormDots form={teamForm} />
                    </td>
                  )}
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
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
    staleTime: isToday ? 5 * 60_000 : Infinity,
    retry: (_, err) => !(err instanceof NotFoundError),
  });

  const { data: gamesData, isLoading: gamesLoading } = useQuery({
    queryKey: ["games", date],
    queryFn: () => fetchGames(date),
    enabled: date !== "",
    staleTime: isToday ? 60_000 : Infinity,
    retry: false,
  });

  const { data: formData } = useQuery({
    queryKey: ["form"],
    queryFn: fetchForm,
    enabled: date !== "",
    staleTime: 5 * 60_000,
    retry: false,
  });

  const isNotFound = isError && error instanceof NotFoundError;
  const showSkeleton = date === "" || isLoading;
  const form = formData?.form ?? {};

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
        <div className="rounded-xl border border-slate-800 p-12 text-center text-sm text-slate-500">
          해당 날짜 데이터가 없습니다.
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-4 text-sm text-rose-400">
          {error instanceof Error ? error.message : "오류가 발생했습니다."}
        </div>
      ) : data?.teams ? (
        <div className="space-y-10">
          {!isToday && data.date !== date && (
            <p className="text-xs text-amber-500 text-center">
              가장 가까운 <span className="font-medium">{data.date}</span>{" "}
              데이터를 표시합니다.
            </p>
          )}

          {/* 오늘의 경기 */}
          {(gamesLoading || (gamesData?.games?.length ?? 0) > 0) && (
            <TodayGamesSection
              games={gamesData?.games ?? []}
              loading={gamesLoading && !gamesData}
            />
          )}

          {/* 매직 보드 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight">매직 보드</h2>
            <MagicBoardTable teams={data.teams} />
          </section>

          {/* 순위표 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight">순위표</h2>
            <EnhancedStandings teams={data.teams} form={form} />
          </section>
        </div>
      ) : null}
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────

function BoardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-7 w-32" />
      <div className="rounded-xl overflow-hidden border border-slate-800">
        {Array.from({ length: 11 }).map((_, i) => (
          <div key={i} className="flex border-b border-slate-800/50 last:border-0">
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
