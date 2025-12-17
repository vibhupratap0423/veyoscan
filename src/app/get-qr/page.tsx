// app/get-qr/page.tsx
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Order Your QR | QRatech",
  description: "Choose your use-case and order a professional QR from QRatech.",
};

const CARDS = [
  { key: "vehicle",   title: "Vehicle QR",          desc: "Windshield / tank / helmet placement. Outdoor-grade & quick scan.", img: "/images/wrong parking.jpg" },
  { key: "shop",      title: "Shop / Business QR",  desc: "Counter, door, banner — accept calls/messages and feedback instantly.", img: "/images/shop.png" },
  { key: "personal",  title: "Personal QR",         desc: "Share your profile/contact with a single scan.", img: "/images/persnol.jpg" },
  { key: "house",     title: "House / Society QR",  desc: "Visitor connect, emergency contact, security gate workflows.", img: "/images/house.jpg" },
  { key: "event",     title: "Event / Ticket QR",   desc: "Check-in, access control & lead capture.", img: "/images/event.jpg" },
  { key: "lostfound", title: "Lost & Found QR",     desc: "Mark items with a callback QR.", img: "/images/lost1.png" },
];

export default function GetQrLanding() {
  return (
    <main className="min-h-screen bg-[#0a0f1a] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(79,70,229,0.14),transparent_30%),radial-gradient(circle_at_80%_40%,rgba(34,211,238,0.10),transparent_40%)] pointer-events-none" />

      <section className="relative pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Order Your <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-white bg-clip-text text-transparent">QR</span>
            </h1>
            <p className="mt-3 text-gray-300 max-w-2xl">
              Select your category below. You’ll be taken to a short, type-specific form.
            </p>
          </header>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CARDS.map((c) => (
              <div key={c.key} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 hover:bg-white/[0.07] transition-colors">
                <div className="aspect-[16/9] relative">
                  <Image src={c.img} alt={c.title} fill className="object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a] via-transparent to-transparent" />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold">{c.title}</h3>
                  <p className="mt-1 text-sm text-gray-300">{c.desc}</p>
                  <div className="mt-4">
                    <Link
                      href={`/get-qr/order?type=${encodeURIComponent(c.key)}`}
                      prefetch={false}
                      className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    >
                      Order QR
                    </Link>
                  </div>
                </div>
                <div className="pointer-events-none absolute -z-10 -right-10 -bottom-10 h-40 w-40 rounded-full blur-[90px] bg-cyan-400/20" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
