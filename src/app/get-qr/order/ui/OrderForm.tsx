"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

/* ---------------- Types ---------------- */

type OrderTypeKey =
  | "vehicle"
  | "shop"
  | "personal"
  | "house"
  | "event"
  | "lost"
  | "other";

type SizeType = "small" | "medium" | "large";
type PayMethod = "cod" | "online";
type PackKey = "economy" | "premium";

type OrderFormProps = {
  type?: string;
  pack?: string;
};

// Razorpay types (no `any`)
type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: string;
  currency: "INR";
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
  modal?: { ondismiss?: () => void };
};

type RazorpayInstance = { open: () => void };
type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

function getRazorpayCtor(): RazorpayConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { Razorpay?: RazorpayConstructor };
  return w.Razorpay ?? null;
}

/* ---------------- Utils ---------------- */

function onlyDigits(v: string) {
  return (v ?? "").replace(/[^\d]/g, "");
}

function clampInt(n: number, min: number, max: number) {
  const x = Math.floor(Number.isFinite(n) ? n : min);
  return Math.max(min, Math.min(max, x));
}

function normalizePack(p?: string): PackKey {
  const v = (p ?? "").toLowerCase().trim();
  if (v === "economy" || v === "premium") return v;
  return "economy";
}

function normalizeOrderType(t?: string): OrderTypeKey {
  const v = (t ?? "").toLowerCase().trim();
  if (v === "vehicle") return "vehicle";
  if (v === "shop" || v === "business") return "shop";
  if (v === "personal") return "personal";
  if (v === "house" || v === "society") return "house";
  if (v === "event" || v === "ticket") return "event";
  if (v === "lost" || v === "lostfound") return "lost";
  if (v.startsWith("other")) return "other";
  return "vehicle";
}

function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

const PACKS: Record<
  PackKey,
  { title: string; purchaseRupee: number; renewalRupee: number; tagline: string }
> = {
  economy: {
    title: "Economy Pack",
    purchaseRupee: 399,
    renewalRupee: 199,
    tagline: "Great for personal use",
  },
  premium: {
    title: "Premium Pack",
    purchaseRupee: 699,
    renewalRupee: 299,
    tagline: "Best for businesses & customization",
  },
};

const ORDER_TYPES: Array<{ key: OrderTypeKey; label: string; hint: string }> = [
  { key: "vehicle", label: "Vehicle QR", hint: "For cars, bikes, helmets, parking." },
  { key: "shop", label: "Shop / Business QR", hint: "For storefronts, counters & banners." },
  { key: "personal", label: "Personal QR", hint: "Share contact/profile in one scan." },
  { key: "house", label: "House / Society QR", hint: "For gates, visitors, emergency info." },
  { key: "event", label: "Event / Ticket QR", hint: "Check-ins & access control." },
  { key: "lost", label: "Lost & Found QR", hint: "For bags, gadgets, valuables." },
  { key: "other", label: "Other", hint: "Custom label (pet, bag, etc.)" },
];

async function loadRazorpayScript() {
  if (typeof window === "undefined") return false;
  if (getRazorpayCtor()) return true;

  return await new Promise<boolean>((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/* ---------------- UI Bits ---------------- */

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-sm text-white/70">{children}</label>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3",
        "text-white outline-none placeholder:text-white/35",
        "focus:ring-2 focus:ring-indigo-500/40",
        props.className || "",
      ].join(" ")}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[
        "w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3",
        "text-white outline-none focus:ring-2 focus:ring-indigo-500/40",
        props.className || "",
      ].join(" ")}
    />
  );
}

function ChoiceCard({
  title,
  sub,
  selected,
  onClick,
}: {
  title: string;
  sub: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-2xl border p-4 text-left transition",
        "min-h-[86px] flex items-start justify-between gap-3",
        selected
          ? "border-indigo-400/50 bg-indigo-500/10 shadow-[0_0_0_4px_rgba(79,70,229,0.12)]"
          : "border-white/10 bg-white/5 hover:bg-white/10",
      ].join(" ")}
    >
      <div>
        <p className="text-sm sm:text-base font-semibold text-white">{title}</p>
        <p className="mt-1 text-[11px] sm:text-xs text-white/60">{sub}</p>
      </div>
      <div
        className={[
          "mt-1 h-5 w-5 rounded-full border flex items-center justify-center shrink-0",
          selected ? "border-indigo-400/70" : "border-white/25",
        ].join(" ")}
        aria-hidden
      >
        {selected ? <span className="h-2.5 w-2.5 rounded-full bg-indigo-400" /> : null}
      </div>
    </button>
  );
}

function QuantityStepper({
  value,
  min = 1,
  max = 99,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  const v = clampInt(value, min, max);

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0b1220] px-2 py-2">
      <button
        type="button"
        onClick={() => onChange(clampInt(v - 1, min, max))}
        disabled={v <= min}
        className="h-11 w-11 rounded-xl border border-white/10 bg-white/5 text-white/90 hover:bg-white/10 disabled:opacity-40"
        aria-label="Decrease quantity"
      >
        −
      </button>

      <div className="flex-1 px-2">
        <div className="text-center text-white font-semibold">{v}</div>
        <div className="mt-0.5 text-center text-[10px] text-white/45">
          Min {min}, Max {max}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange(clampInt(v + 1, min, max))}
        disabled={v >= max}
        className="h-11 w-11 rounded-xl border border-white/10 bg-white/5 text-white/90 hover:bg-white/10 disabled:opacity-40"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}

/* ---------------- Component ---------------- */

export default function OrderForm({ type, pack }: OrderFormProps) {
  const router = useRouter();

  const [email, setEmail] = useState("");

  const [packKey, setPackKey] = useState<PackKey>(() => normalizePack(pack));
  const [orderType, setOrderType] = useState<OrderTypeKey>(() => normalizeOrderType(type));
  const [otherType, setOtherType] = useState("");

  const [size, setSize] = useState<SizeType>("medium");
  const [quantity, setQuantity] = useState<number>(1);

  const [paymentMethod, setPaymentMethod] = useState<PayMethod>("cod");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [altPhone, setAltPhone] = useState("");

  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [district, setDistrict] = useState("");
  const [pincode, setPincode] = useState("");

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalText, setModalText] = useState("");

  useEffect(() => setOrderType(normalizeOrderType(type)), [type]);
  useEffect(() => setPackKey(normalizePack(pack)), [pack]);

  const qty = useMemo(() => clampInt(quantity, 1, 99), [quantity]);

  const totalAmount = useMemo(() => PACKS[packKey].purchaseRupee * qty, [packKey, qty]);

  const canSubmit = useMemo(() => {
    if (!fullName.trim()) return false;
    if (onlyDigits(phone).length !== 10) return false;
    if (!address1.trim()) return false;
    if (!district.trim()) return false;
    if (onlyDigits(pincode).length !== 6) return false;
    if (orderType === "other" && !otherType.trim()) return false;
    return true;
  }, [fullName, phone, address1, district, pincode, orderType, otherType]);

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
        setErr("Please sign in to place an order.");
        setLoading(false);
        return;
      }

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

  function openModal(text: string) {
    setModalText(text);
    setModalOpen(true);

    setTimeout(() => {
      router.push("/get-qr");
    }, 1400);
  }

  function orderTypeToSend(): string {
    if (orderType !== "other") return orderType;
    const clean = otherType.trim().slice(0, 40);
    return clean ? `other:${clean}` : "other";
  }

  async function createOrderRow(): Promise<number> {
    const { data: sessionRes } = await supabase.auth.getSession();
    const accessToken = sessionRes.session?.access_token || "";
    if (!accessToken) throw new Error("Session expired. Please sign in again.");

    // ✅ packKey optional to store (server can store pack, helpful for backoffice)
    const payload = {
      orderType: orderTypeToSend(),
      qratechEmail: email,
      size,
      quantity: qty,
      paymentMethod,
      pack: packKey,
      name: fullName.trim(),
      phone: onlyDigits(phone),
      altPhone: altPhone ? onlyDigits(altPhone) : "",
      addressLine1: address1.trim(),
      addressLine2: address2.trim(),
      district: district.trim(),
      pincode: onlyDigits(pincode),
    };

    const res = await fetch("/api/qr-orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; id?: unknown };

    const ok = res.ok && (json.ok === true || typeof json.id !== "undefined");
    if (!ok) throw new Error(json?.error || "Order creation failed.");

    const id = Number(json?.id);
    if (!Number.isFinite(id) || id <= 0) throw new Error("Invalid order id returned.");
    return id;
  }

  async function startRazorpayFlow(orderId: number) {
    const ok = await loadRazorpayScript();
    if (!ok) throw new Error("Unable to load Razorpay. Please try again.");

    const RazorpayCtor = getRazorpayCtor();
    if (!RazorpayCtor) throw new Error("Razorpay is not available. Please refresh and try again.");

    const { data: sessionRes } = await supabase.auth.getSession();
    const accessToken = sessionRes.session?.access_token || "";
    if (!accessToken) throw new Error("Session expired. Please sign in again.");

    // ✅ IMPORTANT: server must create rp order with amount based on DB quantity
    const r1 = await fetch("/api/razorpay/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        qrOrderId: orderId,
        pack: packKey,
        // quantity client sends for convenience, but server should trust DB.
        quantity: qty,
      }),
    });

    const j1 = (await r1.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      keyId?: string;
      order?: { id?: string; amount?: number };
    };

    if (!r1.ok || !j1?.ok) throw new Error(j1?.error || "Payment initialization failed.");

    const keyId = String(j1.keyId || "");
    const rpOrderId = String(j1?.order?.id || "");
    const amountPaise = Number(j1?.order?.amount || 0);

    if (!keyId || !rpOrderId || !Number.isFinite(amountPaise) || amountPaise <= 0) {
      throw new Error("Payment details missing from server.");
    }

    const options: RazorpayOptions = {
      key: keyId,
      amount: String(amountPaise),
      currency: "INR",
      name: "QRatech",
      description: `${PACKS[packKey].title} • Qty ${qty}`,
      order_id: rpOrderId,
      prefill: {
        name: fullName.trim(),
        email: email,
        contact: onlyDigits(phone),
      },
      theme: { color: "#4f46e5" },
      handler: async (response: RazorpaySuccessResponse) => {
        try {
          const r2 = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              qrOrderId: orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const j2 = (await r2.json().catch(() => ({}))) as { ok?: boolean; error?: string };
          if (!r2.ok || !j2?.ok) throw new Error(j2?.error || "Payment verification failed.");

          openModal(
            "Order placed successfully.\nA confirmation email will be sent shortly.\nRedirecting to Get QR…"
          );
        } catch {
          openModal(
            "Payment completed, but verification failed.\nPlease contact support.\nRedirecting to Get QR…"
          );
        }
      },
      modal: {
        ondismiss: () => {
          // user closed payment popup
        },
      },
    };

    const rzp = new RazorpayCtor(options);
    rzp.open();
  }

  async function submit() {
    if (!canSubmit) return;

    setBusy(true);
    setErr(null);

    try {
      const orderId = await createOrderRow();

      if (paymentMethod === "cod") {
        openModal(
          "Order placed successfully.\nPayment method: Cash on Delivery.\nRedirecting to Get QR…"
        );
        return;
      }

      await startRazorpayFlow(orderId);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="p-6 text-center text-white/70">Loading…</div>;

  return (
    <div className="w-full">
      {/* container */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:gap-10 lg:grid-cols-12">
          {/* LEFT: FORM */}
          <div className="lg:col-span-8">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">Place QR Order</h2>
                  <p className="mt-2 text-sm text-white/65">
                    Enter delivery and contact details. A confirmation email will be sent after successful
                    order placement.
                  </p>
                </div>
                <span className="hidden sm:inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                  Secure Checkout
                </span>
              </div>

              {err && (
                <div className="mt-6 rounded-2xl border border-rose-200/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                  {err}
                </div>
              )}

              {/* Package */}
              <div className="mt-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white">Package</h3>
                    <p className="mt-1 text-xs sm:text-sm text-white/60">Choose a plan for your QR sticker.</p>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <ChoiceCard
                    title="Economy"
                    sub="₹399 purchase • ₹199/year renewal"
                    selected={packKey === "economy"}
                    onClick={() => setPackKey("economy")}
                  />
                  <ChoiceCard
                    title="Premium"
                    sub="₹699 purchase • ₹299/year renewal"
                    selected={packKey === "premium"}
                    onClick={() => setPackKey("premium")}
                  />
                </div>
              </div>

              {/* Type + Size + Quantity */}
              <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <div>
                  <div className="AssistanceTitle">
                    <h3 className="text-base sm:text-lg font-semibold text-white">Order Type</h3>
                    <p className="mt-1 text-xs sm:text-sm text-white/60">Select where the QR will be used.</p>
                  </div>

                  <div className="mt-3 grid gap-3">
                    <Select
                      value={orderType}
                      onChange={(e) => setOrderType(e.target.value as OrderTypeKey)}
                    >
                      {ORDER_TYPES.map((t) => (
                        <option key={t.key} value={t.key} style={{ backgroundColor: "#0b1220" }}>
                          {t.label}
                        </option>
                      ))}
                    </Select>

                    <p className="text-xs text-white/55">
                      {ORDER_TYPES.find((x) => x.key === orderType)?.hint ?? ""}
                    </p>

                    {orderType === "other" && (
                      <Input
                        value={otherType}
                        onChange={(e) => setOtherType(e.target.value)}
                        placeholder="Enter a label (e.g., Pet QR, Bag QR)"
                      />
                    )}
                  </div>
                </div>

                <div className="grid gap-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white">Size</h3>
                    <p className="mt-1 text-xs sm:text-sm text-white/60">Sticker size selection.</p>
                    <div className="mt-3">
                      <Select value={size} onChange={(e) => setSize(e.target.value as SizeType)}>
                        <option value="small" style={{ backgroundColor: "#0b1220" }}>
                          Small
                        </option>
                        <option value="medium" style={{ backgroundColor: "#0b1220" }}>
                          Medium
                        </option>
                        <option value="large" style={{ backgroundColor: "#0b1220" }}>
                          Large
                        </option>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white">Quantity</h3>
                    <p className="mt-1 text-xs sm:text-sm text-white/60">Use + / − to update quantity.</p>
                    <div className="mt-3">
                      <QuantityStepper value={qty} min={1} max={99} onChange={setQuantity} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="mt-10">
                <h3 className="text-base sm:text-lg font-semibold text-white">Contact</h3>
                <p className="mt-1 text-xs sm:text-sm text-white/60">
                  We may contact you for delivery updates.
                </p>

                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Full Name</Label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
                  </div>

                  <div className="grid gap-2">
                    <Label>Phone</Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(onlyDigits(e.target.value))}
                      placeholder="10-digit mobile"
                      inputMode="numeric"
                      maxLength={10}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Alternate Phone (optional)</Label>
                    <Input
                      value={altPhone}
                      onChange={(e) => setAltPhone(onlyDigits(e.target.value))}
                      placeholder="Optional"
                      inputMode="numeric"
                      maxLength={10}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input value={email} readOnly />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="mt-10">
                <h3 className="text-base sm:text-lg font-semibold text-white">Address</h3>
                <p className="mt-1 text-xs sm:text-sm text-white/60">Delivery address for your order.</p>

                <div className="mt-4 grid gap-5">
                  <div className="grid gap-2">
                    <Label>Address Line 1</Label>
                    <Input
                      value={address1}
                      onChange={(e) => setAddress1(e.target.value)}
                      placeholder="House no., street, building"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Address Line 2 (optional)</Label>
                    <Input
                      value={address2}
                      onChange={(e) => setAddress2(e.target.value)}
                      placeholder="Area, landmark"
                    />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label>District</Label>
                      <Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="District" />
                    </div>

                    <div className="grid gap-2">
                      <Label>Pincode</Label>
                      <Input
                        value={pincode}
                        onChange={(e) => setPincode(onlyDigits(e.target.value))}
                        placeholder="6-digit pincode"
                        inputMode="numeric"
                        maxLength={6}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="mt-10">
                <h3 className="text-base sm:text-lg font-semibold text-white">Payment</h3>
                <p className="mt-1 text-xs sm:text-sm text-white/60">Choose one method to complete your order.</p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <ChoiceCard
                    title="Cash on Delivery"
                    sub="Pay when delivered"
                    selected={paymentMethod === "cod"}
                    onClick={() => setPaymentMethod("cod")}
                  />
                  <ChoiceCard
                    title="Online (Razorpay)"
                    sub="UPI / Card / Netbanking"
                    selected={paymentMethod === "online"}
                    onClick={() => setPaymentMethod("online")}
                  />
                </div>
              </div>

              {/* CTA */}
              <div className="mt-10 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-white/45">
                  By placing the order, you agree to receive confirmation via email/phone.
                </p>

                <button
                  onClick={() => void submit()}
                  disabled={!canSubmit || busy}
                  className="w-full sm:w-auto rounded-2xl bg-white px-7 py-3 font-semibold text-black hover:bg-white/90 disabled:opacity-60"
                >
                  {busy ? "Processing…" : paymentMethod === "online" ? "Pay & Place Order" : "Place Order"}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: SUMMARY */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24 rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
              <p className="text-sm text-white/70">Order Summary</p>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-lg font-semibold text-white">{PACKS[packKey].title}</p>
                <p className="mt-1 text-xs text-white/55">{PACKS[packKey].tagline}</p>

                <div className="mt-5 flex items-center justify-between">
                  <span className="text-sm text-white/70">Quantity</span>
                  <span className="font-semibold text-white">{qty}</span>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-white/70">Payable</span>
                  <span className="text-3xl font-extrabold text-white">{formatINR(totalAmount)}</span>
                </div>

                <div className="mt-4 text-xs text-white/55">
                  Renewal:{" "}
                  <span className="font-semibold text-white">{formatINR(PACKS[packKey].renewalRupee)}/year</span>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-sm font-semibold text-white">Selected Type</p>
                <p className="mt-1 text-sm text-white/75">
                  {ORDER_TYPES.find((x) => x.key === orderType)?.label ?? "—"}
                  {orderType === "other" && otherType.trim() ? ` — ${otherType.trim()}` : ""}
                </p>
                <p className="mt-2 text-xs text-white/55">After success, you will be redirected to Get QR.</p>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-sm font-semibold text-white">Account Email</p>
                <p className="mt-2 text-sm text-white/80 break-all">{email || "—"}</p>
                <p className="mt-2 text-xs text-white/55">Confirmation updates will be sent here.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-white">Success</p>
                <p className="mt-2 whitespace-pre-line text-sm text-white/80">{modalText}</p>
              </div>
              <button
                className="rounded-lg border border-white/10 px-2 py-1 text-white/80 hover:bg-white/5"
                onClick={() => setModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="mt-5 flex items-center justify-end">
              <button
                className="rounded-2xl bg-white px-4 py-2 font-semibold text-black hover:bg-white/90"
                onClick={() => router.push("/get-qr")}
              >
                Go to Get QR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
