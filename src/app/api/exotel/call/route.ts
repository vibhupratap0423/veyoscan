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

    const uid = (body.uid as string | undefined) ?? null;
    const plate = (body.plate as string | undefined) ?? null;

    const caller = (body.caller_phone as string | undefined) ?? "";
    const mode = (body.mode as string | undefined) ?? "";

    if (!caller || !mode) {
      return NextResponse.json(
        { ok: false, error: "Invalid request" },
        { status: 400 }
      );
    }

    let ownerPhone = "";
    let emergencyPhone = "";

    /* ---------------- UID BASED FLOW (NEW) ---------------- */
    if (uid) {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("phone, emergency_phone")
        .eq("id", uid)
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
    if (!uid && plate) {
      const { data: vehicle } = await supabase
        .from("vehicles")
        .select("owner_id")
        .eq("plate", plate)
        .single();

      if (!vehicle) {
        return NextResponse.json(
          { ok: false, error: "Vehicle not found" },
          { status: 404 }
        );
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("phone, emergency_phone")
        .eq("id", vehicle.owner_id)
        .single();

      ownerPhone = profile?.phone ?? "";
      emergencyPhone = profile?.emergency_phone ?? "";
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
