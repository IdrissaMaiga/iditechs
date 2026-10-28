import type { Metadata } from "next";
import Image from "next/image";
import { company, legalLine } from "@/lib/company";

const MEDIA = "https://media.iditechs.com";
const heroImage = `${MEDIA}/company/hero.jpg`;
const ogImage = `${MEDIA}/company/og.png`;

export const metadata: Metadata = {
  title: "IDITECHS · Services informatiques à Bamako",
  description:
    "Sites web, logiciels métier, installation informatique et formation pour les écoles, commerces, cliniques, restaurants et ONG de Bamako. Devis sous 48 h, acompte 50 %, reçu à chaque paiement.",
  // Without this the page inherits the portfolio's keywords (Java, React, Budapest...).
  keywords: [
    "création site web Bamako",
    "développeur web Mali",
    "site internet entreprise Bamako",
    "logiciel de gestion Mali",
    "boutique en ligne Bamako",
    "installation informatique Bamako",
    "formation informatique Mali",
    "IDITECHS",
  ],
  authors: [{ name: company.brand, url: company.site }],
  creator: company.brand,
  publisher: company.brand,
  alternates: { canonical: company.site },
  openGraph: {
    type: "website",
    url: company.site,
    siteName: "IDITECHS",
    locale: "fr_ML",
    title: "IDITECHS · Services informatiques à Bamako",
    description:
      "Sites web, logiciels métier, installation informatique et formation pour les entreprises de Bamako. Entreprise immatriculée au RCCM.",
    images: [{ url: ogImage, width: 1200, height: 630, alt: "IDITECHS · services informatiques à Bamako" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "IDITECHS · Services informatiques à Bamako",
    images: [ogImage],
  },
  robots: { index: true, follow: true },
  other: {
    "facebook-domain-verification": "qs6fg4yzfgg351p79qk5wvxqozg1q0",
  },
};

const services = [
  { title: "Site vitrine", desc: "5 à 8 pages, trouvable sur Google, bouton WhatsApp, formation à la mise à jour.", meta: "3 à 10 jours · acompte 50 %" },
  { title: "Site & boutique en ligne", desc: "Catalogue, commandes par WhatsApp, paiement Orange Money, gestion depuis le téléphone.", meta: "2 à 4 semaines · acompte 50 %" },
  { title: "Logiciel métier", desc: "Inscriptions, facturation, stock, rendez-vous, suivi de livraisons : un outil simple fait pour votre activité.", meta: "2 à 8 semaines · acompte 50 %" },
  { title: "Installation & réseau", desc: "Ordinateurs, imprimantes, Wi-Fi, sauvegardes, sécurité de base pour un bureau ou un commerce.", meta: "Sur devis · acompte 70 à 100 %" },
  { title: "Formation", desc: "Vos équipes autonomes sur vos outils, WhatsApp Business, Google Maps, bureautique.", meta: "Par session · réglée avant la séance" },
  { title: "Maintenance mensuelle", desc: "Mises à jour, sauvegardes, corrections et petites évolutions, avec un interlocuteur unique.", meta: "Abonnement mensuel" },
];

const steps = [
  ["1", "Échange", "Un appel ou une discussion WhatsApp de 15 minutes pour comprendre votre besoin."],
  ["2", "Devis sous 48 h", "Un devis clair : ce qui est inclus, le délai, le prix. Valable 30 jours."],
  ["3", "Acompte et démarrage", "Vous répondez « bon pour accord » et versez l'acompte par Orange Money. Le travail commence."],
  ["4", "Livraison et formation", "Vous validez, vous êtes formé, vous réglez le solde. Un reçu à chaque paiement."],
  ["5", "Garantie 30 jours", "Corrections gratuites pendant 30 jours, puis maintenance si vous le souhaitez."],
];

const wa = `https://wa.me/${company.whatsapp}?text=${encodeURIComponent("Bonjour IDITECHS, je souhaite un devis pour ")}`;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: company.brand,
  url: company.site,
  email: company.email,
  telephone: company.phones[0],
  founder: { "@type": "Person", name: company.owner, url: company.portfolio },
  address: { "@type": "PostalAddress", addressLocality: "Bamako", addressRegion: "Commune V, Kalabancoura", addressCountry: "ML" },
  areaServed: "Bamako, Mali",
  identifier: [{ "@type": "PropertyValue", propertyID: "RCCM", value: company.rccm }],
  sameAs: [company.portfolio],
};

export default function CompanyPage() {
  return (
    <main lang="fr" className="min-h-screen bg-[#030712] text-gray-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#030712]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <a href="#top" className="font-display text-xl font-bold tracking-[0.2em] text-white">IDITECHS</a>
          <nav className="hidden gap-6 text-sm text-gray-300 sm:flex">
            <a href="#services" className="hover:text-white">Services</a>
            <a href="#process" className="hover:text-white">Comment ça marche</a>
            <a href="#about" className="hover:text-white">À propos</a>
            <a href="#contact" className="hover:text-white">Contact</a>
          </nav>
          <a href={wa} target="_blank" rel="noopener noreferrer" className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:bg-cyan-400">
            WhatsApp
          </a>
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
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">Services informatiques · Bamako</p>
          <h1 className="font-display max-w-3xl text-4xl font-bold leading-tight text-white sm:text-6xl">
            Votre entreprise, visible et organisée.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-gray-300">
            Sites web, boutiques en ligne, logiciels métier, installation informatique et formation pour les écoles, commerces, cliniques,
            restaurants et ONG de Bamako. Livré à date fixe, avec formation et garantie.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={wa} target="_blank" rel="noopener noreferrer" className="rounded-full bg-cyan-500 px-6 py-3 font-semibold text-black hover:bg-cyan-400">
              Demander un devis sur WhatsApp
            </a>
            <a href={`mailto:${company.email}`} className="rounded-full border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/10">
              {company.email}
            </a>
          </div>
          <p className="mt-6 text-sm text-gray-500">Entreprise immatriculée au RCCM de Bamako · {company.rccm}</p>
        </div>
      </section>

      <section id="services" className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="font-display text-3xl font-bold text-white">Ce que nous faisons</h2>
          <p className="mt-3 max-w-2xl text-gray-400">Pas d'inventaire, pas de surprise : chaque prestation démarre par un devis écrit et un acompte, et se termine par une livraison, une formation et un reçu.</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <div key={s.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-cyan-500/40">
                <h3 className="text-lg font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-300">{s.desc}</p>
                <p className="mt-4 text-xs font-medium uppercase tracking-wider text-cyan-400">{s.meta}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="process" className="border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="font-display text-3xl font-bold text-white">Comment ça marche</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-5">
            {steps.map(([n, t, d]) => (
              <li key={n} className="relative rounded-2xl border border-white/10 p-5">
                <span className="font-display text-3xl font-bold text-cyan-400">{n}</span>
                <h3 className="mt-2 font-semibold text-white">{t}</h3>
                <p className="mt-2 text-sm text-gray-300">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="about" className="border-t border-white/10">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold text-white">Pourquoi IDITECHS</h2>
            <ul className="mt-6 space-y-4 text-gray-300">
              <li><strong className="text-white">Une entreprise enregistrée.</strong> IDITECHS est immatriculée au Registre du Commerce de Bamako ({company.rccm}). Vous recevez un devis, une facture et un reçu pour chaque paiement.</li>
              <li><strong className="text-white">Un ingénieur, pas un intermédiaire.</strong> Le travail est réalisé par {company.owner}, ingénieur logiciel, qui construit des applications pour des entreprises en Europe et au Mali.</li>
              <li><strong className="text-white">Bamako et à distance.</strong> Rendez-vous sur place à Bamako pour la signature, la formation et l'installation ; suivi quotidien par WhatsApp.</li>
              <li><strong className="text-white">Paiement simple.</strong> Orange Money ou espèces contre reçu. Acompte pour démarrer, solde à la livraison.</li>
            </ul>
            <a href={company.portfolio} className="mt-6 inline-block text-cyan-400 hover:text-cyan-300" target="_blank" rel="noopener noreferrer">
              Voir le parcours et les projets du fondateur →
            </a>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="font-semibold text-white">Pour qui</h3>
            <p className="mt-2 text-sm text-gray-300">Écoles et centres de formation, pharmacies et cliniques, restaurants et services de livraison, boutiques et vendeurs en ligne, ONG et associations, salons et prestataires sur rendez-vous.</p>
            <h3 className="mt-6 font-semibold text-white">In English</h3>
            <p className="mt-2 text-sm text-gray-300">IDITECHS is a registered IT services business in Bamako, Mali: websites, small business software, office IT setup and training, delivered on a fixed date with a written quote, a deposit and a receipt for every payment. We work with NGOs and companies abroad remotely.</p>
          </div>
        </div>
      </section>

      <section id="contact" className="border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="font-display text-3xl font-bold text-white">Contact</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 p-6">
              <p className="text-xs uppercase tracking-wider text-gray-500">WhatsApp / Téléphone</p>
              {company.phones.map((p) => (
                <p key={p} className="mt-2 text-lg text-white">{p}</p>
              ))}
            </div>
            <div className="rounded-2xl border border-white/10 p-6">
              <p className="text-xs uppercase tracking-wider text-gray-500">Email</p>
              <a href={`mailto:${company.email}`} className="mt-2 block text-lg text-white hover:text-cyan-300">{company.email}</a>
            </div>
            <div className="rounded-2xl border border-white/10 p-6">
              <p className="text-xs uppercase tracking-wider text-gray-500">Adresse</p>
              <p className="mt-2 text-lg text-white">{company.address}</p>
            </div>
          </div>
          <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-8 inline-block rounded-full bg-cyan-500 px-6 py-3 font-semibold text-black hover:bg-cyan-400">
            Écrire sur WhatsApp
          </a>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-8 text-center text-xs text-gray-500">
          <p>{legalLine("fr")}</p>
          <p className="mt-2">© 2026 {company.brand}. Tous droits réservés.</p>
        </div>
      </footer>
    </main>
  );
}
