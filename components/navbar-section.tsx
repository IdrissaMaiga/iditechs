"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { FiMenu, FiX, FiDownload, FiLogIn, FiLogOut, FiGithub, FiLinkedin, FiBarChart2 } from "react-icons/fi";
import { useSession, signIn, signOut } from "next-auth/react";

const GITHUB_URL = "https://github.com/IdrissaMaiga";
const LINKEDIN_URL = "https://www.linkedin.com/in/idrissa-maiga-16581b245/";

const navLinks = [
  { name: "Home", href: "/#home" },
  { name: "Work", href: "/#projects" },
  { name: "Story", href: "/#story" },
  { name: "Expertise", href: "/#skills" },
  { name: "Insights", href: "/#insights" },
  { name: "Connect", href: "/#connect" },
  { name: "Blog", href: "/blog" },
];

const SECTION_IDS = navLinks
  .filter((link) => link.href.startsWith("/#"))
  .map((link) => link.href.replace("/#", ""));

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const { data: session } = useSession();
  const isOwner = (session?.user as { isOwner?: boolean })?.isOwner === true;

  // Mailboxes is owner-only: any signed-in visitor used to see it and land on a dead end.
  const links = isOwner ? [...navLinks, { name: "Mailboxes", href: "/mail" }, { name: "WhatsApp", href: "/whatsapp" }] : navLinks;

  useEffect(() => {
    if (pathname.startsWith("/blog")) {
      setActiveSection("blog");
    } else if (pathname === "/stats") {
      setActiveSection("stats");
    } else if (pathname === "/") {
      setActiveSection("home");
    }
  }, [pathname]);

  useEffect(() => {
    let ticking = false;

    // Coalesced into one rAF: the rect loop forces layout, and it used to run on every scroll event.
    const update = () => {
      ticking = false;
      setScrolled(window.scrollY > 10);
      if (pathname !== "/") return;
      for (const id of SECTION_IDS) {
        const rect = document.getElementById(id)?.getBoundingClientRect();
        if (rect && rect.top <= 100 && rect.bottom >= 100) {
          setActiveSection(id);
          break;
        }
      }
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update(); // deep links like /#projects start with the right state
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  // Lock the page behind the open mobile menu, and close it if the viewport
  // grows past xl where the panel is hidden but the lock would persist.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    document.body.style.overflow = "hidden";
    const onResize = () => {
      if (window.innerWidth >= 1280) setMobileMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("resize", onResize);
    };
  }, [mobileMenuOpen]);

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-[padding,background-color,border-color,box-shadow] duration-300 safe-area-inset ${
        scrolled
          ? "py-3 bg-white/5 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/10"
          : "py-3 sm:py-4 bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo & Name */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="relative group"
            title="View LinkedIn Profile"
          >
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 overflow-hidden rounded-full transition-all duration-300 border-2 border-white/30 group-hover:border-blue-500 group-hover:shadow-[0_0_12px_rgba(59,130,246,0.4)]">
              <Image
                src="/logos/id_.jpg"
                alt="Idrissa Maiga"
                fill
                sizes="40px"
                className="object-cover object-top"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#0A66C2] border-2 border-[#0a0f1e] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <FiLinkedin className="w-2.5 h-2.5 text-white" />
            </span>
          </a>
          <Link
            href="/#home"
            className="group touch-friendly"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors duration-300">
              Idrissa Maiga
            </span>
            <span className="block text-xs sm:text-sm text-gray-400 font-mono">
              Full Stack Engineer
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden xl:flex items-center">
          <ul className="flex space-x-1">
            {links.map((link) => (
              <li key={link.name}>
                <Link
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 relative ${
                    (link.href === "/blog" ? activeSection === "blog" : activeSection === link.href.replace("/#", ""))
                      ? "text-blue-400"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  {link.name}
                  {(link.href === "/blog" ? activeSection === "blog" : activeSection === link.href.replace("/#", "")) && (
                    <motion.span
                      layoutId="activeSection"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              </li>
            ))}
            {isOwner && (
              <li>
                <Link
                  href="/stats"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 relative flex items-center gap-1.5 ${
                    activeSection === "stats"
                      ? "text-blue-400"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  <FiBarChart2 className="w-3.5 h-3.5" />
                  Stats
                  {activeSection === "stats" && (
                    <motion.span
                      layoutId="activeSection"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Social Links, always visible */}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex sm:min-w-[44px] sm:min-h-[44px] sm:items-center sm:justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
            title="GitHub"
          >
            <FiGithub className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
          </a>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex sm:min-w-[44px] sm:min-h-[44px] sm:items-center sm:justify-center rounded-lg text-gray-400 hover:text-[#0A66C2] hover:bg-[#0A66C2]/10 transition-all duration-200"
            title="LinkedIn"
          >
            <FiLinkedin className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
          </a>

          <div className="w-px h-5 bg-white/10 hidden sm:block" />

          {/* Resume Download Button */}
          <a
            href="/IdrissaMaigaCV.pdf"
            download
            className="hidden sm:flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 hover:text-blue-300 transition-all duration-200"
          >
            <FiDownload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium">Resume</span>
          </a>

          {/* Auth Button */}
          {session ? (
            <button
              onClick={() => signOut()}
              className="hidden sm:flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 text-gray-300 border border-white/10 rounded-lg hover:bg-white/20 hover:text-white transition-all duration-200"
            >
              {session.user?.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name || ""}
                  width={20}
                  height={20}
                  className="rounded-full"
                />
              )}
              <FiLogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="hidden sm:flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 text-gray-300 border border-white/10 rounded-lg hover:bg-white/20 hover:text-white transition-all duration-200"
            >
              <FiLogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium">Sign In</span>
            </button>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white transition-all duration-200"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <FiX className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <FiMenu className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="xl:hidden overflow-hidden border-t border-white/10 bg-[#030712]/95 backdrop-blur-lg safe-area-inset"
          >
            <nav className="container mx-auto px-4 py-4 max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain">
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                        (link.href === "/blog" ? activeSection === "blog" : activeSection === link.href.replace("/#", ""))
                          ? "bg-blue-500/15 text-blue-400"
                          : "text-gray-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
                {isOwner && (
                  <li>
                    <Link
                      href="/stats"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                        activeSection === "stats"
                          ? "bg-blue-500/15 text-blue-400"
                          : "text-gray-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <FiBarChart2 className="w-4 h-4" />
                      Stats
                    </Link>
                  </li>
                )}
                <li className="pt-2 flex gap-2">
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-white/[0.06] text-gray-300 border border-white/10 rounded-lg hover:bg-white/10 hover:text-white transition-all duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FiGithub className="w-4 h-4" />
                    <span className="text-sm font-medium">GitHub</span>
                  </a>
                  <a
                    href={LINKEDIN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#0A66C2]/10 text-[#0A66C2] border border-[#0A66C2]/20 rounded-lg hover:bg-[#0A66C2]/20 transition-all duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FiLinkedin className="w-4 h-4" />
                    <span className="text-sm font-medium">LinkedIn</span>
                  </a>
                </li>
                <li>
                  <a
                    href="/IdrissaMaigaCV.pdf"
                    download
                    className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-all duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FiDownload className="w-4 h-4" />
                    <span className="text-sm font-medium">Download Resume</span>
                  </a>
                </li>
                <li>
                  {session ? (
                    <button
                      onClick={() => { signOut(); setMobileMenuOpen(false); }}
                      className="flex items-center space-x-2 px-4 py-2.5 w-full bg-white/10 text-gray-300 border border-white/10 rounded-lg hover:bg-white/20 transition-all duration-200"
                    >
                      {session.user?.image && (
                        <Image
                          src={session.user.image}
                          alt={session.user.name || ""}
                          width={20}
                          height={20}
                          className="rounded-full"
                        />
                      )}
                      <span className="text-sm font-medium">Sign Out</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => { signIn("google"); setMobileMenuOpen(false); }}
                      className="flex items-center space-x-2 px-4 py-2.5 w-full bg-white/10 text-gray-300 border border-white/10 rounded-lg hover:bg-white/20 transition-all duration-200"
                    >
                      <FiLogIn className="w-4 h-4" />
                      <span className="text-sm font-medium">Sign In with Google</span>
                    </button>
                  )}
                </li>
              </ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
