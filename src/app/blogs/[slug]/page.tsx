import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { blogs, getBlogBySlug } from "@/lib/blogs";

type BlogDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  return blogs.map((blog) => ({
    slug: blog.slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const blog = getBlogBySlug(slug);

  if (!blog) {
    return {
      title: "Blog Not Found | Veyoscan",
    };
  }

  return {
    title: blog.metaTitle,
    description: blog.metaDescription,
    keywords: blog.focusKeywords,
    alternates: {
      canonical: `/blogs/${blog.slug}`,
    },
    openGraph: {
      title: blog.metaTitle,
      description: blog.metaDescription,
      url: `/blogs/${blog.slug}`,
      siteName: "Veyoscan",
      type: "article",
      images: [
        {
          url: blog.thumbnail,
          width: 1200,
          height: 630,
          alt: blog.title,
        },
      ],
    },
  };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const blog = getBlogBySlug(slug);

  if (!blog) notFound();

  const relatedBlogs = blogs
    .filter((item) => item.slug !== blog.slug)
    .slice(0, 2);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.title,
    description: blog.metaDescription,
    image: blog.thumbnail,
    author: {
      "@type": "Organization",
      name: "Veyoscan",
    },
    publisher: {
      "@type": "Organization",
      name: "Veyoscan",
    },
    datePublished: blog.date,
    dateModified: blog.date,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `/blogs/${blog.slug}`,
    },
  };

  return (
    <main className="min-h-screen bg-[#070b14] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />

      <section className="border-b border-white/10 bg-[#080d18]">
        <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 lg:px-10">
          <Link
            href="/blogs"
            className="inline-flex text-sm font-semibold text-cyan-300 hover:text-cyan-200"
          >
            ← Back to Blogs
          </Link>

          <div className="mt-8">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                {blog.category}
              </span>

              <span className="text-xs text-slate-400">{blog.readTime}</span>
            </div>

            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              {blog.title}
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
              {blog.excerpt}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8 lg:px-10">
        <div className="relative mb-10 aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
  <Image
    src={blog.thumbnail}
    alt={blog.title}
    fill
    priority
    className="object-cover"
    sizes="(max-width: 1024px) 100vw, 1024px"
  />
</div>

        <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
          <article className="rounded-2xl border border-white/10 bg-[#101827] p-6 sm:p-8">
            {blog.sections.map((section, index) => (
              <section
                key={section.heading}
                className={index === 0 ? "" : "mt-10 border-t border-white/10 pt-8"}
              >
                <h2 className="text-2xl font-bold leading-snug text-white">
                  {section.heading}
                </h2>

                <div className="mt-4 space-y-4">
                  {section.body.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-base leading-8 text-slate-300"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>

                {section.bullets && section.bullets.length > 0 && (
                  <ul className="mt-5 space-y-3">
                    {section.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex gap-3 text-sm leading-6 text-slate-300"
                      >
                        <span className="mt-1 text-cyan-300">✓</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            <div className="mt-10 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-6">
              <h3 className="text-2xl font-bold text-white">
                {blog.ctaTitle}
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                {blog.ctaDescription}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/get-qr"
                  className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-[#07111f] transition hover:bg-cyan-300"
                >
                  Get Your QR
                </Link>

                <Link
                  href="/contact"
                  className="rounded-xl border border-white/15 px-5 py-3 text-sm font-bold text-white transition hover:border-cyan-300/50"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </article>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#101827] p-5">
              <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-300">
                Blog Topics
              </h3>

              <div className="mt-4 space-y-3">
                {blog.sections.map((section, index) => (
                  <p
                    key={section.heading}
                    className="border-b border-white/10 pb-3 text-sm leading-6 text-slate-300 last:border-b-0 last:pb-0"
                  >
                    {index + 1}. {section.heading}
                  </p>
                ))}
              </div>
            </div>

            {relatedBlogs.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-[#101827] p-5">
                <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-300">
                  Related Blogs
                </h3>

                <div className="mt-4 space-y-4">
                  {relatedBlogs.map((item) => (
                    <Link
                      key={item.slug}
                      href={`/blogs/${item.slug}`}
                      className="block rounded-xl border border-white/10 p-4 transition hover:border-cyan-400/40"
                    >
                      <p className="text-xs text-cyan-300">{item.category}</p>
                      <h4 className="mt-2 text-sm font-semibold leading-6 text-white">
                        {item.title}
                      </h4>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}