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

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

type RazorpayNotes = Record<string, string | number | boolean | null | undefined>;

function getNotesFromRazorpayOrder(order: unknown): RazorpayNotes {
  if (!isRecord(order)) return {};
  const notes = order["notes"];
  if (!isRecord(notes)) return {};
  return notes as RazorpayNotes;
}

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
  if (!keyId || !keySecret) {
    throw new Error("Missing Razorpay env (RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET)");
  }
  return { keyId, keySecret, instance: new Razorpay({ key_id: keyId, key_secret: keySecret }) };
}

export async function POST(req: NextRequest) {
  try {
    const token = getBearer(req);
    if (!token) return j({ ok: false, error: "Unauthorized (missing token)" }, 401);

    const body = await req.json().catch(() => null);
    const bodyRec = (body ?? {}) as Record<string, unknown>;

    const qrOrderId = Number(bodyRec.qrOrderId);
    const razorpay_order_id = String(bodyRec.razorpay_order_id || "");
    const razorpay_payment_id = String(bodyRec.razorpay_payment_id || "");
    const razorpay_signature = String(bodyRec.razorpay_signature || "");

    if (!Number.isFinite(qrOrderId) || qrOrderId <= 0) return j({ ok: false, error: "qrOrderId required" }, 400);
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return j({ ok: false, error: "Invalid payload" }, 400);
    }

    // ✅ user from token
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

    // ✅ signature verify
    const { keySecret, instance } = getRazorpay();

    const expected = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return j({ ok: false, error: "Invalid payment signature" }, 400);
    }

    // ✅ fetch order -> validate notes
    try {
      const rpOrderUnknown: unknown = await instance.orders.fetch(razorpay_order_id);
      const notes = getNotesFromRazorpayOrder(rpOrderUnknown);

      if (notes.userId != null && String(notes.userId) !== String(userId)) {
        return j({ ok: false, error: "Order user mismatch" }, 400);
      }
      if (notes.qrOrderId != null && String(notes.qrOrderId) !== String(qrOrderId)) {
        return j({ ok: false, error: "Order id mismatch" }, 400);
      }
    } catch (e: unknown) {
      console.warn("Razorpay order fetch failed/skip:", e);
    }

    const admin = getSupabaseAdmin();

    // ✅ Ensure order exists & belongs to user
    const { data: ord, error: oErr } = await admin
      .from("qr_orders")
      .select("id,user_id,status,payment_method")
      .eq("id", qrOrderId)
      .maybeSingle();

    if (oErr) return j({ ok: false, error: "Order lookup failed", debug: oErr }, 500);
    if (!ord?.id) return j({ ok: false, error: "Order not found" }, 404);
    if (String(ord.user_id || "") !== String(userId)) return j({ ok: false, error: "Forbidden (not your order)" }, 403);

    // ✅ mark verified + set 1 year active
    const { error: upErr } = await admin
      .from("qr_orders")
      .update({
        status: "verified",
        payment_method: "online",
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        paid_at: new Date().toISOString(),
        active_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq("id", qrOrderId);

    if (upErr) return j({ ok: false, error: "Order update failed", debug: upErr }, 500);

    return j({ ok: true });
  } catch (e: unknown) {
    console.error("verify route error:", e);
    return j({ ok: false, error: getErrMessage(e) }, 500);
  }
}
