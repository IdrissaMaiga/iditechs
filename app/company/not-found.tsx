import type { Metadata } from "next";
import Image from "next/image";
import { company } from "@/lib/company";

export const metadata: Metadata = {
  title: "Page introuvable · IDITECHS",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#030712] px-5 text-center text-gray-100">
      <Image src="/logos/iditechs-icon-180.png" alt="" width={72} height={72} unoptimized className="rounded-full ring-1 ring-cyan-500/40" />
      <p className="mt-8 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">404</p>
      <h1 lang="fr" className="font-display mt-3 text-3xl font-bold text-white sm:text-4xl">Page introuvable</h1>
      <p lang="en" className="mt-2 text-gray-400">Page not found</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a href={company.site} lang="fr" className="rounded-full bg-cyan-500 px-6 py-3 font-semibold text-black hover:bg-cyan-400">Retour à l&apos;accueil</a>
        <a href={`${company.site}/en`} lang="en" className="rounded-full border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/10">Back to home</a>
      </div>
    </main>
  );
}
