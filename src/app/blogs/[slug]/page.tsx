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

type BlogInnerImage = {
  src: string;
  alt?: string;
  caption?: string;
};

type BlogTableContent = {
  headers: string[];
  rows: string[][];
};

type BlogSection = {
  heading: string;
  body: string[];
  bullets?: string[];
  table?: BlogTableContent;
  innerImage?: BlogInnerImage;
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

  const firstInnerImage = blog.sections.find(
    (section) => section.innerImage?.src
  )?.innerImage;

  const metaImage = firstInnerImage?.src || blog.thumbnail;

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
          url: metaImage,
          width: 1200,
          height: 630,
          alt: firstInnerImage?.alt || blog.title,
        },
      ],
    },
  };
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "").trim();
}

function isFaqSection(heading: string) {
  const text = heading.toLowerCase();

  return (
    text.includes("frequently asked questions") ||
    text.includes("people also ask")
  );
}

function isStepBullet(value: string) {
  const text = stripHtml(value);

  return /^step\s*\d+\s*:/i.test(text) || /^\d+\./.test(text);
}

function parseStepBullet(value: string) {
  const text = cleanText(value);
  const stepMatch = text.match(/^(Step\s*\d+\s*:\s*)?(.*?)(\s-\s)(.*)$/i);

  if (stepMatch) {
    return {
      title: cleanText(`${stepMatch[1] || ""}${stepMatch[2] || ""}`),
      description: cleanText(stepMatch[4] || ""),
    };
  }

  return {
    title: text,
    description: "",
  };
}

const minorHeadings = new Set(
  [
    "Benefits",
    "Benefits:",
    "This Can Help Save:",
    "Why It Matters",
    "How It Works",
    "Result",
    "Why It Works",
    "Ideal For",
    "Best Places to Use QR Tags",
    "One Scan Can Help:",
    "Smart Items to Tag",
    "Especially Useful For",
    "Key Advantage",
    "Perfect For",
    "Benefits for Pet Owners",
    "Common Uses Include",
    "Biggest Advantage",
    "Benefits for Communities",
    "Why Vehicle Owners Use QR Codes",
  ].map((item) => cleanText(item).toLowerCase())
);

function isMinorHeading(heading: string) {
  return minorHeadings.has(cleanText(heading).toLowerCase());
}

function shouldShowDivider(section: BlogSection, index: number) {
  if (index === 0) return false;
  if (!section.heading) return false;
  if (isMinorHeading(section.heading)) return false;

  return true;
}

function InnerBlogImage({
  image,
  fallbackAlt,
}: {
  image: BlogInnerImage;
  fallbackAlt: string;
}) {
  return (
    <figure className="my-6 w-full max-w-full overflow-hidden rounded-xl border border-white/10 bg-[#0b1220] sm:my-7 sm:rounded-2xl">
      <div className="relative aspect-[688/400] w-full max-w-full">
        <Image
          src={image.src}
          alt={image.alt || fallbackAlt}
          fill
          className="object-contain"
          sizes="(max-width: 480px) calc(100vw - 48px), (max-width: 768px) calc(100vw - 64px), (max-width: 1024px) calc(100vw - 96px), 760px"
        />
      </div>

      {image.caption && (
        <figcaption className="border-t border-white/10 px-3 py-3 text-xs leading-5 text-slate-400 sm:px-4">
          {image.caption}
        </figcaption>
      )}
    </figure>
  );
}

function HeroInnerImage({
  image,
  fallbackAlt,
}: {
  image: BlogInnerImage;
  fallbackAlt: string;
}) {
  return (
    <div className="relative mb-8 aspect-[688/400] w-full max-w-full overflow-hidden rounded-xl border border-white/10 bg-[#0b1220] sm:mb-10 sm:rounded-2xl">
      <Image
        src={image.src}
        alt={image.alt || fallbackAlt}
        fill
        priority
        className="object-contain"
        sizes="(max-width: 480px) calc(100vw - 32px), (max-width: 768px) calc(100vw - 64px), (max-width: 1024px) calc(100vw - 80px), 1024px"
      />
    </div>
  );
}

function HtmlText({
  html,
  as = "p",
  className = "",
}: {
  html: string;
  as?: "p" | "span" | "div" | "h2" | "h3" | "h4";
  className?: string;
}) {
  if (as === "span") {
    return (
      <span
        className={className}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  if (as === "div") {
    return (
      <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
    );
  }

  if (as === "h2") {
    return (
      <h2 className={className} dangerouslySetInnerHTML={{ __html: html }} />
    );
  }

  if (as === "h3") {
    return (
      <h3 className={className} dangerouslySetInnerHTML={{ __html: html }} />
    );
  }

  if (as === "h4") {
    return (
      <h4 className={className} dangerouslySetInnerHTML={{ __html: html }} />
    );
  }

  return (
    <p className={className} dangerouslySetInnerHTML={{ __html: html }} />
  );
}

function BlogTable({ table }: { table: BlogTableContent }) {
  if (!table.rows || table.rows.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 w-full max-w-full">
      <div className="max-w-full overflow-hidden rounded-xl border border-white/10 bg-[#0b1220] sm:rounded-2xl">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left">
            <thead>
              <tr className="bg-cyan-400/10">
                {table.headers.map((header) => (
                  <th
                    key={header}
                    className="border-b border-white/10 px-4 py-4 text-sm font-bold leading-6 text-cyan-200"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {table.rows.map((row, rowIndex) => (
                <tr
                  key={`table-row-${rowIndex}`}
                  className="border-b border-white/10 last:border-b-0"
                >
                  {table.headers.map((_, cellIndex) => (
                    <td
                      key={`table-cell-${rowIndex}-${cellIndex}`}
                      className={
                        cellIndex === 0
                          ? "px-4 py-4 align-top text-sm font-semibold leading-6 text-white"
                          : "px-4 py-4 align-top text-sm leading-6 text-slate-300"
                      }
                    >
                      <HtmlText
                        as="span"
                        html={row[cellIndex] || ""}
                        className="break-words [&_a]:font-semibold [&_a]:text-cyan-300 [&_a]:underline-offset-4 hover:[&_a]:underline"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FaqBlock({ section }: { section: BlogSection }) {
  const faqs: { question: string; answer: string }[] = [];

  for (let index = 0; index < section.body.length; index += 2) {
    const question = section.body[index];
    const answer = section.body[index + 1];

    if (question) {
      faqs.push({
        question,
        answer: answer || "",
      });
    }
  }

  return (
    <div className="mt-5 space-y-4">
      {faqs.map((faq, index) => (
        <div
          key={`${section.heading}-faq-${index}`}
          className="rounded-xl border border-white/10 bg-[#0b1220] p-4 sm:rounded-2xl sm:p-5"
        >
          <div className="flex gap-3 sm:gap-4">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-400 text-xs font-black text-[#07111f] sm:h-8 sm:w-8 sm:text-sm">
              {index + 1}
            </div>

            <div className="min-w-0">
              <HtmlText
                as="h3"
                html={faq.question}
                className="break-words text-sm font-bold leading-6 text-white sm:text-base sm:leading-7 [&_a]:text-cyan-300 [&_a]:underline-offset-4 hover:[&_a]:underline"
              />

              {faq.answer && (
                <HtmlText
                  html={faq.answer}
                  className="mt-2 break-words text-sm leading-7 text-slate-300 [&_a]:font-semibold [&_a]:text-cyan-300 [&_a]:underline-offset-4 hover:[&_a]:underline"
                />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BulletList({ bullets }: { bullets: string[] }) {
  const isSteps = bullets.length > 0 && bullets.every(isStepBullet);

  if (isSteps) {
    return (
      <ol className="mt-5 space-y-4">
        {bullets.map((bullet, index) => {
          const step = parseStepBullet(bullet);

          return (
            <li
              key={`${index}-${bullet}`}
              className="rounded-xl border border-white/10 bg-[#0b1220] p-4 sm:rounded-2xl sm:p-5"
            >
              <div className="flex gap-3 sm:gap-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-400 text-xs font-black text-[#07111f] sm:h-8 sm:w-8 sm:text-sm">
                  {index + 1}
                </div>

                <div className="min-w-0">
                  <HtmlText
                    as="h3"
                    html={step.title}
                    className="break-words text-sm font-bold leading-6 text-white sm:text-base sm:leading-7 [&_a]:text-cyan-300 [&_a]:underline-offset-4 hover:[&_a]:underline"
                  />

                  {step.description && (
                    <HtmlText
                      html={step.description}
                      className="mt-1 break-words text-sm leading-7 text-slate-300 [&_a]:font-semibold [&_a]:text-cyan-300 [&_a]:underline-offset-4 hover:[&_a]:underline"
                    />
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ul className="mt-5 grid gap-3 lg:grid-cols-2">
      {bullets.map((bullet, bulletIndex) => (
        <li
          key={`${bulletIndex}-${bullet}`}
          className="group flex gap-3 rounded-xl border border-white/10 bg-[#0b1220] px-3 py-3 text-sm leading-6 text-slate-300 transition-all duration-200 hover:border-cyan-400/40 hover:bg-cyan-400/[0.04] sm:px-4 lg:min-h-[92px] lg:p-5"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-sm font-bold text-cyan-300 transition group-hover:bg-cyan-400 group-hover:text-[#07111f]">
            ✓
          </span>

          <HtmlText
            as="span"
            html={bullet}
            className="min-w-0 break-words pt-0.5 font-medium text-slate-200 [&_a]:font-semibold [&_a]:text-cyan-300 [&_a]:underline-offset-4 hover:[&_a]:underline"
          />
        </li>
      ))}
    </ul>
  );
}

function BlogSectionBlock({
  section,
  index,
  hideInnerImage = false,
}: {
  section: BlogSection;
  index: number;
  hideInnerImage?: boolean;
}) {
  const hasHeading = Boolean(section.heading);
  const minorHeading = hasHeading && isMinorHeading(section.heading);
  const showDivider = shouldShowDivider(section, index);
  const faqSection = isFaqSection(section.heading);

  return (
    <section
      className={[
        "min-w-0",
        index === 0 ? "" : minorHeading || !hasHeading ? "mt-7" : "mt-9 sm:mt-10",
        showDivider ? "border-t border-white/10 pt-7 sm:pt-8" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {hasHeading &&
        (minorHeading ? (
          <h3 className="break-words text-lg font-bold leading-snug text-cyan-100 sm:text-xl">
            {section.heading}
          </h3>
        ) : (
          <h2 className="break-words text-xl font-bold leading-snug text-white sm:text-2xl">
            {section.heading}
          </h2>
        ))}

      {!hideInnerImage && section.innerImage && (
        <InnerBlogImage
          image={section.innerImage}
          fallbackAlt={section.heading || "Veyoscan blog image"}
        />
      )}

      {faqSection ? (
        <FaqBlock section={section} />
      ) : (
        <>
          {section.body.length > 0 && (
            <div className={section.heading ? "mt-4 space-y-4" : "space-y-4"}>
              {section.body.map((paragraph, paragraphIndex) => (
                <HtmlText
                  key={`${paragraphIndex}-${paragraph}`}
                  html={paragraph}
                  className="break-words text-sm leading-7 text-slate-300 sm:text-base sm:leading-8 [&_a]:font-semibold [&_a]:text-cyan-300 [&_a]:underline-offset-4 hover:[&_a]:underline"
                />
              ))}
            </div>
          )}

          {section.table && <BlogTable table={section.table} />}

          {!section.table && section.bullets && section.bullets.length > 0 && (
            <BulletList bullets={section.bullets} />
          )}
        </>
      )}
    </section>
  );
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const blog = getBlogBySlug(slug);

  if (!blog) notFound();

  const relatedBlogs = blogs
    .filter((item) => item.slug !== blog.slug)
    .slice(0, 2);

  const blogTopics = blog.sections.filter(
    (section) => section.heading && !isMinorHeading(section.heading)
  );

  const heroInnerImageSectionIndex = blog.sections.findIndex(
    (section) => section.innerImage?.src
  );

  const heroInnerImage =
    heroInnerImageSectionIndex >= 0
      ? blog.sections[heroInnerImageSectionIndex].innerImage
      : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.title,
    description: blog.metaDescription,
    image: heroInnerImage?.src || blog.thumbnail,
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
    <main className="min-h-screen overflow-x-hidden bg-[#070b14] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />

      <section className="border-b border-white/10 bg-[#080d18]">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-10 lg:px-10">
          <Link
            href="/blogs"
            className="inline-flex text-sm font-semibold text-cyan-300 hover:text-cyan-200"
          >
            ← Back to Blogs
          </Link>

          <div className="mt-7 sm:mt-8">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                {blog.category}
              </span>

              <span className="text-xs text-slate-400">{blog.readTime}</span>
            </div>

            <h1 className="max-w-4xl break-words text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              {blog.title}
            </h1>

            <p className="mt-5 max-w-3xl break-words text-sm leading-7 text-slate-300 sm:text-base lg:text-lg">
              {blog.excerpt}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-10 lg:px-10">
        {/* ✅ Thumbnail removed. Now first innerImage will show here */}
        {heroInnerImage && (
          <HeroInnerImage image={heroInnerImage} fallbackAlt={blog.title} />
        )}

        <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-10">
          <article className="min-w-0 rounded-xl border border-white/10 bg-[#101827] p-4 sm:rounded-2xl sm:p-6 lg:p-8">
            {blog.sections.map((section, index) => (
              <BlogSectionBlock
                key={`${section.heading || "section"}-${index}`}
                section={section}
                index={index}
                hideInnerImage={index === heroInnerImageSectionIndex}
              />
            ))}

            <div className="mt-9 rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-4 sm:mt-10 sm:rounded-2xl sm:p-6">
              <h3 className="break-words text-xl font-bold text-white sm:text-2xl">
                {blog.ctaTitle}
              </h3>

              <p
                className="mt-3 break-words text-sm leading-7 text-slate-300 [&_a]:font-semibold [&_a]:text-cyan-300 [&_a]:underline-offset-4 hover:[&_a]:underline"
                dangerouslySetInnerHTML={{ __html: blog.ctaDescription }}
              />

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/get-qr"
                  className="inline-flex w-full justify-center rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-[#07111f] transition hover:bg-cyan-300 sm:w-auto"
                >
                  Get Your QR
                </Link>

                <Link
                  href="/contact"
                  className="inline-flex w-full justify-center rounded-xl border border-white/15 px-5 py-3 text-sm font-bold text-white transition hover:border-cyan-300/50 sm:w-auto"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </article>

          <aside className="min-w-0 space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border border-white/10 bg-[#101827] p-4 sm:rounded-2xl sm:p-5">
              <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-300">
                Blog Topics
              </h3>

              <div className="mt-4 space-y-3">
                {blogTopics.map((section, index) => (
                  <p
                    key={`${section.heading}-${index}`}
                    className="break-words border-b border-white/10 pb-3 text-sm leading-6 text-slate-300 last:border-b-0 last:pb-0"
                  >
                    {index + 1}. {section.heading}
                  </p>
                ))}
              </div>
            </div>

            {relatedBlogs.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-[#101827] p-4 sm:rounded-2xl sm:p-5">
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

                      <h4 className="mt-2 break-words text-sm font-semibold leading-6 text-white">
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