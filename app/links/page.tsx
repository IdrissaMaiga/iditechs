import type { Metadata } from "next";
import { db } from "@/lib/db";
import { company } from "@/lib/company";
import { SocialLinks } from "@/components/social-links";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "IDITECHS · Liens",
  description: "Sites web, applications mobiles, logiciels métier et IA à Bamako. Toutes nos offres du moment.",
  alternates: { canonical: `${company.site}/links` },
  robots: { index: false, follow: true },
};

export default async function LinksPage() {
  const campaigns = await db.campaign
    .findMany({ where: { status: "published" }, orderBy: { publishedAt: "desc" }, take: 20, select: { slug: true, title: true } })
    .catch(() => []);

  return (
    <main className="min-h-screen bg-[#0a0e17] text-[#eef1f7] px-5 py-12">
      <div className="mx-auto max-w-md flex flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">{company.brand}</h1>
          <p className="mt-2 text-sm text-[#9aa3b5]">Sites web · Applications mobiles · Logiciels métier · IA</p>
          <p className="text-xs text-[#6a7284]">Bamako, Mali</p>
        </div>
        <nav className="w-full flex flex-col gap-3" aria-label="Liens">
          {campaigns.map((c) => (
            <a
              key={c.slug}
              href={`/go/${c.slug}?c=instagram`}
              className="block w-full rounded-xl border border-[#4da6ff]/40 bg-[#4da6ff]/10 px-5 py-4 text-center font-semibold hover:bg-[#4da6ff]/20 transition-colors"
            >
              {c.title}
            </a>
          ))}
          <a href={company.site} className="block w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-center hover:bg-white/10 transition-colors">
            Site web IDITECHS
          </a>
          <a
            href={`https://wa.me/${company.whatsapp}`}
            className="block w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-center hover:bg-white/10 transition-colors"
          >
            Nous écrire sur WhatsApp
          </a>
        </nav>
        <SocialLinks size={15} className="justify-center" />
        <p className="text-xs text-[#6a7284]">{company.email}</p>
      </div>
    </main>
  );
}
