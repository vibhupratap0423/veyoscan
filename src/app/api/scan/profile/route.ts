import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function j(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function isUuidLike(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    v
  );
}

// ✅ typed request body (no any)
type ScanProfileBody = {
  uid?: unknown;
  code?: unknown;
};

function getErrMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  if (typeof e === "object" && e && "message" in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return "Failed";
}

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const bodyUnknown: unknown = await req.json().catch(() => ({}));
    const body: ScanProfileBody =
      typeof bodyUnknown === "object" && bodyUnknown !== null
        ? (bodyUnknown as ScanProfileBody)
        : {};

    const uidRaw = typeof body.uid === "string" ? body.uid.trim() : "";
    const codeRaw =
      typeof body.code === "string" ? body.code.trim().toUpperCase() : "";

    // ✅ If inventory code: only reveal if activated (assigned)
    if (codeRaw) {
      const { data: inv, error: invErr } = await supabaseAdmin
        .from("qr_inventory")
        .select("assigned_to,status")
        .eq("code", codeRaw)
        .maybeSingle();

      if (invErr) return j({ ok: false, error: invErr.message }, 500);

      const ownerId = inv?.assigned_to ? String(inv.assigned_to) : "";
      if (!ownerId || inv?.status !== "assigned") {
        return j({ ok: true, blood_group: null }, 200);
      }

      const { data: prof, error: pErr } = await supabaseAdmin
        .from("profiles")
        .select("blood_group")
        .eq("id", ownerId)
        .maybeSingle<{ blood_group: string | null }>();

      if (pErr) return j({ ok: false, error: pErr.message }, 500);

      return j({ ok: true, blood_group: prof?.blood_group ?? null }, 200);
    }

    // ✅ Direct UID mode
    if (!uidRaw || !isUuidLike(uidRaw)) {
      return j({ ok: true, blood_group: null }, 200);
    }

    const { data: prof, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("blood_group")
      .eq("id", uidRaw)
      .maybeSingle<{ blood_group: string | null }>();

    if (pErr) return j({ ok: false, error: pErr.message }, 500);

    return j({ ok: true, blood_group: prof?.blood_group ?? null }, 200);
  } catch (e: unknown) {
    return j({ ok: false, error: getErrMessage(e) }, 500);
  }
}
