// app/api/qr-orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type JsonObj = Record<string, unknown>;

function isObj(x: unknown): x is JsonObj {
  return typeof x === "object" && x !== null;
}

function getStr(body: JsonObj, key: string): string {
  const v = body[key];
  return typeof v === "string" ? v.trim() : "";
}

function getNum(body: JsonObj, key: string, fallback: number): number {
  const v = body[key];
  const n =
    typeof v === "number" ? v : typeof v === "string" ? Number(v) : fallback;
  return Number.isFinite(n) ? n : fallback;
}

function j(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function getBearer(req: NextRequest) {
  const h = req.headers.get("authorization") || "";
  return h.startsWith("Bearer ") ? h.slice(7) : null;
}

async function getUserIdFromToken(token: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!supabaseUrl || !anon) throw new Error("Supabase env missing");

  const sbUser = createClient(supabaseUrl, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await sbUser.auth.getUser();
  const userId = data?.user?.id || null;
  if (error || !userId) return null;
  return userId;
}

export async function POST(req: NextRequest) {
  try {
    // ✅ Require auth (so user_id can be set)
    const token = getBearer(req);
    if (!token) return j({ ok: false, error: "Unauthorized (missing token)" }, 401);

    const userId = await getUserIdFromToken(token);
    if (!userId) return j({ ok: false, error: "Unauthorized (invalid token)" }, 401);

    const raw = (await req.json().catch(() => ({}))) as unknown;
    const body: JsonObj = isObj(raw) ? raw : {};

    const required = [
      "orderType",
      "qratechEmail",
      "size",
      "name",
      "phone",
      "addressLine1",
      "district",
      "pincode",
    ];

    for (const k of required) {
      const val = getStr(body, k);
      if (!val) return j({ ok: false, error: `Missing field: ${k}` }, 400);
    }

    const quantity = Math.max(1, getNum(body, "quantity", 1));
    if (!Number.isFinite(quantity) || quantity < 1) {
      return j({ ok: false, error: "Invalid quantity" }, 400);
    }

    // ✅ Standardize payment method
    const paymentMethodRaw = getStr(body, "paymentMethod").toLowerCase();
    const payment_method: "cod" | "online" =
      paymentMethodRaw === "cod" ? "cod" : "online";

    const order_type = getStr(body, "orderType").toLowerCase();
    const qratech_email = getStr(body, "qratechEmail");
    const size = getStr(body, "size");
    const full_name = getStr(body, "name");
    const phone = getStr(body, "phone");
    const district = getStr(body, "district");
    const pincode = getStr(body, "pincode");

    const altPhoneVal = body["altPhone"];
    const alt_phone =
      typeof altPhoneVal === "string" && altPhoneVal.trim()
        ? altPhoneVal.trim()
        : null;

    const addressLine2Val = body["addressLine2"];
    const address_line2 =
      typeof addressLine2Val === "string" && addressLine2Val.trim()
        ? addressLine2Val.trim()
        : null;

    const address_line1 = getStr(body, "addressLine1");

    const admin = getSupabaseAdmin();

    const { data, error } = await admin
      .from("qr_orders")
      .insert({
        user_id: userId, // ✅ IMPORTANT
        qratech_email,
        order_type,
        size,
        quantity,
        full_name,
        phone,
        alt_phone,
        address_line1,
        address_line2,
        district,
        pincode,
        payment_method,
        status: payment_method === "cod" ? "pending_cod" : "pending_payment",
      })
      .select("id,status,payment_method")
      .single();

    if (error) {
      console.error("[qr-orders] insert error:", error);
      return j({ ok: false, error: "Database error" }, 500);
    }

    return j({
      ok: true,
      message: "Order placed successfully",
      id: data?.id ?? null,
      status: data?.status ?? null,
      payment_method: data?.payment_method ?? null,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Invalid request";
    return j({ ok: false, error: message }, 400);
  }
}
