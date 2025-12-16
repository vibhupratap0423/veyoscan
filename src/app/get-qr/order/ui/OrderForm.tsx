"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function cx(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

const SIZES = [
  { key: "small", label: "Small", sub: "2 × 2 in" },
  { key: "medium", label: "Medium", sub: "3 × 3 in" },
  { key: "large", label: "Large", sub: "4 × 4 in" },
];

type Props = { type: string };

function SuccessModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      <div className="relative w-full max-w-[480px] overflow-hidden rounded-2xl border border-white/10 bg-[#0d1220] shadow-2xl">
        <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-3">
          <div className="mb-3 grid place-items-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/30">
              <svg className="h-6 w-6 text-emerald-400" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M9.55 17.6 4.9 13l1.4-1.45 3.25 3.2 7.2-7.25L18.1 9z"
                />
              </svg>
            </div>
          </div>
          <h3 className="text-center text-lg sm:text-xl font-semibold text-white">
            Order placed successfully
          </h3>
          <p className="mt-1 text-center text-sm text-gray-300">
            You’ll get verification on your <b>QRatech Email</b> ASAP.
          </p>
        </div>
        <div className="border-t border-white/10 bg-white/[0.03] px-4 py-3 sm:px-6 sm:py-3 text-right">
          <button
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-[15px] font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrderForm({ type }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const prettyType = useMemo(
    () => type.charAt(0).toUpperCase() + type.slice(1),
    [type]
  );

  const [form, setForm] = useState({
    qratechEmail: "",
    size: "medium",
    quantity: 1,
    name: "",
    phone: "",
    altPhone: "",
    addressLine1: "",
    addressLine2: "",
    district: "",
    pincode: "",
    paymentMethod: "cod" as "cod" | "razorpay",
  });

  const errors: Record<string, string> = {};
  if (!form.qratechEmail.trim()) errors.qratechEmail = "QRatech Email is required";
  if (!form.name.trim()) errors.name = "Full Name is required";
  if (!form.phone.trim()) errors.phone = "Mobile is required";
  if (!form.addressLine1.trim()) errors.addressLine1 = "Address Line 1 is required";
  if (!form.district.trim()) errors.district = "District is required";
  if (!form.pincode.trim()) errors.pincode = "Pincode is required";
  const invalid = Object.keys(errors).length > 0;

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: name === "quantity" ? Math.max(1, Number(value)) : value,
    }));
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) =>
    setTouched((t) => ({ ...t, [e.target.name]: true }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      qratechEmail: true,
      name: true,
      phone: true,
      addressLine1: true,
      district: true,
      pincode: true,
    });
    if (invalid) return;
    setLoading(true);
    setServerError(null);
    try {
      const res = await fetch("/api/qr-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType: type,
          qratechEmail: form.qratechEmail,
          size: form.size,
          quantity: form.quantity,
          name: form.name,
          phone: form.phone,
          altPhone: form.altPhone || null,
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2 || null,
          district: form.district,
          pincode: form.pincode,
          paymentMethod: form.paymentMethod,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return setServerError(j?.error || "Database error");
      setShowSuccess(true);
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  const closeSuccess = () => {
    setShowSuccess(false);
    router.push("/get-qr");
  };

  return (
    <>
      <form
        onSubmit={submit}
        className="
          mx-auto w-full
          rounded-2xl border border-white/10 bg-white/[0.045]
          p-4 sm:p-6 md:p-8
          shadow-lg
        "
      >
        {/* header strip */}
        <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
              {prettyType} QR
            </span>
            <span className="text-xs text-gray-400">
              Outdoor-grade • High contrast • Fast scan
            </span>
          </div>
          <span className="text-xs text-gray-400">
            * Required fields
          </span>
        </div>

        {/* QRatech Email */}
        <div className="mb-6">
          <label htmlFor="qratechEmail" className="block text-sm text-gray-200">
            QRatech Email <span className="text-rose-400">*</span>
          </label>
          <input
            id="qratechEmail"
            type="email"
            name="qratechEmail"
            inputMode="email"
            autoComplete="email"
            placeholder="use the same email linked to your QRatech ID"
            value={form.qratechEmail}
            onChange={onChange}
            onBlur={onBlur}
            className={cx(
              "mt-2 block w-full rounded-lg bg-white/10 px-3 py-2.5 sm:py-3",
              "text-[15px] text-white placeholder:text-gray-400 outline-none",
              "ring-1 focus:ring-2",
              touched.qratechEmail && errors.qratechEmail
                ? "ring-rose-400/70 focus:ring-rose-400"
                : "ring-white/10 focus:ring-indigo-400"
            )}
          />
          {touched.qratechEmail && errors.qratechEmail && (
            <p className="mt-1 text-xs text-rose-400">{errors.qratechEmail}</p>
          )}
        </div>

        {/* Size & Quantity */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <p className="mb-2 text-sm text-gray-200">Size</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {SIZES.map((s) => (
                <label
                  key={s.key}
                  className={cx(
                    "flex items-center justify-between gap-3 rounded-xl border px-4 py-3",
                    "transition-colors",
                    form.size === s.key
                      ? "border-indigo-400/50 bg-indigo-500/10"
                      : "border-white/10 bg-white/[0.06] hover:bg-white/[0.08]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      className="accent-indigo-500 h-4 w-4"
                      name="size"
                      value={s.key}
                      checked={form.size === s.key}
                      onChange={onChange}
                    />
                    <div>
                      <p className="text-sm font-medium text-white">{s.label}</p>
                      <p className="text-xs text-gray-400">{s.sub}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm text-gray-200">
              Quantity
            </label>
            <input
              id="quantity"
              type="number"
              min={1}
              max={200}
              name="quantity"
              value={form.quantity}
              onChange={onChange}
              onBlur={onBlur}
              className="mt-2 block w-full rounded-lg bg-white/10 px-3 py-2.5 sm:py-3 text-[15px] text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-400"
            />
            <p className="mt-1 text-xs text-gray-400">
              Bulk? Increase quantity or place multiple orders.
            </p>
          </div>
        </div>

        {/* Contact */}
        <div className="mb-6">
          <p className="mb-2 text-sm font-medium text-white/90">Contact</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm text-gray-200">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={onChange}
                onBlur={onBlur}
                className={cx(
                  "mt-2 block w-full rounded-lg bg-white/10 px-3 py-2.5 sm:py-3 text-[15px] text-white outline-none ring-1 focus:ring-2",
                  touched.name && errors.name
                    ? "ring-rose-400/70 focus:ring-rose-400"
                    : "ring-white/10 focus:ring-indigo-400"
                )}
              />
              {touched.name && errors.name && (
                <p className="mt-1 text-xs text-rose-400">{errors.name}</p>
              )}
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm text-gray-200">
                Mobile <span className="text-rose-400">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={onChange}
                onBlur={onBlur}
                className={cx(
                  "mt-2 block w-full rounded-lg bg-white/10 px-3 py-2.5 sm:py-3 text-[15px] text-white outline-none ring-1 focus:ring-2",
                  touched.phone && errors.phone
                    ? "ring-rose-400/70 focus:ring-rose-400"
                    : "ring-white/10 focus:ring-indigo-400"
                )}
              />
              {touched.phone && errors.phone && (
                <p className="mt-1 text-xs text-rose-400">{errors.phone}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="altPhone" className="block text-sm text-gray-200">
                Alternative Mobile
              </label>
              <input
                id="altPhone"
                name="altPhone"
                inputMode="tel"
                value={form.altPhone}
                onChange={onChange}
                onBlur={onBlur}
                className="mt-2 block w-full rounded-lg bg-white/10 px-3 py-2.5 sm:py-3 text-[15px] text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="mb-6">
          <p className="mb-2 text-sm font-medium text-white/90">Shipping Address</p>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="addressLine1" className="block text-sm text-gray-200">
                Address Line 1 <span className="text-rose-400">*</span>
              </label>
              <input
                id="addressLine1"
                name="addressLine1"
                value={form.addressLine1}
                onChange={onChange}
                onBlur={onBlur}
                className={cx(
                  "mt-2 block w-full rounded-lg bg-white/10 px-3 py-2.5 sm:py-3 text-[15px] text-white outline-none ring-1 focus:ring-2",
                  touched.addressLine1 && errors.addressLine1
                    ? "ring-rose-400/70 focus:ring-rose-400"
                    : "ring-white/10 focus:ring-indigo-400"
                )}
              />
              {touched.addressLine1 && errors.addressLine1 && (
                <p className="mt-1 text-xs text-rose-400">
                  {errors.addressLine1}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="addressLine2" className="block text-sm text-gray-200">
                Address Line 2
              </label>
              <input
                id="addressLine2"
                name="addressLine2"
                value={form.addressLine2}
                onChange={onChange}
                onBlur={onBlur}
                className="mt-2 block w-full rounded-lg bg-white/10 px-3 py-2.5 sm:py-3 text-[15px] text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="district" className="block text-sm text-gray-200">
                  District <span className="text-rose-400">*</span>
                </label>
                <input
                  id="district"
                  name="district"
                  value={form.district}
                  onChange={onChange}
                  onBlur={onBlur}
                  className={cx(
                    "mt-2 block w-full rounded-lg bg-white/10 px-3 py-2.5 sm:py-3 text-[15px] text-white outline-none ring-1 focus:ring-2",
                    touched.district && errors.district
                      ? "ring-rose-400/70 focus:ring-rose-400"
                      : "ring-white/10 focus:ring-indigo-400"
                  )}
                />
                {touched.district && errors.district && (
                  <p className="mt-1 text-xs text-rose-400">{errors.district}</p>
                )}
              </div>
              <div>
                <label htmlFor="pincode" className="block text-sm text-gray-200">
                  Pincode <span className="text-rose-400">*</span>
                </label>
                <input
                  id="pincode"
                  name="pincode"
                  inputMode="numeric"
                  value={form.pincode}
                  onChange={onChange}
                  onBlur={onBlur}
                  className={cx(
                    "mt-2 block w-full rounded-lg bg-white/10 px-3 py-2.5 sm:py-3 text-[15px] text-white outline-none ring-1 focus:ring-2",
                    touched.pincode && errors.pincode
                      ? "ring-rose-400/70 focus:ring-rose-400"
                      : "ring-white/10 focus:ring-indigo-400"
                  )}
                />
                {touched.pincode && errors.pincode && (
                  <p className="mt-1 text-xs text-rose-400">{errors.pincode}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="mb-5">
          <p className="mb-2 text-sm font-medium text-white/90">Payment</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label
              className={cx(
                "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                form.paymentMethod === "cod"
                  ? "border-indigo-400/50 bg-indigo-500/10"
                  : "border-white/10 bg-white/[0.06] hover:bg-white/[0.08]"
              )}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="cod"
                checked={form.paymentMethod === "cod"}
                onChange={onChange}
                className="h-4 w-4 accent-indigo-500"
              />
              <span className="text-sm">Cash on Delivery (COD)</span>
            </label>

            <label className="flex cursor-not-allowed items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 opacity-60">
              <input type="radio" disabled className="h-4 w-4" />
              <span className="text-sm">
                Razorpay — <em>Coming Soon</em>
              </span>
            </label>
          </div>
        </div>

        {/* server error */}
        {serverError && (
          <p className="mb-3 text-sm text-rose-400">⚠️ {serverError}</p>
        )}

        {/* submit */}
        <button
          type="submit"
          disabled={loading}
          className={cx(
            "w-full rounded-xl px-4 py-3 text-[15px] font-semibold text-white",
            "focus:outline-none focus:ring-2 focus:ring-indigo-300",
            loading ? "bg-indigo-500/60" : "bg-indigo-600 hover:bg-indigo-500"
          )}
        >
          {loading ? "Placing Order..." : "Place Order"}
        </button>

        <p className="mt-3 text-xs text-gray-400">
          Admin will verify your order via your <b>QRatech Email</b> and generate
          the QR. Razorpay will be added soon.
        </p>
      </form>

      <SuccessModal open={showSuccess} onClose={closeSuccess} />
    </>
  );
}
