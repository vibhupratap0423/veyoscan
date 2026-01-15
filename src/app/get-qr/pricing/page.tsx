// src/app/get-qr/pricing/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Pricing | QRatech QR Stickers",
  description:
    "Choose Economy or Premium QR sticker pack. Secure online payment via Razorpay or COD.",
};

function PriceTag({ value }: { value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="text-4xl md:text-5xl font-extrabold tracking-tight">
        {value}
      </span>
      <span className="text-sm text-white/70">/purchase</span>
    </span>
  );
}

function Check({ text }: { text: string }) {
  return (
    <div className="flex gap-3">
      <span className="mt-[2px] inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
        ✓
      </span>
      <span className="text-sm text-white/80">{text}</span>
    </div>
  );
}

export default function PricingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0f1a] text-white">
      {/* background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(79,70,229,0.18),transparent_35%),radial-gradient(circle_at_80%_40%,rgba(34,211,238,0.14),transparent_45%),radial-gradient(circle_at_40%_90%,rgba(16,185,129,0.12),transparent_40%)]" />
        <div className="absolute inset-0 opacity-[0.15] [background-image:linear-gradient(to_right,rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      <section className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
            QRatech QR Stickers • Secure Checkout
          </p>

          <h1 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight">
            Choose the right plan for your QR stickers
          </h1>

          <p className="mt-3 text-sm md:text-base text-white/70">
            Ek baar purchase karo, QR sticker + activation included. Aage yearly
            activation charge ke saath QR active rahega.
          </p>
        </div>

        {/* cards */}
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {/* Economy */}
          <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-7 shadow-[0_18px_60px_rgba(0,0,0,0.35)] transition hover:bg-white/7">
            <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl transition group-hover:bg-indigo-400/25" />

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-white/70">Economy Pack</p>
                <h2 className="mt-1 text-2xl font-bold">Best for personal use</h2>
              </div>

              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
                Most Popular
              </span>
            </div>

            <div className="mt-6">
              <PriceTag value="₹399" />
              <p className="mt-2 text-sm text-white/70">
                One time purchase (2 stickers + first year activation included)
              </p>
            </div>

            <div className="mt-6 grid gap-3">
              <Check text="2 stickers included" />
              <Check text="1st year activation included" />
              <Check text="Fast order processing" />
              <Check text="Support on WhatsApp/Email" />
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-sm text-white/80">
                Renewal: <span className="font-semibold">₹199 / year</span>
              </p>
              <p className="mt-1 text-xs text-white/60">
                Features continue with yearly activation.
              </p>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/get-qr/order?type=vehicle&pack=economy"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90 transition"
              >
                Buy Economy
              </Link>

              <Link
                href="/get-qr/order?type=vehicle&pack=economy"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 hover:bg-white/10 transition"
              >
                Order via COD / Online
              </Link>
            </div>

            <p className="mt-4 text-xs text-white/55">
              Payment options: COD or Razorpay (UPI/Card/Netbanking)
            </p>
          </div>

          {/* Premium */}
          <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-7 shadow-[0_18px_60px_rgba(0,0,0,0.35)] transition hover:bg-white/7">
            <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-cyan-500/18 blur-3xl transition group-hover:bg-cyan-400/22" />

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-white/70">Premium Pack</p>
                <h2 className="mt-1 text-2xl font-bold">Best for businesses</h2>
              </div>

              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
                Premium
              </span>
            </div>

            <div className="mt-6">
              <PriceTag value="₹699" />
              <p className="mt-2 text-sm text-white/70">
                One time purchase (customized sticker option available)
              </p>
            </div>

            <div className="mt-6 grid gap-3">
              <Check text="Premium sticker quality" />
              <Check text="Customized sticker option" />
              <Check text="Priority processing & support" />
              <Check text="Premium QR features access" />
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-sm text-white/80">
                Renewal: <span className="font-semibold">₹299 / year</span>
              </p>
              <p className="mt-1 text-xs text-white/60">
                Features continue with yearly activation.
              </p>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/get-qr/order?type=vehicle&pack=premium"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90 transition"
              >
                Buy Premium
              </Link>

              <Link
                href="/get-qr/order?type=vehicle&pack=premium"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 hover:bg-white/10 transition"
              >
                Order via COD / Online
              </Link>
            </div>

            <p className="mt-4 text-xs text-white/55">
              Payment options: COD or Razorpay (UPI/Card/Netbanking)
            </p>
          </div>
        </div>

        {/* bottom note */}
        <div className="mt-10 mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
          <p className="text-sm text-white/80 font-semibold">
            Need help choosing a plan?
          </p>
          <p className="mt-2 text-sm text-white/70">
            Economy personal users ke liye best hai. Premium business/branding ke
            liye. Order ke baad email pe confirmation aa jayega.
          </p>

          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/get-qr/order?type=vehicle&pack=economy"
              className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 hover:bg-white/10 transition"
            >
              Start with Economy
            </Link>
            <Link
              href="/get-qr/order?type=vehicle&pack=premium"
              className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90 transition"
            >
              Go Premium
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
