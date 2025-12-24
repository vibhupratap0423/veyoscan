"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type OrderType = "vehicle" | "shop" | "event";
type SizeType = "small" | "medium" | "large";
type PayMethod = "cod" | "online";

type OrderFormProps = {
  type?: string; // ✅ accept prop from page.tsx
};

function onlyDigits(v: string) {
  return (v ?? "").replace(/[^\d]/g, "");
}

// ✅ map incoming `type` -> allowed OrderType
function normalizeOrderType(t?: string): OrderType {
  const v = (t ?? "").toLowerCase().trim();
  if (v === "vehicle" || v === "shop" || v === "event") return v;
  return "vehicle";
}

export default function OrderForm({ type }: OrderFormProps) {
  const [userId, setUserId] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  // ✅ initial from prop
  const [orderType, setOrderType] = useState<OrderType>(() =>
    normalizeOrderType(type)
  );

  const [size, setSize] = useState<SizeType>("medium");
  const [quantity, setQuantity] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<PayMethod>("cod");

  const [fullName, setFullName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [altPhone, setAltPhone] = useState<string>("");

  const [address1, setAddress1] = useState<string>("");
  const [address2, setAddress2] = useState<string>("");
  const [district, setDistrict] = useState<string>("");
  const [pincode, setPincode] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // ✅ if query param changes, keep dropdown in sync
  useEffect(() => {
    setOrderType(normalizeOrderType(type));
  }, [type]);

  const canSubmit = useMemo(() => {
    if (!userId) return false;
    if (!fullName.trim()) return false;
    if (onlyDigits(phone).length !== 10) return false;
    if (pincode && onlyDigits(pincode).length !== 6) return false;
    if (quantity < 1) return false;
    return true;
  }, [userId, fullName, phone, pincode, quantity]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      setErr(null);

      const { data: auth, error: aErr } = await supabase.auth.getUser();
      if (aErr) {
        setErr(aErr.message);
        setLoading(false);
        return;
      }

      const user = auth?.user;
      if (!user) {
        setErr("Please login first to place an order.");
        setLoading(false);
        return;
      }

      setUserId(user.id);
      setEmail(user.email ?? "");

      const { data: p } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .maybeSingle();

      if (p) {
        setFullName(p.full_name ?? "");
        setPhone(p.phone ?? "");
      }

      setLoading(false);
    }

    void init();
  }, []);

  async function submit() {
    if (!canSubmit) return;

    setBusy(true);
    setErr(null);
    setMsg(null);

    try {
      const payload = {
        user_id: userId,
        order_type: orderType,
        size,
        quantity,
        payment_method: paymentMethod,

        full_name: fullName.trim(),
        phone: onlyDigits(phone),
        alt_phone: altPhone ? onlyDigits(altPhone) : null,

        address_line1: address1.trim() || null,
        address_line2: address2.trim() || null,
        district: district.trim() || null,
        pincode: pincode ? onlyDigits(pincode) : null,

        qratech_email: email || null,
        status: paymentMethod === "cod" ? "pending_cod" : "pending",
      };

      const { data, error } = await supabase
        .from("qr_orders")
        .insert(payload)
        .select("id")
        .single();

      if (error) throw new Error(error.message);

      setMsg(`Order placed successfully. Order ID: ${data?.id}`);
      setQuantity(1);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Order failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="p-6 text-center text-zinc-300">Loading…</div>;
  }

  if (!userId) {
    return (
      <div className="mx-auto max-w-md p-6">
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-700">
          {err || "Not logged in"}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Place QR Order</h1>
        <p className="text-sm text-zinc-300 mt-1">
          Linked UID: <span className="font-mono">{userId}</span>
        </p>
      </div>

      {err && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {err}
        </div>
      )}
      {msg && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {msg}
        </div>
      )}

      <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        {/* order type */}
        <div className="grid gap-2">
          <label className="text-sm text-zinc-300">Order Type</label>
          <select
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            value={orderType}
            onChange={(e) => setOrderType(e.target.value as OrderType)}
          >
            <option value="vehicle">Vehicle</option>
            <option value="shop">Shop</option>
            <option value="event">Event</option>
          </select>
        </div>

        {/* size / qty */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm text-zinc-300">Size</label>
            <select
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2"
              value={size}
              onChange={(e) => setSize(e.target.value as SizeType)}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-zinc-300">Quantity</label>
            <input
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value || 1))}
            />
          </div>
        </div>

        {/* payment */}
        <div className="grid gap-2">
          <label className="text-sm text-zinc-300">Payment Method</label>
          <select
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PayMethod)}
          >
            <option value="cod">COD</option>
            <option value="online">Online</option>
          </select>
        </div>

        {/* user */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm text-zinc-300">Full Name</label>
            <input
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-zinc-300">Phone</label>
            <input
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2"
              value={phone}
              onChange={(e) => setPhone(onlyDigits(e.target.value))}
              placeholder="10-digit mobile"
              inputMode="numeric"
              maxLength={10}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-zinc-300">Alt Phone</label>
            <input
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2"
              value={altPhone}
              onChange={(e) => setAltPhone(onlyDigits(e.target.value))}
              placeholder="Optional"
              inputMode="numeric"
              maxLength={10}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-zinc-300">Email</label>
            <input
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2"
              value={email}
              readOnly
            />
          </div>
        </div>

        {/* address */}
        <div className="grid gap-3">
          <div className="grid gap-2">
            <label className="text-sm text-zinc-300">Address line 1</label>
            <input
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2"
              value={address1}
              onChange={(e) => setAddress1(e.target.value)}
              placeholder="House, street"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-zinc-300">Address line 2</label>
            <input
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2"
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
              placeholder="Area, landmark (optional)"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm text-zinc-300">District</label>
              <input
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="District"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm text-zinc-300">Pincode</label>
              <input
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                value={pincode}
                onChange={(e) => setPincode(onlyDigits(e.target.value))}
                placeholder="6-digit pincode"
                inputMode="numeric"
                maxLength={6}
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => void submit()}
          disabled={!canSubmit || busy}
          className="rounded-xl bg-white text-black px-4 py-3 font-semibold disabled:opacity-60"
        >
          {busy ? "Placing Order…" : "Place Order"}
        </button>
      </div>
    </div>
  );
}
