// app/api/razorpay/order/route.ts
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
  return {
    keyId,
    instance: new Razorpay({ key_id: keyId, key_secret: keySecret }),
  };
}

// purchase amounts (paise)
const PACKS = {
  economy: { label: "Economy", amount: 39900 },
  premium: { label: "Premium", amount: 69900 },
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

/** ✅ Economy delivery fee (paise) */
const ECONOMY_DELIVERY_FEE = 4000;

/** ✅ Safe int */
function clampInt(n: unknown, min: number, max: number) {
  const x = Math.floor(Number(n));
  if (!Number.isFinite(x)) return min;
  return Math.max(min, Math.min(max, x));
}

export async function POST(req: NextRequest) {
  try {
    const token = getBearer(req);
    if (!token) return j({ ok: false, error: "Unauthorized (missing token)" }, 401);

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const qrOrderId = Number(body?.qrOrderId);
    const pack = normalizePack(body?.pack);

    if (!Number.isFinite(qrOrderId) || qrOrderId <= 0) {
      return j({ ok: false, error: "qrOrderId required" }, 400);
    }
    if (!pack) return j({ ok: false, error: "pack must be economy|premium" }, 400);

    const userId = await getUserIdFromToken(token);
    if (!userId) return j({ ok: false, error: "Unauthorized (invalid token)" }, 401);

    const admin = getSupabaseAdmin();

    // ✅ Fetch order & verify ownership (quantity included)
    const { data: ord, error: oErr } = await admin
      .from("qr_orders")
      .select("id,user_id,status,payment_method,razorpay_order_id,quantity")
      .eq("id", qrOrderId)
      .maybeSingle();

    if (oErr) return j({ ok: false, error: "Order lookup failed" }, 500);
    if (!ord?.id) return j({ ok: false, error: "Order not found" }, 404);
    if (String(ord.user_id || "") !== String(userId)) {
      return j({ ok: false, error: "Forbidden (not your order)" }, 403);
    }

    // ✅ allow only online pending
    const pm = String(ord.payment_method || "").toLowerCase();
    if (!(pm === "online" || pm === "razorpay")) {
      return j({ ok: false, error: "Order payment method is not online." }, 400);
    }
    if (ord.status !== "pending_payment") {
      return j({ ok: false, error: "Order is not pending payment." }, 400);
    }

    // ✅ IMPORTANT: compute amount using DB quantity (server is source of truth)
    const qty = clampInt(ord.quantity ?? 1, 1, 99);

    const baseAmount = PACKS[pack].amount * qty;

    // ✅ Delivery: ONLY economy, premium is free
    const deliveryFee = pack === "economy" ? ECONOMY_DELIVERY_FEE : 0;

    // ✅ Final amount (paise)
    const amount = baseAmount + deliveryFee;

    const { keyId, instance } = getRazorpay();

    // ✅ Create razorpay order
    const rpOrder = await instance.orders.create({
      amount,
      currency: "INR",
      receipt: makeReceipt(qrOrderId),
      notes: {
        qrOrderId: String(qrOrderId),
        userId: String(userId),
        pack,
        quantity: String(qty),
        deliveryFeePaise: String(deliveryFee),
        baseAmountPaise: String(baseAmount),
        finalAmountPaise: String(amount),
      },
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

    if (upErr) return j({ ok: false, error: "Failed to update order" }, 500);

    return j({
      ok: true,
      keyId,
      order: rpOrder,
      pack,
      quantity: qty,
      deliveryFeePaise: deliveryFee,
      amountPaise: amount,
    });
  } catch (e: unknown) {
    console.error("razorpay order error:", e);
    return j({ ok: false, error: getErrMessage(e) }, 500);
  }
}
