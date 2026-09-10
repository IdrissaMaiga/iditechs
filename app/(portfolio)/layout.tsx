import type { Metadata } from "next";
import ChatButton from "@/components/chat-button";
import ActionListener from "@/components/action-listener";
import Navbar from "@/components/navbar-section";

export const metadata: Metadata = {
  title: "Idrissa Maiga | Full-Stack Engineer",
  description:
    "Full-Stack Engineer specializing in Java, TypeScript, Python, and AI-powered solutions. Building scalable applications with Spring Boot, React, Next.js, and cloud-native technologies. Based in Budapest, Hungary.",
  keywords: [
    "Full-Stack Developer",
    "Software Engineer",
    "Java Developer",
    "TypeScript",
    "React",
    "Next.js",
    "Spring Boot",
    "AI Engineer",
    "Budapest",
    "Idrissa Maiga",
  ],
  authors: [{ name: "Idrissa Maiga", url: "https://idrissamaiga.iditechs.com" }],
  creator: "Idrissa Maiga",
  alternates: {
    types: { "application/rss+xml": [{ url: "/api/feed", title: "Idrissa Maiga Blog" }] },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://idrissamaiga.iditechs.com",
    siteName: "Idrissa Maiga — Portfolio",
    title: "Idrissa Maiga | Full-Stack Engineer",
    description:
      "Full-Stack Engineer building scalable applications with Java, TypeScript, and AI. Based in Budapest.",
    images: [{ url: "/logos/id_og.jpg", width: 400, height: 400, alt: "Idrissa Maiga" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Idrissa Maiga | Full-Stack Engineer",
    description:
      "Full-Stack Engineer building scalable applications with Java, TypeScript, and AI. Based in Budapest.",
    creator: "@a_idrissamaiga",
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Idrissa Maiga",
  jobTitle: "Full-Stack Engineer",
  url: "https://idrissamaiga.iditechs.com",
  email: "idrissa.maiga@iditechs.com",
  sameAs: [
    "https://github.com/IdrissaMaiga",
    "https://www.linkedin.com/in/idrissa-maiga-16581b245/",
    "https://x.com/a_idrissamaiga",
  ],
  knowsAbout: ["Java", "TypeScript", "Python", "React", "Next.js", "Spring Boot", "AI/ML"],
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: "Óbuda University",
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Budapest",
    addressCountry: "Hungary",
  },
};

// Everything served on idrissamaiga.iditechs.com. The company site (app/company) is deliberately
// outside this group so the portfolio navbar, chat button and loading screen can never reach it.
export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />
      {children}
      <ChatButton />
      <ActionListener />
    </>
  );
}
