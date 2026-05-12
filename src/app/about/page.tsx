"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  QrCode,
  PhoneCall,
  Shield,
  GaugeCircle,
  Lock,
  BarChart3,
  Sparkles,
  CheckCircle2,
  Users,
  Building2,
  Rocket,
  Globe2,
  Zap,
  ArrowRight,
  BadgeCheck,
} from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, delay },
});

export default function AboutPage() {
  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#060b14] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -left-24 top-40 h-[320px] w-[320px] rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute -right-24 bottom-24 h-[320px] w-[320px] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_32%),linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent)]" />
      </div>

      {/* Hero */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 pb-14 pt-16 sm:px-6 lg:px-8">
          <motion.div
            {...fadeUp(0)}
            className="mx-auto max-w-4xl text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-1.5 text-xs font-medium text-cyan-200 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              About Veyoscan
            </div>

            <h1 className="mt-5 text-4xl font-black tracking-[-0.03em] sm:text-5xl lg:text-6xl">
              Built to make
              <span className="bg-gradient-to-r from-cyan-300 via-white to-indigo-300 bg-clip-text text-transparent">
                {" "}QR communication smarter
              </span>
              , faster, and more human.
            </h1>

            <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-white/72 sm:text-lg">
              Veyoscan is a next-generation QR communication platform founded by{" "}
              <span className="font-semibold text-cyan-200">Vibhu Pratap</span> and{" "}
              <span className="font-semibold text-cyan-200">Ankit Sharma</span>. In
              collaboration with{" "}
              <span className="font-semibold text-cyan-200">YNV Technology Pvt. Ltd.</span>,
              we are preparing to launch a smarter way for people, vehicles,
              businesses, and communities to connect instantly through QR-powered interaction.
            </p>
          </motion.div>

          {/* Highlight Cards */}
          <motion.div
            {...fadeUp(0.08)}
            className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <HeroPill icon={<QrCode className="h-4 w-4" />} label="Smart QR Interaction" />
            <HeroPill icon={<PhoneCall className="h-4 w-4" />} label="Instant Connect" />
            <HeroPill icon={<Shield className="h-4 w-4" />} label="Secure Communication" />
            <HeroPill icon={<BarChart3 className="h-4 w-4" />} label="Scalable Platform" />
          </motion.div>

          {/* Main Hero Panel */}
          <motion.div
            {...fadeUp(0.16)}
            className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"
          >
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur-xl sm:p-8">
              <div className="absolute -right-14 -top-14 h-36 w-36 rounded-full bg-cyan-400/15 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-28 w-28 rounded-full bg-indigo-500/10 blur-3xl" />

              <div className="flex items-center gap-2 text-cyan-200">
                <Rocket className="h-5 w-5" />
                <span className="text-sm font-medium">Launch Vision</span>
              </div>

              <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
                A modern platform for real-world communication through QR
              </h2>

              <p className="mt-4 max-w-2xl text-white/72 leading-7">
                We are building Veyoscan to solve a real communication gap:
                connecting the right people at the right moment without friction.
                Whether it is a parked vehicle, an emergency situation, a lost
                item, a residential entry point, or a business asset, Veyoscan
                turns a simple QR into an instant communication gateway.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <MiniFeature
                  icon={<Zap className="h-4 w-4" />}
                  title="Fast interactions"
                  text="One scan can trigger instant action without unnecessary steps."
                />
                <MiniFeature
                  icon={<Lock className="h-4 w-4" />}
                  title="Privacy focused"
                  text="Connect without exposing personal numbers publicly."
                />
                <MiniFeature
                  icon={<Globe2 className="h-4 w-4" />}
                  title="Everyday usability"
                  text="Useful across personal, social, mobility, and business use cases."
                />
                <MiniFeature
                  icon={<GaugeCircle className="h-4 w-4" />}
                  title="Built to scale"
                  text="Designed with future-ready architecture and product expansion in mind."
                />
              </div>
            </div>

            <div className="grid gap-6">
              <motion.div
                whileHover={{ y: -4 }}
                className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 to-indigo-500/10 p-6 backdrop-blur-xl"
              >
                <div className="flex items-center gap-2 text-cyan-200">
                  <Users className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Founders</h3>
                </div>
                <div className="mt-4 space-y-4">
                  <FounderCard
                    name="Vibhu Pratap"
                    role="Co-Founder"
                    desc="Driving the product vision, real-world use case thinking, and user-focused direction behind Veyoscan."
                  />
                  <FounderCard
                    name="Ankit Sharma"
                    role="Co-Founder"
                    desc="Contributing to the platform strategy, execution flow, and digital product development journey of Veyoscan."
                  />
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -4 }}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl"
              >
                <div className="flex items-center gap-2 text-indigo-200">
                  <Building2 className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Launch Collaboration</h3>
                </div>
                <p className="mt-4 text-white/72 leading-7">
                  Veyoscan is being launched in collaboration with{" "}
                  <span className="font-semibold text-white">YNV Technology Pvt. Ltd.</span>,
                  combining product vision with technology support to create a
                  practical, scalable, and launch-ready communication platform.
                </p>
                <div className="mt-4 rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4 text-sm text-cyan-100/90">
                  Product vision + technical collaboration + market-ready execution.
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Story / Mission */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <motion.div
              {...fadeUp(0)}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl"
            >
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-cyan-300" />
                <h2 className="text-2xl font-semibold">Our Mission</h2>
              </div>
              <p className="mt-4 text-white/72 leading-7">
                Our mission is to make communication more direct, meaningful,
                and accessible through smart QR technology. Veyoscan is designed
                to reduce communication friction and enable safe, instant,
                context-aware connection in everyday life.
              </p>

              <ul className="mt-5 space-y-3">
                <Li>Enable instant connection through QR in real-life scenarios</Li>
                <Li>Support safer and faster communication in urgent moments</Li>
                <Li>Create a modern platform that blends usability, trust, and scale</Li>
                <Li>Build a strong launch foundation with practical business and public use cases</Li>
              </ul>
            </motion.div>

            <motion.div
              {...fadeUp(0.08)}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl"
            >
              <div className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-indigo-300" />
                <h2 className="text-2xl font-semibold">Why Veyoscan Matters</h2>
              </div>
              <p className="mt-4 text-white/72 leading-7">
                We believe many everyday problems can be solved with a faster
                communication trigger. Veyoscan brings that trigger into a
                simple scan experience. It is not just a QR product — it is a
                communication layer for modern life.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <ReasonCard title="Vehicles & Parking" />
                <ReasonCard title="Emergency Contact" />
                <ReasonCard title="Lost & Found" />
                <ReasonCard title="Homes & Communities" />
                <ReasonCard title="Business Assets" />
                <ReasonCard title="Future Smart Workflows" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
          <motion.div {...fadeUp(0)} className="mb-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
              <BadgeCheck className="h-3.5 w-3.5" />
              Core Principles
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">What we stand for</h2>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ValueCard
              icon={<QrCode className="h-5 w-5 text-cyan-300" />}
              title="Simplicity"
              desc="A scan should feel natural, fast, and useful without confusion."
            />
            <ValueCard
              icon={<Shield className="h-5 w-5 text-cyan-300" />}
              title="Trust"
              desc="Communication should feel secure, intentional, and respectful of privacy."
            />
            <ValueCard
              icon={<Zap className="h-5 w-5 text-cyan-300" />}
              title="Practical Innovation"
              desc="We focus on solving real problems, not just adding features."
            />
            <ValueCard
              icon={<BarChart3 className="h-5 w-5 text-cyan-300" />}
              title="Scalable Vision"
              desc="Built with long-term product growth, adoption, and expansion in mind."
            />
          </div>
        </div>
      </section>

      {/* Journey */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
          <motion.div {...fadeUp(0)} className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight">The journey ahead</h2>
            <p className="mt-2 max-w-2xl text-white/70">
              Veyoscan is entering the market with a clear purpose and a stronger foundation through founder-led vision and technology collaboration.
            </p>
          </motion.div>

          <div className="relative ml-2 border-l border-white/10 pl-6">
            {[
              {
                title: "Idea & problem discovery",
                desc: "The concept emerged from real communication problems seen in daily life, mobility, safety, and public interaction.",
              },
              {
                title: "Product shaping by founders",
                desc: "Vibhu Pratap and Ankit Sharma structured the concept into a practical product vision focused on QR-powered communication.",
              },
              {
                title: "Technology collaboration",
                desc: "With YNV Technology Pvt. Ltd., the platform moves toward a stronger launch foundation with technical support and execution alignment.",
              },
              {
                title: "Launch phase",
                desc: "Veyoscan is being positioned for launch as a modern communication solution with real-world relevance and future growth potential.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                {...fadeUp(i * 0.06)}
                className="relative mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl"
              >
                <span className="absolute -left-[31px] top-6 h-3.5 w-3.5 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 shadow-[0_0_20px_rgba(34,211,238,0.6)]" />
                <h3 className="font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/70">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <motion.div
            {...fadeUp(0)}
            className="relative overflow-hidden rounded-[32px] border border-cyan-400/25 bg-gradient-to-r from-cyan-400/12 via-white/[0.04] to-indigo-500/12 p-8 text-center backdrop-blur-xl sm:p-10"
          >
            <div className="absolute left-1/2 top-0 h-32 w-72 -translate-x-1/2 rounded-full bg-cyan-400/15 blur-3xl" />
            <h3 className="text-2xl font-bold sm:text-3xl">
              Veyoscan is more than a QR.
            </h3>
            <p className="mx-auto mt-3 max-w-2xl text-white/72 leading-7">
              It is a launch-ready communication idea founded by Vibhu Pratap and
              Ankit Sharma, and moving forward with YNV Technology Pvt. Ltd. to
              bring a smarter QR-based experience into the real world.
            </p>

          <Link
  href="/get-qr"
  className="group mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 px-6 py-3 font-semibold text-black shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02] hover:opacity-95"
>
  Explore Veyoscan
  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
</Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

/* ---------------- Components ---------------- */

function HeroPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white/85 backdrop-blur">
      <span className="text-cyan-300">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function MiniFeature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center gap-2">
        <span className="inline-grid h-8 w-8 place-items-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
          {icon}
        </span>
        <h3 className="font-medium">{title}</h3>
      </div>
      <p className="mt-2 text-sm leading-6 text-white/68">{text}</p>
    </div>
  );
}

function FounderCard({
  name,
  role,
  desc,
}: {
  name: string;
  role: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-base font-semibold">{name}</div>
      <div className="text-sm text-cyan-200">{role}</div>
      <p className="mt-2 text-sm leading-6 text-white/68">{desc}</p>
    </div>
  );
}

function ReasonCard({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/82">
      {title}
    </div>
  );
}

function ValueCard({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl"
    >
      <div className="flex items-center gap-3">
        <span className="inline-grid h-10 w-10 place-items-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
          {icon}
        </span>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/70">{desc}</p>
    </motion.div>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-white/75">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
      <span>{children}</span>
    </li>
  );
}