
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

type BlogSection = {
  heading: string;
  body: string[];
  bullets?: string[];
};

type TableData = {
  columns: string[];
  rows: string[][];
  notes: string[];
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

function isTableSection(section: BlogSection) {
  const heading = section.heading.toLowerCase();
  const firstBody = stripHtml(section.body[0] || "").toLowerCase();

  return (
    heading.includes(" vs ") ||
    heading.includes("industries using") ||
    heading.includes("benefits of emergency qr codes for families") ||
    firstBody === "benefit advantage" ||
    firstBody === "industry common use cases" ||
    firstBody.includes("feature traditional")
  );
}

function isHeaderLikeTableText(value: string) {
  const text = stripHtml(value).toLowerCase();

  return (
    text === "feature traditional name plate house & society qr" ||
    text === "feature traditional label lost item qr" ||
    text === "feature traditional contact sticker smart qr sticker" ||
    text === "feature traditional number sticker smart qr sticker" ||
    text === "benefit advantage" ||
    text === "industry common use cases"
  );
}

function getTableColumns(section: BlogSection) {
  const heading = section.heading.toLowerCase();
  const firstBody = stripHtml(section.body[0] || "").toLowerCase();

  if (heading.includes("lost item qr vs traditional name labels")) {
    return ["Feature", "Traditional Label", "Lost Item QR"];
  }

  if (heading.includes("house & society qr vs traditional name plates")) {
    return ["Feature", "Traditional Name Plate", "House & Society QR"];
  }

  if (heading.includes("smart qr stickers vs traditional contact stickers")) {
    return ["Feature", "Traditional Number Sticker", "Smart QR Sticker"];
  }

  if (heading.includes("smart qr sticker vs traditional contact sticker")) {
    return ["Feature", "Traditional Contact Sticker", "Smart QR Sticker"];
  }

  if (heading.includes("industries using")) {
    return ["Industry", "Common Use Cases"];
  }

  if (heading.includes("benefits of emergency qr codes for families")) {
    return ["Benefit", "Advantage"];
  }

  if (firstBody.includes("benefit advantage")) {
    return ["Benefit", "Advantage"];
  }

  if (firstBody.includes("industry common use cases")) {
    return ["Industry", "Common Use Cases"];
  }

  return ["Feature", "Traditional", "Smart QR"];
}

function getValueAfterColonOrDash(value: string) {
  const text = cleanText(value);

  if (text.includes(":")) {
    return cleanText(text.split(":").slice(1).join(":"));
  }

  const dashParts = text.split(/\s-\s/);
  if (dashParts.length > 1) {
    return cleanText(dashParts.slice(1).join(" - "));
  }

  return text;
}

function parseTableBullet(bullet: string, columnsCount: number) {
  const text = cleanText(bullet);

  if (columnsCount === 2) {
    const parts = text.split(/\s-\s/);

    if (parts.length >= 2) {
      return [cleanText(parts[0]), cleanText(parts.slice(1).join(" - "))];
    }

    return [text, ""];
  }

  if (text.includes("|")) {
    const [leftRaw, rightRaw] = text.split("|");
    const left = cleanText(leftRaw || "");
    const right = cleanText(rightRaw || "");

    let feature = left;
    let firstValue = "";

    if (left.includes("—")) {
      const [featureRaw, valueRaw] = left.split("—");
      feature = cleanText(featureRaw);
      firstValue = getValueAfterColonOrDash(valueRaw || "");
    } else if (left.includes(":")) {
      const [featureRaw, valueRaw] = left.split(":");
      feature = cleanText(featureRaw);
      firstValue = getValueAfterColonOrDash(valueRaw || "");
    } else {
      const parts = left.split(/\s-\s/);
      feature = cleanText(parts[0] || "");
      firstValue = cleanText(parts.slice(1).join(" - "));
    }

    const secondValue = getValueAfterColonOrDash(right);

    return [feature, firstValue, secondValue];
  }

  const dashParts = text.split(/\s-\s/);

  if (dashParts.length >= 3) {
    return [
      cleanText(dashParts[0]),
      cleanText(dashParts[1]),
      cleanText(dashParts.slice(2).join(" - ")),
    ];
  }

  if (dashParts.length === 2) {
    return [cleanText(dashParts[0]), cleanText(dashParts[1]), ""];
  }

  return [text, "", ""];
}

function getTableData(section: BlogSection): TableData {
  const columns = getTableColumns(section);
  const bullets = section.bullets || [];

  const rows = bullets.map((bullet) => {
    const parsedRow = parseTableBullet(bullet, columns.length);
    return columns.map((_, index) => parsedRow[index] || "");
  });

  const notes = section.body.filter((item) => !isHeaderLikeTableText(item));

  return {
    columns,
    rows,
    notes,
  };
}

function splitFaqItems(body: string[]) {
  const items: { question: string; answer: string }[] = [];

  for (let index = 0; index < body.length; index += 2) {
    const question = body[index];
    const answer = body[index + 1];

    if (question) {
      items.push({
        question,
        answer: answer || "",
      });
    }
  }

  return items;
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
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  if (as === "h2") {
    return (
      <h2
        className={className}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  if (as === "h3") {
    return (
      <h3
        className={className}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  if (as === "h4") {
    return (
      <h4
        className={className}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <p
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function BlogTable({ section }: { section: BlogSection }) {
  const table = getTableData(section);

  if (table.rows.length === 0) {
    return null;
  }

  return (
    <div className="mt-5">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-left">
            <thead>
              <tr className="bg-cyan-400/10">
                {table.columns.map((column) => (
                  <th
                    key={column}
                    className="border-b border-white/10 px-4 py-4 text-sm font-bold text-cyan-200"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {table.rows.map((row, rowIndex) => (
                <tr
                  key={`${section.heading}-row-${rowIndex}`}
                  className="border-b border-white/10 last:border-b-0"
                >
                  {table.columns.map((_, columnIndex) => (
                    <td
                      key={`${section.heading}-cell-${rowIndex}-${columnIndex}`}
                      className={
                        columnIndex === 0
                          ? "px-4 py-4 text-sm font-semibold leading-6 text-white"
                          : "px-4 py-4 text-sm leading-6 text-slate-300"
                      }
                    >
                      <HtmlText
                        as="span"
                        html={row[columnIndex] || ""}
                        className="[&_a]:font-semibold [&_a]:text-cyan-300 [&_a]:underline-offset-4 hover:[&_a]:underline"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {table.notes.length > 0 && (
        <div className="mt-5 space-y-4">
          {table.notes.map((note, index) => (
            <HtmlText
              key={`${section.heading}-note-${index}`}
              html={note}
              className="text-base leading-8 text-slate-300 [&_a]:font-semibold [&_a]:text-cyan-300 [&_a]:underline-offset-4 hover:[&_a]:underline"
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FaqBlock({ section }: { section: BlogSection }) {
  const faqs = splitFaqItems(section.body);

  return (
    <div className="mt-5 space-y-4">
      {faqs.map((faq, index) => (
        <div
          key={`${section.heading}-faq-${index}`}
          className="rounded-2xl border border-white/10 bg-[#0b1220] p-5"
        >
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400 text-sm font-black text-[#07111f]">
              {index + 1}
            </div>

            <div className="min-w-0">
              <HtmlText
                as="h3"
                html={faq.question}
                className="text-base font-bold leading-7 text-white [&_a]:text-cyan-300 [&_a]:underline-offset-4 hover:[&_a]:underline"
              />

              {faq.answer && (
                <HtmlText
                  html={faq.answer}
                  className="mt-2 text-sm leading-7 text-slate-300 [&_a]:font-semibold [&_a]:text-cyan-300 [&_a]:underline-offset-4 hover:[&_a]:underline"
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
              className="rounded-2xl border border-white/10 bg-[#0b1220] p-5"
            >
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400 text-sm font-black text-[#07111f]">
                  {index + 1}
                </div>

                <div className="min-w-0">
                  <HtmlText
                    as="h3"
                    html={step.title}
                    className="text-base font-bold leading-7 text-white [&_a]:text-cyan-300 [&_a]:underline-offset-4 hover:[&_a]:underline"
                  />

                  {step.description && (
                    <HtmlText
                      html={step.description}
                      className="mt-1 text-sm leading-7 text-slate-300 [&_a]:font-semibold [&_a]:text-cyan-300 [&_a]:underline-offset-4 hover:[&_a]:underline"
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
    <ul className="mt-5 grid gap-3">
      {bullets.map((bullet, bulletIndex) => (
        <li
          key={`${bulletIndex}-${bullet}`}
          className="flex gap-3 rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm leading-6 text-slate-300"
        >
          <span className="mt-0.5 text-cyan-300">✓</span>

          <HtmlText
            as="span"
            html={bullet}
            className="[&_a]:font-semibold [&_a]:text-cyan-300 [&_a]:underline-offset-4 hover:[&_a]:underline"
          />
        </li>
      ))}
    </ul>
  );
}

function BlogSectionBlock({
  section,
  index,
}: {
  section: BlogSection;
  index: number;
}) {
  const hasHeading = Boolean(section.heading);
  const minorHeading = hasHeading && isMinorHeading(section.heading);
  const showDivider = shouldShowDivider(section, index);
  const tableSection = isTableSection(section);
  const faqSection = isFaqSection(section.heading);

  return (
    <section
      className={[
        index === 0 ? "" : minorHeading || !hasHeading ? "mt-7" : "mt-10",
        showDivider ? "border-t border-white/10 pt-8" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {hasHeading &&
        (minorHeading ? (
          <h3 className="text-xl font-bold leading-snug text-cyan-100">
            {section.heading}
          </h3>
        ) : (
          <h2 className="text-2xl font-bold leading-snug text-white">
            {section.heading}
          </h2>
        ))}

      {faqSection ? (
        <FaqBlock section={section} />
      ) : tableSection ? (
        <BlogTable section={section} />
      ) : (
        <>
          {section.body.length > 0 && (
            <div className={section.heading ? "mt-4 space-y-4" : "space-y-4"}>
              {section.body.map((paragraph, paragraphIndex) => (
                <HtmlText
                  key={`${paragraphIndex}-${paragraph}`}
                  html={paragraph}
                  className="text-base leading-8 text-slate-300 [&_a]:font-semibold [&_a]:text-cyan-300 [&_a]:underline-offset-4 hover:[&_a]:underline"
                />
              ))}
            </div>
          )}

          {section.bullets && section.bullets.length > 0 && (
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
              <BlogSectionBlock
                key={`${section.heading || "section"}-${index}`}
                section={section}
                index={index}
              />
            ))}

            <div className="mt-10 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-6">
              <h3 className="text-2xl font-bold text-white">
                {blog.ctaTitle}
              </h3>

              <p
                className="mt-3 text-sm leading-7 text-slate-300 [&_a]:font-semibold [&_a]:text-cyan-300 [&_a]:underline-offset-4 hover:[&_a]:underline"
                dangerouslySetInnerHTML={{ __html: blog.ctaDescription }}
              />

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
                {blogTopics.map((section, index) => (
                  <p
                    key={`${section.heading}-${index}`}
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
