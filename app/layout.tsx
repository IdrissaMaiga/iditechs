import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { headers } from "next/headers";
import { isCompanyHost } from "@/lib/company";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import SessionProvider from "@/components/session-provider";
import ChatButton from "@/components/chat-button";
import ActionListener from "@/components/action-listener";
import Navbar from "@/components/navbar-section";
import HideOnCompany from "@/components/hide-on-company";
import PageTracker from "@/components/page-tracker";

// Font configuration with responsive weights
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
  preload: true,
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space",
  weight: ["400", "500", "700"],
  preload: true,
});

// Metadata
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
  metadataBase: new URL("https://idrissamaiga.iditechs.com"),
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
  robots: {
    index: true,
    follow: true,
  },
};

// Viewport export
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#030712" },
  ],
};

// JSON-LD structured data
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // On iditechs.com the middleware rewrites "/" to /company, so the browser path stays "/" and the
  // pathname-based HideOnCompany never fires. Decide by Host here; HideOnCompany still covers
  // /company reached directly on the portfolio host.
  const company = isCompanyHost(headers().get("host"));

  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth dark">
      <head>
        {/* Favicon with responsive support */}
        <link rel="icon" href="/favicon.ico" />
        {/* Preconnect to Google Fonts */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {!company && (
          <>
            {/* RSS Feed */}
            <link rel="alternate" type="application/rss+xml" title="Idrissa Maiga Blog" href="/api/feed" />
            {/* JSON-LD structured data */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
          </>
        )}
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            {!company && (
              <HideOnCompany>
                <Navbar />
              </HideOnCompany>
            )}
            {children}
            {!company && (
              <HideOnCompany>
                <ChatButton />
              </HideOnCompany>
            )}
            <ActionListener />
            <PageTracker />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
