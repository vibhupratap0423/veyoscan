// src/app/api/qr-orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type JsonObj = Record<string, unknown>;

function isObj(x: unknown): x is JsonObj {
  return typeof x === "object" && x !== null;
}

function getStr(body: JsonObj, key: string): string {
  const v = body[key];
  if (typeof v !== "string") return "";
  return v.trim();
}

function getNum(body: JsonObj, key: string, fallback: number): number {
  const v = body[key];
  const n =
    typeof v === "number"
      ? v
      : typeof v === "string"
      ? Number(v)
      : fallback;
  return Number.isFinite(n) ? n : fallback;
}

export async function POST(req: NextRequest) {
  try {
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
      if (!val) {
        return NextResponse.json({ error: `Missing field: ${k}` }, { status: 400 });
      }
    }

    const quantity = Math.max(1, getNum(body, "quantity", 1));
    if (!Number.isFinite(quantity) || quantity < 1) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }

    const paymentMethodRaw = getStr(body, "paymentMethod");
    const payment = paymentMethodRaw === "cod" ? "cod" : "razorpay";

    const orderType = getStr(body, "orderType").toLowerCase();
    const qratechEmail = getStr(body, "qratechEmail");
    const size = getStr(body, "size");
    const name = getStr(body, "name");
    const phone = getStr(body, "phone");
    const district = getStr(body, "district");
    const pincode = getStr(body, "pincode");

    const altPhoneVal = body["altPhone"];
    const altPhone = typeof altPhoneVal === "string" && altPhoneVal.trim() ? altPhoneVal.trim() : null;

    const addressLine2Val = body["addressLine2"];
    const addressLine2 =
      typeof addressLine2Val === "string" && addressLine2Val.trim() ? addressLine2Val.trim() : null;

    const { data, error } = await supabaseAdmin
      .from("qr_orders")
      .insert({
        qratech_email: qratechEmail,
        order_type: orderType,
        size,
        quantity,
        full_name: name,
        phone,
        alt_phone: altPhone,
        address_line1: getStr(body, "addressLine1"),
        address_line2: addressLine2,
        district,
        pincode,
        payment_method: payment,
        status: payment === "cod" ? "pending_cod" : "pending_payment",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[qr-orders] insert error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({
      message: "Order placed successfully",
      id: data?.id ?? null,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
