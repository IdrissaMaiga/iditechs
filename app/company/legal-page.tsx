import type { Metadata } from "next";
import Image from "next/image";
import { legalLine } from "@/lib/company";
import { copy, langUrl, type Lang } from "./copy";
import { legal, legalPath, type LegalKind } from "./legal-copy";
import { ICONS, LangSwitch } from "./company-page";

export function buildLegalMetadata(lang: Lang, kind: LegalKind): Metadata {
  const doc = legal[lang][kind];
  const path = legalPath[kind];
  return {
    title: `${doc.title} · IDITECHS`,
    description: doc.description,
    alternates: {
      canonical: langUrl(lang, path),
      languages: { fr: langUrl("fr", path), en: langUrl("en", path), "x-default": langUrl("fr", path) },
    },
    openGraph: { type: "website", url: langUrl(lang, path), siteName: "IDITECHS", locale: copy[lang].meta.locale, title: `${doc.title} · IDITECHS`, description: doc.description },
    robots: { index: true, follow: true },
    icons: ICONS,
  };
}

export function LegalPage({ lang, kind }: { lang: Lang; kind: LegalKind }) {
  const doc = legal[lang][kind];
  const other: LegalKind = kind === "privacy" ? "terms" : "privacy";
  const t = copy[lang];

  return (
    <main lang={lang} className="min-h-screen bg-[#030712] text-gray-100">
      <script dangerouslySetInnerHTML={{ __html: `document.documentElement.lang="${lang}"` }} />
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#030712]/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-4">
          <a href={langUrl(lang)} className="flex items-center gap-3">
            <Image src="/logos/iditechs-icon-180.png" alt="" width={36} height={36} unoptimized className="rounded-full ring-1 ring-cyan-500/40" />
            <span className="font-display text-xl font-bold tracking-[0.2em] text-white">IDITECHS</span>
          </a>
          <LangSwitch lang={lang} path={legalPath[kind]} />
        </div>
      </header>

      <article className="prose prose-invert mx-auto max-w-3xl px-5 py-16 prose-headings:font-display prose-h1:text-4xl prose-h2:mt-10 prose-h2:text-xl prose-a:text-cyan-400 prose-li:my-1">
        <p className="!mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">IDITECHS</p>
        <h1 className="!mb-2">{doc.title}</h1>
        <p className="!mt-0 text-sm text-gray-500">{doc.updated}</p>
        <p className="lead text-gray-300">{doc.intro}</p>
        {doc.sections.map((s) => (
          <section key={s.h}>
            <h2>{s.h}</h2>
            {s.p?.map((para) => <p key={para.slice(0, 40)}>{para}</p>)}
            {s.ul && (
              <ul>
                {s.ul.map((item) => <li key={item.slice(0, 40)}>{item}</li>)}
              </ul>
            )}
          </section>
        ))}
      </article>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-5 py-8 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <p>{legalLine(lang)}</p>
          <nav className="flex gap-4">
            <a href={langUrl(lang)} className="hover:text-white">{lang === "fr" ? "Accueil" : "Home"}</a>
            <a href={langUrl(lang, legalPath[other])} className="hover:text-white">{t.footer[other]}</a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
