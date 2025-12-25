// app/get-qr/order/page.tsx
import OrderForm from "./ui/OrderForm";

export const metadata = {
  title: "Place QR Order | QRatech",
  description: "Complete your QR order with contact and address details.",
};

export default async function OrderPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const sp = await searchParams;                // ✅ await it
  const type = (sp?.type || "personal").toLowerCase();

  return (
    <main className="min-h-screen bg-[#0a0f1a] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(79,70,229,0.14),transparent_30%),radial-gradient(circle_at_80%_40%,rgba(34,211,238,0.10),transparent_40%)] pointer-events-none" />
      <section className="relative pt-24 pb-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-6">
            <p className="text-sm text-gray-300 uppercase tracking-wide">Order Type</p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {type.charAt(0).toUpperCase() + type.slice(1)} QR
            </h1>
            <p className="mt-2 text-gray-300">
              Fill the form below. Use the <strong>same QRatech Email</strong> that’s linked to your QRatech ID.
            </p>
          </header>

          <OrderForm type={type} />
        </div>
      </section>
    </main>
  );
}