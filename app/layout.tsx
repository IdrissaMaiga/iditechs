import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import SessionProvider from "@/components/session-provider";
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

// Two sites share this layout: the portfolio (app/(portfolio), which owns the navbar, chat button,
// loading screen and Person schema) and the IDITECHS company page (app/company). Keep anything
// portfolio-specific out of here or it leaks onto iditechs.com.
export const metadata: Metadata = {
  metadataBase: new URL("https://idrissamaiga.iditechs.com"),
  title: "Idrissa Maiga | Full-Stack Engineer",
  description:
    "Full-Stack Engineer building scalable applications with Java, TypeScript, and AI. Based in Budapest.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#030712" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth dark">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            {children}
            <PageTracker />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
