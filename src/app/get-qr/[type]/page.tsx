// app/get-qr/[type]/page.tsx
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

type QrType =
  | "vehicle"
  | "shop"
  | "personal"
  | "house"
  | "event"
  | "lostfound";

type PageProps = {
  params: Promise<{
    type: string;
  }>;
};

const QR_DETAILS: Record<
  QrType,
  {
    title: string;
    subtitle: string;
    img: string;
    intro: string;
    howItWorks: string[];
    useCases: string[];
    benefits: string[];
  }
> = {
  vehicle: {
    title: "Vehicle QR",
    subtitle: "Smart privacy QR for cars, bikes, scooters, helmets, and parking.",
    img: "/images/wrong parking.jpg",
    intro:
      "Vehicle QR helps people contact the vehicle owner without showing the owner’s personal mobile number. A person can scan the QR placed on the vehicle and connect with the owner through a privacy-safe calling flow.",
    howItWorks: [
      "You place the Veyoscan QR on your car, bike, scooter, helmet, or windshield.",
      "If someone needs to contact you, they scan the QR using their phone.",
      "They can call or connect with you without directly seeing your real number.",
      "With masked calling, both sides can talk while keeping personal numbers private.",
    ],
    useCases: [
      "Wrong parking notification",
      "Vehicle blocking someone’s gate or parking space",
      "Emergency contact for vehicle-related situations",
      "Cab, delivery, fleet, and commercial vehicle identification",
      "Bike, helmet, and car windshield QR placement",
    ],
    benefits: [
      "No need to write your phone number on your vehicle",
      "Privacy-first communication",
      "Easy scan and connect process",
      "Useful for daily parking and emergency situations",
    ],
  },

  shop: {
    title: "Shop / Business QR",
    subtitle: "Let customers connect with your business instantly.",
    img: "/images/shop.png",
    intro:
      "Shop or Business QR makes it easy for customers to contact your store, office, or service counter. Customers can scan the QR and connect with the business without saving any number manually.",
    howItWorks: [
      "Place the QR on your shop counter, door, banner, visiting card, or product packaging.",
      "Customers scan the QR to contact your business.",
      "They can call, enquire, give feedback, or request support.",
      "Masked calling can protect direct numbers and make business communication more professional.",
    ],
    useCases: [
      "Retail shop customer support",
      "Restaurant or cafe enquiry",
      "Service center contact",
      "Office reception contact",
      "Feedback and complaint connection",
    ],
    benefits: [
      "Easy customer communication",
      "No manual number sharing",
      "Better business identity",
      "Professional and modern customer experience",
    ],
  },

  personal: {
    title: "Personal QR",
    subtitle: "Share your contact safely without exposing your number publicly.",
    img: "/images/persnol.jpg",
    intro:
      "Personal QR is useful when you want people to contact you quickly, but you do not want to publicly display your personal mobile number. Anyone can scan your Veyoscan QR and connect through a privacy-first flow.",
    howItWorks: [
      "You keep your Veyoscan QR on your card, bag, desk, or profile material.",
      "The other person scans it when they need to connect.",
      "Your contact flow opens without exposing your real number directly.",
      "Masked number calling helps protect privacy on both sides.",
    ],
    useCases: [
      "Personal contact sharing",
      "Freelancer or creator profile",
      "Visiting card replacement",
      "Networking events",
      "Quick connect for professionals",
    ],
    benefits: [
      "No need to share number openly",
      "Fast and simple contact sharing",
      "Privacy-safe communication",
      "Modern digital identity",
    ],
  },

  house: {
    title: "House / Society QR",
    subtitle: "Smart QR for homes, gates, societies, and visitor communication.",
    img: "/images/house.jpg",
    intro:
      "House or Society QR helps visitors, guards, delivery persons, and guests connect with the right person without exposing private numbers. It is useful for homes, apartments, societies, and gated communities.",
    howItWorks: [
      "Place the QR at the gate, entrance, reception, or visitor area.",
      "Visitor or delivery person scans the QR.",
      "They connect with the owner, resident, or emergency contact.",
      "Masked calling keeps both numbers private while still allowing communication.",
    ],
    useCases: [
      "Visitor calling at society gate",
      "Delivery person contact",
      "Emergency house contact",
      "Security guard communication",
      "Apartment and building visitor management",
    ],
    benefits: [
      "Better privacy for residents",
      "Easy visitor communication",
      "No need to display mobile numbers at gate",
      "Useful for security and emergency workflows",
    ],
  },

  event: {
    title: "Event / Ticket QR",
    subtitle: "Smart QR for event check-in, access, and attendee communication.",
    img: "/images/event.jpg",
    intro:
      "Event QR can be used for event access, ticket check-in, attendee verification, and contact workflows. It makes the event process faster and more organized.",
    howItWorks: [
      "Use the QR on event tickets, passes, posters, or entry counters.",
      "Attendees scan or show the QR during the event process.",
      "Organizers can guide attendees, collect leads, or manage check-in.",
      "Communication can happen without unnecessary direct number sharing.",
    ],
    useCases: [
      "Event entry check-in",
      "Ticket verification",
      "Lead capture",
      "Conference or seminar contact",
      "Exhibition and stall enquiry",
    ],
    benefits: [
      "Fast event access flow",
      "Better attendee management",
      "Easy communication",
      "Professional event experience",
    ],
  },

  lostfound: {
    title: "Lost & Found QR",
    subtitle: "Help people return your lost items without seeing your number.",
    img: "/images/lost2.png",
    intro:
      "Lost & Found QR helps someone contact you when they find your lost item. You can attach the QR to bags, keys, wallets, documents, helmets, or other personal items.",
    howItWorks: [
      "Attach the Veyoscan QR to your item.",
      "If someone finds the item, they scan the QR.",
      "They can connect with you without seeing your personal number directly.",
      "Masked calling helps protect privacy while making item recovery easier.",
    ],
    useCases: [
      "Lost bag recovery",
      "Lost keys or wallet",
      "Helmet or vehicle accessory recovery",
      "Student ID or document recovery",
      "Travel luggage identification",
    ],
    benefits: [
      "Higher chance of getting lost items back",
      "No personal number printed on the item",
      "Simple scan and connect process",
      "Privacy-first recovery support",
    ],
  },
};

export async function generateMetadata({ params }: PageProps) {
  const { type } = await params;
  const data = QR_DETAILS[type as QrType];

  if (!data) {
    return {
      title: "QR Details | Veyoscan",
    };
  }

  return {
    title: `${data.title} | Veyoscan`,
    description: data.intro,
  };
}

export default async function QrDetailPage({ params }: PageProps) {
  const { type } = await params;
  const data = QR_DETAILS[type as QrType];

  if (!data) notFound();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0f1a] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(79,70,229,0.16),transparent_30%),radial-gradient(circle_at_80%_40%,rgba(34,211,238,0.12),transparent_40%)]" />

      <section className="relative pt-10 pb-14 md:pt-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/get-qr"
            className="mb-6 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-white"
          >
            ← Back to QR Categories
          </Link>

          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">
                Veyoscan QR Solution
              </p>

              <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
                {data.title}
              </h1>

              <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-300">
                {data.subtitle}
              </p>

              <p className="mt-5 max-w-2xl text-base leading-8 text-gray-300">
                {data.intro}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/get-qr/order?type=${encodeURIComponent(type)}`}
                  prefetch={false}
                  className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  Order Now
                </Link>

                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-xl border border-cyan-300/30 bg-white/5 px-6 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/10 hover:text-white"
                >
                  Contact Us
                </Link>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-3 shadow-[0_20px_80px_rgba(34,211,238,0.12)]">
              <div className="relative aspect-[16/11] overflow-hidden rounded-2xl">
                <Image
                  src={data.img}
                  alt={data.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a]/70 via-transparent to-transparent" />
              </div>

              <div className="absolute right-7 bottom-7 rounded-2xl border border-cyan-300/30 bg-[#0a0f1a]/80 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
                  Privacy First
                </p>
                <p className="mt-1 text-sm text-white">
                  Scan • Connect • Number Masking
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold">How it works</h2>

              <div className="mt-5 space-y-4">
                {data.howItWorks.map((item, index) => (
                  <div key={item} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-300/15 text-sm font-bold text-cyan-200">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-6 text-gray-300">{item}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold">Where you can use it</h2>

              <ul className="mt-5 space-y-3">
                {data.useCases.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-gray-300">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-cyan-300" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold">Key benefits</h2>

              <ul className="mt-5 space-y-3">
                {data.benefits.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-gray-300">
                    <span className="mt-1 text-cyan-300">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="mt-10 overflow-hidden rounded-3xl border border-cyan-300/20 bg-gradient-to-r from-indigo-600/20 via-cyan-500/10 to-white/5 p-6 md:p-8">
            <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <h2 className="text-2xl font-bold">
                  Ready to create your {data.title}?
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-300">
                  Order your Veyoscan QR and allow people to connect with you
                  safely. Your personal number stays protected with a
                  privacy-first masked communication flow.
                </p>
              </div>

              <Link
                href={`/get-qr/order?type=${encodeURIComponent(type)}`}
                prefetch={false}
                className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#0a0f1a] transition hover:bg-cyan-100"
              >
                Order Now
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}