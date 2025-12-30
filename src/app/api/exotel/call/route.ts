import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function digits(v: string) {
  return v.replace(/[^\d]/g, "");
}

function toMsisdn(v: string) {
  const d = digits(v);
  return d.length === 10 ? `91${d}` : d;
}

function isUuidLike(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    v
  );
}

function isInventoryCode(v: string) {
  return /^QR_[A-Z0-9]{6,}$/i.test(v);
}

type ExotelConnectResponse = {
  Call?: { Sid?: string };
};

function safeJsonParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  return typeof err === "string" ? err : "Unknown error";
}

export async function POST(req: Request) {
  try {
    const rawBody: unknown = await req.json().catch(() => ({}));
    const body =
      typeof rawBody === "object" && rawBody !== null
        ? (rawBody as Record<string, unknown>)
        : {};

    const uidRaw = ((body.uid as string | undefined) ?? "").trim();
    const plateRaw = ((body.plate as string | undefined) ?? "").trim();

    const caller = ((body.caller_phone as string | undefined) ?? "").trim();
    const mode = ((body.mode as string | undefined) ?? "").trim();

    if (!caller || (mode !== "owner" && mode !== "emergency")) {
      return NextResponse.json(
        { ok: false, error: "Invalid request" },
        { status: 400 }
      );
    }

    let ownerPhone = "";
    let emergencyPhone = "";

    /* ---------------- UID BASED FLOW (UUID or Inventory Code) ---------------- */
    if (uidRaw) {
      let resolvedUserId: string | null = null;

      // 1) uid is already a UUID
      if (isUuidLike(uidRaw)) {
        resolvedUserId = uidRaw;
      }

      // 2) uid is inventory code like QR_XXXX
      if (!resolvedUserId && isInventoryCode(uidRaw)) {
        const { data: inv, error: invErr } = await supabase
          .from("qr_inventory")
          .select("assigned_to,status")
          .eq("code", uidRaw)
          .single(); // ✅ unique code

        if (invErr) {
          return NextResponse.json(
            { ok: false, error: "Inventory lookup failed" },
            { status: 500 }
          );
        }

        if (!inv?.assigned_to) {
          return NextResponse.json(
            { ok: false, error: "QR not activated yet" },
            { status: 400 }
          );
        }

        resolvedUserId = String(inv.assigned_to);
      }

      // 3) uid was provided but not resolvable
      if (!resolvedUserId) {
        return NextResponse.json(
          { ok: false, error: "Invalid UID / QR code" },
          { status: 400 }
        );
      }

      // 4) fetch profile phones
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("phone, emergency_phone")
        .eq("id", resolvedUserId)
        .single();

      if (error || !profile) {
        return NextResponse.json(
          { ok: false, error: "Profile not found" },
          { status: 404 }
        );
      }

      ownerPhone = profile.phone ?? "";
      emergencyPhone = profile.emergency_phone ?? "";
    }

    /* ---------------- PLATE BASED FLOW (LEGACY SAFE) ---------------- */
    if (!ownerPhone && !emergencyPhone && plateRaw) {
      const { data: vehicle, error: vErr } = await supabase
        .from("vehicles")
        .select("owner_id")
        .eq("plate", plateRaw)
        .maybeSingle();

      if (vErr) {
        return NextResponse.json(
          { ok: false, error: "Vehicle lookup failed" },
          { status: 500 }
        );
      }

      if (!vehicle?.owner_id) {
        return NextResponse.json(
          { ok: false, error: "Vehicle not found" },
          { status: 404 }
        );
      }

      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("phone, emergency_phone")
        .eq("id", vehicle.owner_id)
        .single();

      if (pErr || !profile) {
        return NextResponse.json(
          { ok: false, error: "Profile not found" },
          { status: 404 }
        );
      }

      ownerPhone = profile.phone ?? "";
      emergencyPhone = profile.emergency_phone ?? "";
    }

    const to =
      mode === "emergency"
        ? emergencyPhone || ownerPhone
        : ownerPhone || emergencyPhone;

    if (!to) {
      return NextResponse.json(
        { ok: false, error: "No target number" },
        { status: 400 }
      );
    }

    /* ---------------- EXOTEL CALL ---------------- */
    const params = new URLSearchParams();
    params.set("From", toMsisdn(caller));
    params.set("To", toMsisdn(to));
    params.set("CallerId", process.env.EXOTEL_EXOPHONE!);
    params.set("CallType", "trans");

    const auth = Buffer.from(
      `${process.env.EXOTEL_API_KEY}:${process.env.EXOTEL_API_TOKEN}`
    ).toString("base64");

    const res = await fetch(
      `https://${process.env.EXOTEL_SUBDOMAIN}/v1/Accounts/${process.env.EXOTEL_SID}/Calls/connect.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );

    const text = await res.text();
    const parsed = safeJsonParse<ExotelConnectResponse>(text);

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: "Exotel failed", exotel: parsed ?? { raw: text } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      exotel_call_sid: parsed?.Call?.Sid ?? null,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: getErrorMessage(e) },
      { status: 500 }
    );
  }
}
