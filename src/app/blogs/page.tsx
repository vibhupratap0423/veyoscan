
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { blogs } from "@/lib/blogs";

export const metadata: Metadata = {
  title: "Blogs | Veyoscan Smart QR Solutions",
  description:
    "Read Veyoscan blogs about smart QR stickers for vehicles, lost items, homes, societies, and privacy-safe communication.",
  keywords: [
    "Veyoscan blogs",
    "smart QR code",
    "vehicle QR sticker",
    "lost item QR",
    "house QR code",
    "QR code sticker",
    "smart parking QR",
  ],
  alternates: {
    canonical: "/blogs",
  },
};

const BLOG_AUTHOR = "Ms Disha Dudeja";

const blogDisplayDates = [
  "June 4, 2026",
  "May 27, 2026",
  "May 15, 2026",
  "May 6, 2026",
  "April 28, 2026",
  "April 17, 2026",
  "April 8, 2026",
];

export default function BlogsPage() {
  return (
    <main className="min-h-screen bg-[#070b14] text-white">
      <section className="border-b border-white/10 bg-[#080d18]">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">
              Veyoscan Blogs
            </p>

            <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Smart QR Guides for Everyday Use
            </h1>

            <p className="mt-5 text-base leading-7 text-slate-300 sm:text-lg">
              Learn how Veyoscan QR stickers help with vehicle parking, lost
              item recovery, home security, visitor contact, and safe
              communication without exposing personal numbers.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Latest Blogs
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Helpful articles about smart QR solutions.
            </p>
          </div>
        </div>

        <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {blogs.map((blog, index) => {
            const displayDate =
              blogDisplayDates[index] || blog.date || "2026";

            return (
              <article
                key={blog.slug}
                className="overflow-hidden rounded-2xl border border-white/10 bg-[#101827] transition hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-2xl hover:shadow-cyan-950/30"
              >
                <Link href={`/blogs/${blog.slug}`} className="block">
                  <div className="relative h-56 bg-slate-900">
                    <Image
                      src={blog.thumbnail}
                      alt={blog.title}
                      fill
                      className="object-cover transition duration-500 hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>

                  <div className="p-6">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                        {blog.category}
                      </span>

                      <span className="text-xs text-slate-400">
                        {blog.readTime}
                      </span>
                    </div>

                    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                      <span>
                        By{" "}
                        <span className="font-semibold text-slate-200">
                          {BLOG_AUTHOR}
                        </span>
                      </span>

                      <span className="text-slate-600">•</span>

                      <time dateTime={displayDate} className="text-slate-400">
                        {displayDate}
                      </time>
                    </div>

                    <h3 className="text-xl font-bold leading-snug text-white">
                      {blog.title}
                    </h3>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">
                      {blog.excerpt}
                    </p>

                    <div className="mt-5 inline-flex text-sm font-semibold text-cyan-300">
                      Read Full Blog →
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
