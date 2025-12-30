import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function j(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function getBearer(req: NextRequest) {
  const h = req.headers.get("authorization") || "";
  return h.startsWith("Bearer ") ? h.slice(7) : null;
}

function getErrMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return "Server error";
  }
}

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
  if (!keyId || !keySecret) {
    throw new Error("Missing Razorpay env (RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET)");
  }
  return { keyId, instance: new Razorpay({ key_id: keyId, key_secret: keySecret }) };
}

const PACKS = {
  economy: { label: "Economy", amount: 39900 }, // paise
  premium: { label: "Premium", amount: 69900 }, // paise
} as const;

type PackKey = keyof typeof PACKS;

function normalizePack(x: unknown): PackKey | null {
  const v = String(x || "").toLowerCase().trim();
  if (v === "economy" || v === "premium") return v;
  return null;
}

function makeReceipt(orderId: number) {
  const ts = Date.now().toString().slice(-10);
  return `qr_${orderId}_${ts}`.slice(0, 40);
}

export async function POST(req: NextRequest) {
  try {
    const token = getBearer(req);
    if (!token) return j({ ok: false, error: "Unauthorized (missing token)" }, 401);

    const body = await req.json().catch(() => null);
    const qrOrderId = Number((body as Record<string, unknown> | null)?.qrOrderId);
    const pack = normalizePack((body as Record<string, unknown> | null)?.pack);

    if (!Number.isFinite(qrOrderId) || qrOrderId <= 0) return j({ ok: false, error: "qrOrderId required" }, 400);
    if (!pack) return j({ ok: false, error: "pack must be economy|premium" }, 400);

    // ✅ get user from token (anon client)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    if (!supabaseUrl || !anon) return j({ ok: false, error: "Supabase env missing" }, 500);

    const sbUser = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userRes, error: userErr } = await sbUser.auth.getUser();
    const userId = userRes?.user?.id || null;
    if (userErr || !userId) return j({ ok: false, error: "Unauthorized (invalid token)" }, 401);

    const admin = getSupabaseAdmin();

    // ✅ Fetch order row & verify ownership
    const { data: ord, error: oErr } = await admin
      .from("qr_orders")
      .select("id,user_id,status,payment_method")
      .eq("id", qrOrderId)
      .maybeSingle();

    if (oErr) return j({ ok: false, error: "Order lookup failed", debug: oErr }, 500);
    if (!ord?.id) return j({ ok: false, error: "Order not found" }, 404);
    if (String(ord.user_id || "") !== String(userId)) return j({ ok: false, error: "Forbidden (not your order)" }, 403);

    // allow only online/pending
    if (ord.payment_method !== "online") {
      return j({ ok: false, error: "This order is not set to online payment." }, 400);
    }
    if (ord.status !== "pending_payment") {
      return j({ ok: false, error: "Order is not pending payment." }, 400);
    }

    const { keyId, instance } = getRazorpay();
    const amount = PACKS[pack].amount;

    const rpOrder = await instance.orders.create({
      amount,
      currency: "INR",
      receipt: makeReceipt(qrOrderId),
      notes: { qrOrderId: String(qrOrderId), userId: String(userId), pack },
    });

    // ✅ store razorpay order id + pack + amount
    const { error: upErr } = await admin
      .from("qr_orders")
      .update({
        pack,
        amount_paise: amount,
        razorpay_order_id: rpOrder.id,
      })
      .eq("id", qrOrderId);

    if (upErr) return j({ ok: false, error: "Failed to update order", debug: upErr }, 500);

    return j({ ok: true, keyId, order: rpOrder, pack });
  } catch (e: unknown) {
    console.error("razorpay order error:", e);
    return j({ ok: false, error: getErrMessage(e) }, 500);
  }
}
