import type { Metadata } from "next";
import Image from "next/image";
import { company, legalLine, socials } from "@/lib/company";
import { SocialLinks } from "@/components/social-links";
import { copy, type Lang } from "./copy";

const MEDIA = "https://media.iditechs.com";
const heroImage = `${MEDIA}/company/hero.jpg`;
const ogImage = `${MEDIA}/company/og.png`;

export const langUrl = (lang: Lang) => (lang === "fr" ? company.site : `${company.site}/en`);

export function buildMetadata(lang: Lang): Metadata {
  const t = copy[lang].meta;
  return {
    title: t.title,
    description: t.description,
    // Without this the page inherits the portfolio's keywords (Java, React, Budapest...).
    keywords: t.keywords,
    authors: [{ name: company.brand, url: company.site }],
    creator: company.brand,
    publisher: company.brand,
    alternates: {
      canonical: langUrl(lang),
      languages: { fr: langUrl("fr"), en: langUrl("en"), "x-default": langUrl("fr") },
    },
    openGraph: {
      type: "website",
      url: langUrl(lang),
      siteName: "IDITECHS",
      locale: t.locale,
      title: t.title,
      description: t.ogDescription,
      images: [{ url: ogImage, width: 1200, height: 630, alt: t.ogAlt }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@Iditechs",
      title: t.title,
      images: [ogImage],
    },
    robots: { index: true, follow: true },
    icons: {
      icon: [
        { url: "/logos/iditechs-icon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/logos/iditechs-icon-48.png", sizes: "48x48", type: "image/png" },
        { url: "/logos/iditechs-icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/logos/iditechs-icon-180.png", sizes: "180x180", type: "image/png" }],
      shortcut: "/logos/iditechs-icon-48.png",
    },
    other: {
      "facebook-domain-verification": "qs6fg4yzfgg351p79qk5wvxqozg1q0",
    },
  };
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: company.brand,
  url: company.site,
  logo: `${company.site}/logos/iditechs-icon-512.png`,
  image: ogImage,
  email: company.email,
  telephone: company.phones[0],
  founder: { "@type": "Person", name: company.owner, url: company.portfolio },
  address: { "@type": "PostalAddress", addressLocality: "Bamako", addressRegion: "Commune V, Kalabancoura", addressCountry: "ML" },
  areaServed: "Bamako, Mali",
  identifier: [
    { "@type": "PropertyValue", propertyID: "RCCM", value: company.rccm },
    { "@type": "PropertyValue", propertyID: "DUNS", value: company.duns },
  ],
  sameAs: [company.portfolio, ...socials.map((s) => s.url)],
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">{children}</p>;
}

function LangSwitch({ lang }: { lang: Lang }) {
  const item = (l: Lang, label: string) => (
    <a
      href={langUrl(l)}
      hrefLang={l}
      lang={l}
      aria-current={lang === l ? "page" : undefined}
      className={`rounded-full px-2.5 py-1 transition ${lang === l ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}
    >
      {label}
    </a>
  );
  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 p-0.5 text-xs font-semibold" aria-label="Language">
      {item("fr", "FR")}
      {item("en", "EN")}
    </div>
  );
}

export function CompanyPage({ lang }: { lang: Lang }) {
  const t = copy[lang];
  const other: Lang = lang === "fr" ? "en" : "fr";
  const wa = `https://wa.me/${company.whatsapp}?text=${encodeURIComponent(t.hero.waPrefill)}`;

  return (
    <main lang={lang} className="min-h-screen bg-[#030712] text-gray-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#030712]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <a href="#top" className="flex items-center gap-3">
            <Image src="/logos/iditechs-icon-180.png" alt="" width={36} height={36} unoptimized className="rounded-full ring-1 ring-cyan-500/40" />
            <span className="font-display text-xl font-bold tracking-[0.2em] text-white">IDITECHS</span>
          </a>
          <nav className="hidden gap-6 text-sm text-gray-300 md:flex">
            <a href="#services" className="hover:text-white">{t.nav.services}</a>
            <a href="#process" className="hover:text-white">{t.nav.process}</a>
            <a href="#about" className="hover:text-white">{t.nav.about}</a>
            <a href="#contact" className="hover:text-white">{t.nav.contact}</a>
          </nav>
          <div className="flex items-center gap-3">
            <LangSwitch lang={lang} />
            <a href={wa} target="_blank" rel="noopener noreferrer" className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:bg-cyan-400">
              {t.nav.whatsapp}
            </a>
          </div>
        </div>
      </header>

      <section id="top" className="relative overflow-hidden">
        <Image
          src={heroImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className="pointer-events-none select-none object-cover object-right"
        />
        {/* Keeps the headline readable over the pattern: dark on the left, image showing through on the right. */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(100deg,#030712_26%,rgba(3,7,18,0.93)_46%,rgba(3,7,18,0.6)_66%,rgba(3,7,18,0.2)_88%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[#030712]/55 sm:hidden" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-[#030712]" />
        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-24 sm:pt-32">
          <Eyebrow>{t.hero.eyebrow}</Eyebrow>
          <h1 className="font-display max-w-3xl text-4xl font-bold leading-tight text-white sm:text-6xl">{t.hero.title}</h1>
          <p className="mt-6 max-w-2xl text-lg text-gray-300">{t.hero.lead}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={wa} target="_blank" rel="noopener noreferrer" className="rounded-full bg-cyan-500 px-6 py-3 font-semibold text-black hover:bg-cyan-400">
              {t.hero.cta}
            </a>
            <a href={`mailto:${company.email}`} className="rounded-full border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/10">
              {company.email}
            </a>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-gray-400">
            <span>{t.hero.follow}</span>
            <SocialLinks size={14} />
          </div>
        </div>
      </section>

      <section aria-label={lang === "fr" ? "Garanties" : "Guarantees"} className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto grid max-w-6xl gap-px px-5 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {t.trust.map(([k, v, d]) => (
            <div key={k} className="px-4 py-3">
              <p className="font-display text-2xl font-bold text-white">{k}</p>
              <p className="mt-1 text-sm font-medium text-cyan-400">{v}</p>
              <p className="mt-1 text-xs text-gray-500">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="services">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <Eyebrow>{t.services.eyebrow}</Eyebrow>
          <h2 className="font-display text-3xl font-bold text-white">{t.services.title}</h2>
          <p className="mt-3 max-w-2xl text-gray-400">{t.services.lead}</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {t.services.items.map((s, i) => (
              <div key={s.title} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-0.5 hover:border-cyan-500/40 hover:bg-white/[0.05]">
                <p className="font-display text-xs font-semibold text-gray-500">0{i + 1}</p>
                <h3 className="mt-2 text-lg font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-300">{s.desc}</p>
                <p className="mt-4 text-xs font-medium uppercase tracking-wider text-cyan-400">{s.meta}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="process" className="border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <Eyebrow>{t.process.eyebrow}</Eyebrow>
          <h2 className="font-display text-3xl font-bold text-white">{t.process.title}</h2>
          <p className="mt-3 max-w-2xl text-gray-400">{t.process.lead}</p>
          <ol className="mt-10 grid gap-6 md:grid-cols-5">
            {t.process.steps.map(([n, title, d]) => (
              <li key={n} className="relative rounded-2xl border border-white/10 bg-[#030712] p-5">
                <span className="font-display text-3xl font-bold text-cyan-400">{n}</span>
                <h3 className="mt-2 font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm text-gray-300">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="about" className="border-t border-white/10">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-2">
          <div>
            <Eyebrow>{t.about.eyebrow}</Eyebrow>
            <h2 className="font-display text-3xl font-bold text-white">{t.about.title}</h2>
            <ul className="mt-6 space-y-4 text-gray-300">
              {t.about.bullets.map(([strong, text]) => (
                <li key={strong}><strong className="text-white">{strong}</strong> {text}</li>
              ))}
            </ul>
            <a href={company.portfolio} className="mt-6 inline-block text-cyan-400 hover:text-cyan-300" target="_blank" rel="noopener noreferrer">
              {t.about.portfolioLink}
            </a>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="font-semibold text-white">{t.about.forWhom}</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {t.about.audiences.map((a) => (
                <li key={a} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-gray-200">{a}</li>
              ))}
            </ul>
            <h3 className="mt-8 font-semibold text-white" lang={other}>{t.about.otherLang.title}</h3>
            <p className="mt-2 text-sm text-gray-300" lang={other}>{t.about.otherLang.text}</p>
            <a href={langUrl(other)} hrefLang={other} lang={other} className="mt-3 inline-block text-sm text-cyan-400 hover:text-cyan-300">
              {t.about.otherLang.link}
            </a>
          </div>
        </div>
      </section>

      <section id="contact" className="border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <Eyebrow>{t.contact.eyebrow}</Eyebrow>
          <h2 className="font-display text-3xl font-bold text-white">{t.contact.title}</h2>
          <p className="mt-3 max-w-2xl text-gray-400">{t.contact.lead}</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#030712] p-6">
              <p className="text-xs uppercase tracking-wider text-gray-500">{t.contact.phone}</p>
              {company.phones.map((p) => (
                <a key={p} href={`tel:${p.replace(/\s/g, "")}`} className="mt-2 block text-lg text-white hover:text-cyan-300">{p}</a>
              ))}
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#030712] p-6">
              <p className="text-xs uppercase tracking-wider text-gray-500">{t.contact.email}</p>
              <a href={`mailto:${company.email}`} className="mt-2 block text-lg text-white hover:text-cyan-300">{company.email}</a>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#030712] p-6">
              <p className="text-xs uppercase tracking-wider text-gray-500">{t.contact.address}</p>
              <p className="mt-2 text-lg text-white">{company.address}</p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href={wa} target="_blank" rel="noopener noreferrer" className="rounded-full bg-cyan-500 px-6 py-3 font-semibold text-black hover:bg-cyan-400">
              {t.contact.cta}
            </a>
            <SocialLinks variant="pills" size={14} />
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3">
              <Image src="/logos/iditechs-icon-180.png" alt="" width={40} height={40} unoptimized className="rounded-full ring-1 ring-cyan-500/40" />
              <p className="font-display text-lg font-bold tracking-[0.2em] text-white">IDITECHS</p>
            </div>
            <p className="mt-3 text-sm text-gray-400">{t.footer.tagline}</p>
            <SocialLinks size={14} className="mt-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t.footer.services}</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-300">
              {t.services.items.map((s) => (
                <li key={s.title}><a href="#services" className="hover:text-white">{s.title}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t.footer.company}</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-300">
              <li><a href="#process" className="hover:text-white">{t.nav.process}</a></li>
              <li><a href="#about" className="hover:text-white">{t.nav.about}</a></li>
              <li><a href="#contact" className="hover:text-white">{t.nav.contact}</a></li>
              <li><a href="/links" className="hover:text-white">{t.footer.offers}</a></li>
              <li><a href={company.portfolio} target="_blank" rel="noopener noreferrer" className="hover:text-white">{t.footer.portfolio}</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t.footer.contact}</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-300">
              {company.phones.map((p) => (
                <li key={p}><a href={`tel:${p.replace(/\s/g, "")}`} className="hover:text-white">{p}</a></li>
              ))}
              <li><a href={`mailto:${company.email}`} className="hover:text-white">{company.email}</a></li>
              <li className="text-gray-400">{company.address}</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
            <p>{legalLine(lang)}</p>
            <p>© 2026 {company.brand}. {t.footer.rights}</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
