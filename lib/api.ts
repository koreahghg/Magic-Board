import { NextResponse } from "next/server";

export function errResponse(err: unknown, status = 500): NextResponse {
  const message = err instanceof Error ? err.message : "Unknown error";
  return NextResponse.json({ error: message }, { status });
}
