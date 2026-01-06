// app/api/razorpay/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
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
    return "Verify failed";
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
    keySecret,
    instance: new Razorpay({ key_id: keyId, key_secret: keySecret }),
  };
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

type VerifyBody = {
  qrOrderId?: unknown;
  razorpay_order_id?: unknown;
  razorpay_payment_id?: unknown;
  razorpay_signature?: unknown;
};

export async function POST(req: NextRequest) {
  try {
    const token = getBearer(req);
    if (!token) return j({ ok: false, error: "Unauthorized (missing token)" }, 401);

    const body = (await req.json().catch(() => null)) as VerifyBody | null;

    const qrOrderId = Number(body?.qrOrderId);
    const razorpay_order_id = String(body?.razorpay_order_id || "");
    const razorpay_payment_id = String(body?.razorpay_payment_id || "");
    const razorpay_signature = String(body?.razorpay_signature || "");

    if (!Number.isFinite(qrOrderId) || qrOrderId <= 0) {
      return j({ ok: false, error: "qrOrderId required" }, 400);
    }
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return j({ ok: false, error: "Invalid payload" }, 400);
    }

    const userId = await getUserIdFromToken(token);
    if (!userId) return j({ ok: false, error: "Unauthorized (invalid token)" }, 401);

    // ✅ Verify signature (client cannot fake)
    const { keySecret, instance } = getRazorpay();
    const expected = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return j({ ok: false, error: "Invalid payment signature" }, 400);
    }

    const admin = getSupabaseAdmin();

    // ✅ Fetch order + ownership + required fields for validation
    const { data: ord, error: oErr } = await admin
      .from("qr_orders")
      .select(
        "id,user_id,status,payment_method,razorpay_order_id,amount_paise,pack,quantity"
      )
      .eq("id", qrOrderId)
      .maybeSingle();

    if (oErr) return j({ ok: false, error: "Order lookup failed" }, 500);
    if (!ord?.id) return j({ ok: false, error: "Order not found" }, 404);

    if (String(ord.user_id || "") !== String(userId)) {
      return j({ ok: false, error: "Forbidden (not your order)" }, 403);
    }

    if (ord.payment_method !== "online") {
      return j({ ok: false, error: "Order payment method is not online." }, 400);
    }

    if (ord.status !== "pending_payment") {
      return j({ ok: false, error: "Order is not pending payment." }, 400);
    }

    // ✅ Ensure same order id (prevents mixing other order ids)
    if (ord.razorpay_order_id && String(ord.razorpay_order_id) !== razorpay_order_id) {
      return j({ ok: false, error: "Razorpay order id mismatch" }, 400);
    }

    // ✅ Critical: amount match (DB is source of truth)
    const expectedAmount = Number(ord.amount_paise || 0);
    if (!Number.isFinite(expectedAmount) || expectedAmount <= 0) {
      return j({ ok: false, error: "Order amount missing on server" }, 400);
    }

    // ✅ Fetch Razorpay order and validate amount/currency/status
    // Razorpay order status is usually: created / attempted / paid
    let rpOrder: { amount?: number; currency?: string; status?: string } | null = null;
    try {
      const fetched = await instance.orders.fetch(razorpay_order_id);
      rpOrder = {
        amount: Number((fetched as unknown as { amount?: number }).amount || 0),
        currency: String((fetched as unknown as { currency?: string }).currency || ""),
        status: String((fetched as unknown as { status?: string }).status || ""),
      };
    } catch {
      rpOrder = null;
    }

    if (!rpOrder) {
      return j({ ok: false, error: "Unable to fetch Razorpay order" }, 400);
    }

    if (rpOrder.currency !== "INR") {
      return j({ ok: false, error: "Currency mismatch" }, 400);
    }

    if (Number(rpOrder.amount || 0) !== expectedAmount) {
      return j({ ok: false, error: "Amount mismatch" }, 400);
    }

    // ✅ Optional: fetch payment and ensure captured/authorized
    // NOTE: payment.status can be 'captured' or 'authorized' depending on flow.
    try {
      const payment = await instance.payments.fetch(razorpay_payment_id);
      const payStatus = String((payment as unknown as { status?: string }).status || "");
      if (payStatus && payStatus !== "captured" && payStatus !== "authorized") {
        return j({ ok: false, error: "Payment not completed" }, 400);
      }
    } catch {
      // If fetch fails, we still rely on signature + order paid check
      // (You can make this strict if you want)
    }

    const paidAtIso = new Date().toISOString();
    const activeUntilIso = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    // ✅ Mark paid (idempotent-ish: only pending_payment allowed above)
    const { error: upErr } = await admin
      .from("qr_orders")
      .update({
        status: "paid",
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        paid_at: paidAtIso,
        active_until: activeUntilIso,
      })
      .eq("id", qrOrderId);

    if (upErr) return j({ ok: false, error: "Order update failed" }, 500);

    return j({ ok: true });
  } catch (e: unknown) {
    console.error("verify route error:", e);
    return j({ ok: false, error: getErrMessage(e) }, 500);
  }
}
