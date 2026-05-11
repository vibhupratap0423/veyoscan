// app/get-qr/page.tsx
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Order Your QR | Veyoscan",
  description:
    "Choose your Veyoscan QR category for vehicle, shop, personal, house, event, or lost and found use. Connect safely without sharing your personal number.",
};

const CARDS = [
  {
    key: "vehicle",
    title: "Vehicle QR",
    desc: "Windshield / tank / helmet placement. Outdoor-grade and quick scan.",
    img: "/images/wrong parking.jpg",
  },
  {
    key: "shop",
    title: "Shop / Business QR",
    desc: "Counter, door, or banner — accept calls, messages, and feedback instantly.",
    img: "/images/shop.png",
  },
  {
    key: "personal",
    title: "Personal QR",
    desc: "Share your profile or contact details with a single Veyoscan scan.",
    img: "/images/persnol.jpg",
  },
  {
    key: "house",
    title: "House / Society QR",
    desc: "Visitor connect, emergency contact, and security gate workflows.",
    img: "/images/house.jpg",
  },
  {
    key: "event",
    title: "Event / Ticket QR",
    desc: "Check-in, access control, and lead capture made easy.",
    img: "/images/event.jpg",
  },
  {
    key: "lostfound",
    title: "Lost & Found QR",
    desc: "Mark your items with a callback QR for faster recovery.",
    img: "/images/lost2.png",
  },
];

export default function GetQrLanding() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0f1a] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(79,70,229,0.14),transparent_30%),radial-gradient(circle_at_80%_40%,rgba(34,211,238,0.10),transparent_40%)]" />

      <section className="relative pt-10 pb-12 md:pt-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <header className="mb-8">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">
              Privacy-first QR connection
            </p>

            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Order Your{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-white bg-clip-text text-transparent">
                Veyoscan QR
              </span>
            </h1>

            <p className="mt-3 max-w-2xl text-gray-300">
              Select your category below. With Veyoscan, anyone can scan your QR
              and connect with you without seeing your personal number. Calls can
              be routed through masked numbers using Exotel for privacy on both
              sides.
            </p>
          </header>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CARDS.map((c) => (
              <article
                key={c.key}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/[0.07] hover:shadow-[0_20px_60px_rgba(34,211,238,0.10)]"
              >
                <div className="relative aspect-[16/9]">
                  <Image
                    src={c.img}
                    alt={c.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover opacity-90 transition-transform duration-500 group-hover:scale-105 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a] via-[#0a0f1a]/20 to-transparent" />
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-semibold">{c.title}</h3>

                  <p className="mt-1 min-h-[44px] text-sm leading-6 text-gray-300">
                    {c.desc}
                  </p>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href={`/get-qr/${c.key}`}
                      prefetch={false}
                      className="inline-flex items-center justify-center rounded-xl border border-cyan-300/30 bg-white/5 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300"
                    >
                      Read More
                    </Link>

                    <Link
                      href={`/get-qr/order?type=${encodeURIComponent(c.key)}`}
                      prefetch={false}
                      className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    >
                      Order Now
                    </Link>
                  </div>
                </div>

                <div className="pointer-events-none absolute -right-10 -bottom-10 -z-10 h-40 w-40 rounded-full bg-cyan-400/20 blur-[90px]" />
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}