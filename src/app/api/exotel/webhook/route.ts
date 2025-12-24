import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JsonObj = Record<string, unknown>;
function isObj(x: unknown): x is JsonObj {
  return typeof x === "object" && x !== null;
}

export async function POST(req: Request) {
  const secret = new URL(req.url).searchParams.get("secret") ?? "";
  const expected = process.env.EXOTEL_WEBHOOK_SECRET ?? "";

  if (!expected || secret !== expected) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const raw = (await req.json().catch(() => ({}))) as unknown;
  const body: JsonObj = isObj(raw) ? raw : {};

  // ✅ Use body so eslint won't complain
  // (Later you can store into Supabase using CallSid etc.)
  return NextResponse.json(
    { ok: true, received_keys: Object.keys(body).length },
    { status: 200 }
  );
}
