"use client";

import { useState } from "react";
import type React from "react";

type OrderPayload = {
  fullName: string;
  email: string;
  phone: string;
  businessName?: string;
  qrContent: string;
  style: "classic" | "rounded" | "dots";
  color: "indigo" | "cyan" | "white";
  size: "small" | "medium" | "large";
  quantity: number;
  notes?: string;
  address?: string;
};

type ApiOk = { message?: string; id?: string | null };
type ApiErr = { error?: string };

const ACCENT_PRIMARY = "#4f46e5";
const ACCENT_CYAN = "#22d3ee";

function isObj(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

export default function GetQrForm() {
  const [data, setData] = useState<OrderPayload>({
    fullName: "",
    email: "",
    phone: "",
    businessName: "",
    qrContent: "",
    style: "classic",
    color: "indigo",
    size: "medium",
    quantity: 1,
    notes: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setData((d) => ({
      ...d,
      [name]: name === "quantity" ? Number(value) : value,
    }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/qr-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const raw = (await res.json().catch(() => ({}))) as unknown;
      const j = isObj(raw) ? raw : {};

      if (res.ok) {
        const ok = j as ApiOk;
        setResult({
          ok: true,
          message: ok.message ?? "Order submitted! We'll get back to you shortly.",
        });

        setData({
          fullName: "",
          email: "",
          phone: "",
          businessName: "",
          qrContent: "",
          style: "classic",
          color: "indigo",
          size: "medium",
          quantity: 1,
          notes: "",
          address: "",
        });
      } else {
        const err = j as ApiErr;
        setResult({
          ok: false,
          message: err.error ?? "Something went wrong. Please try again.",
        });
      }
    } catch (err: unknown) {
      setResult({
        ok: false,
        message: err instanceof Error ? err.message : "Network error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      {/* background glows (behind) */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute -top-24 right-0 h-72 w-72 rounded-full blur-[120px]"
          style={{ background: ACCENT_PRIMARY, opacity: 0.25 }}
        />
        <div
          className="absolute top-1/3 -left-16 h-72 w-72 rounded-full blur-[120px]"
          style={{ background: ACCENT_CYAN, opacity: 0.25 }}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* LEFT */}
        <div className="space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Get your{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-white bg-clip-text text-transparent">
              Veyoscan
            </span>{" "}
            QR
          </h2>
          <p className="text-gray-300 leading-relaxed">
            Order a professional Veyoscan QR for your vehicle, shop, home, or business. Choose your preferred style, color, and size, and we’ll prepare it for you.
          </p>

          <div className="grid grid-cols-3 gap-4">
            {[
              { k: "Durable Build", v: "Outdoor-ready" },
              { k: "Fast Scanning", v: "High contrast" },
              { k: "Custom QR", v: "URL / Phone / Text" },
            ].map((it) => (
              <div key={it.k} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-gray-400">{it.k}</p>
                <p className="text-base font-semibold">{it.v}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.03] p-6">
            <p className="text-sm text-gray-300 mb-2">Live Preview</p>
            <div className="flex items-center gap-6">
              <div
                className="h-28 w-28 rounded-xl grid place-items-center ring-1 ring-white/10"
                style={{
                  background:
                    data.color === "indigo" ? "#111535" : data.color === "cyan" ? "#082a2f" : "#0c1220",
                }}
              >
                <div className="h-20 w-20 bg-white rounded-sm" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-40 rounded bg-white/20" />
                <div className="h-3 w-52 rounded bg-white/10" />
                <div className="h-3 w-36 rounded bg-white/10" />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: form */}
        <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <h3 className="text-xl font-semibold mb-4">Order Form</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1">
              <label className="text-sm text-gray-300">Full name *</label>
              <input
                required
                name="fullName"
                value={data.fullName}
                onChange={onChange}
                className="mt-1 w-full rounded-lg bg-white/10 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-indigo-400"
              />
            </div>

            <div className="col-span-1">
              <label className="text-sm text-gray-300">Business name</label>
              <input
                name="businessName"
                value={data.businessName}
                onChange={onChange}
                className="mt-1 w-full rounded-lg bg-white/10 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-indigo-400"
              />
            </div>

            <div className="col-span-1">
              <label className="text-sm text-gray-300">Email *</label>
              <input
                required
                type="email"
                name="email"
                value={data.email}
                onChange={onChange}
                className="mt-1 w-full rounded-lg bg-white/10 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-indigo-400"
              />
            </div>

            <div className="col-span-1">
              <label className="text-sm text-gray-300">Phone *</label>
              <input
                required
                name="phone"
                value={data.phone}
                onChange={onChange}
                className="mt-1 w-full rounded-lg bg-white/10 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-indigo-400"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-gray-300">QR content (URL / phone / text) *</label>
              <input
                required
                name="qrContent"
                value={data.qrContent}
                onChange={onChange}
                placeholder="e.g. https://veyoscan.com/u/your-profile"
                className="mt-1 w-full rounded-lg bg-white/10 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-indigo-400"
              />
            </div>

            <div>
              <label className="text-sm text-gray-300">Style</label>
              <select
                name="style"
                value={data.style}
                onChange={onChange}
                className="mt-1 w-full rounded-lg bg-white/10 px-3 py-2 ring-1 ring-white/10 focus:ring-indigo-400"
              >
                <option value="classic">Classic</option>
                <option value="rounded">Rounded</option>
                <option value="dots">Dots</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-300">Color</label>
              <select
                name="color"
                value={data.color}
                onChange={onChange}
                className="mt-1 w-full rounded-lg bg-white/10 px-3 py-2 ring-1 ring-white/10 focus:ring-indigo-400"
              >
                <option value="indigo">Indigo</option>
                <option value="cyan">Cyan</option>
                <option value="white">White</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-300">Size</label>
              <select
                name="size"
                value={data.size}
                onChange={onChange}
                className="mt-1 w-full rounded-lg bg-white/10 px-3 py-2 ring-1 ring-white/10 focus:ring-indigo-400"
              >
                <option value="small">Small (2 x 2 in)</option>
                <option value="medium">Medium (3 x 3 in)</option>
                <option value="large">Large (4 x 4 in)</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-300">Quantity</label>
              <input
                type="number"
                min={1}
                max={100}
                name="quantity"
                value={data.quantity}
                onChange={onChange}
                className="mt-1 w-full rounded-lg bg-white/10 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-indigo-400"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-gray-300">Delivery address</label>
              <textarea
                name="address"
                value={data.address}
                onChange={onChange}
                className="mt-1 w-full rounded-lg bg-white/10 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-indigo-400 h-24"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-gray-300">Notes (optional)</label>
              <textarea
                name="notes"
                value={data.notes}
                onChange={onChange}
                className="mt-1 w-full rounded-lg bg-white/10 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-indigo-400 h-20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Place Order"}
          </button>

          {result && (
            <p className={`mt-3 text-sm ${result.ok ? "text-emerald-400" : "text-rose-400"}`}>
              {result.message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}