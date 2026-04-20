// src/app/get-qr/order/page.tsx
import OrderAuthGate from "./ui/OrderAuthGate";

export const metadata = {
  title: "Place QR Order | Veyoscan",
  description: "Complete your Veyoscan QR order with delivery and contact details.",
};

export default async function OrderPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; pack?: string }>;
}) {
  const sp = await searchParams;
  const type = (sp?.type || "vehicle").toLowerCase();
  const pack = (sp?.pack || "").toLowerCase();

  return (
    <main className="min-h-screen bg-[#0a0f1a] text-white">
      {/* background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(79,70,229,0.18),transparent_35%),radial-gradient(circle_at_80%_40%,rgba(34,211,238,0.12),transparent_45%)] pointer-events-none" />

      <section className="relative pt-16 sm:pt-20 lg:pt-24 pb-16">
        <div className="mx-auto w-full max-w-[1400px] 2xl:max-w-[1600px] px-4 sm:px-6 lg:px-10">
          <header className="mb-8">
            <p className="text-xs text-white/60 uppercase tracking-[0.22em]">
              ORDER
            </p>
            <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              Place Veyoscan QR Order
            </h1>
            <p className="mt-3 max-w-3xl text-sm sm:text-base text-white/70">
              Enter delivery and contact details to complete your Veyoscan QR order.
              A confirmation email will be sent after successful order placement.
            </p>
          </header>

          {/* Auth gate → form */}
          <OrderAuthGate type={type} pack={pack} />
        </div>
      </section>
    </main>
  );
}