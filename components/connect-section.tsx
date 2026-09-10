"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  FiMail,
  FiMapPin,
  FiSend,
  FiGithub,
  FiLinkedin,
  FiUser,
  FiMessageSquare,
  FiAlertCircle,
  FiCheckCircle,
  FiClipboard,
  FiLoader,
  FiArrowUp,
} from "react-icons/fi";
import { FaXTwitter } from "react-icons/fa6";
import FloatingCodeBlock from "@/components/floating-code-block";
import ArtBg from "@/components/art-bg";
import { legalLine } from "@/lib/company";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const socialLinks = [
  {
    name: "GitHub",
    href: "https://github.com/IdrissaMaiga",
    icon: FiGithub,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/idrissa-maiga-16581b245/",
    icon: FiLinkedin,
  },
  {
    name: "X",
    href: "https://x.com/a_idrissamaiga",
    icon: FaXTwitter,
  },
  {
    name: "Email",
    href: "mailto:idrissa.maiga@iditechs.com",
    icon: FiMail,
  },
];

/* ------------------------------------------------------------------ */
/*  Form field wrapper with staggered animation                        */
/* ------------------------------------------------------------------ */

function AnimatedField({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}) {
  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true, margin: "-80px" }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ConnectSection() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);
  const [showCopied, setShowCopied] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);

  /* Form handlers */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState.name || !formState.email || !formState.message) {
      setSubmitStatus({
        success: false,
        message: "Please fill in all required fields.",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(
          `Server returned non-JSON response: ${await response.text()}`
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setSubmitStatus({
        success: true,
        message:
          data.message ||
          "Message sent successfully! I'll get back to you soon.",
      });

      setFormState({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message.includes("non-JSON response")
            ? "Server error. Please try again later or contact me directly at idrissa.maiga@iditechs.com"
            : error.message
          : "Failed to send message. Please try again later.";

      setSubmitStatus({ success: false, message: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyEmail = () => {
    navigator.clipboard.writeText("idrissa.maiga@iditechs.com");
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      id="connect"
      className="relative overflow-x-hidden bg-[#060a14]"
    >
      <ArtBg variant="connect" />

      {/* ---- Floating code block ---- */}
      <FloatingCodeBlock
        code={`await sendMessage({\n  to: "idrissa.maiga",\n  from: visitor.email,\n  subject: "Let's build",\n  priority: "high",\n});`}
        language="typescript"
        position="left"
        className="top-48"
      />

      {/* Spotlight overlay -- fades in via framer-motion */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        viewport={{ once: true, margin: "-200px" }}
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 50% 30%, rgba(251,191,36,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Code-themed decorative elements */}
      <div className="absolute top-10 sm:top-14 left-4 sm:left-12 text-white/[0.15] font-mono text-xs hidden sm:block select-none">
        &lt;section id=&quot;connect&quot;&gt;
      </div>
      <div className="absolute bottom-48 sm:bottom-52 left-4 sm:left-12 text-white/[0.15] font-mono text-xs hidden sm:block select-none">
        &lt;/section&gt;
      </div>

      {/* ================================================================ */}
      {/*  CONTACT AREA                                                     */}
      {/* ================================================================ */}
      <div className="py-12 sm:py-16 lg:py-20 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="mb-10 sm:mb-14 text-center">
            <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs sm:text-sm font-mono font-medium tracking-wide">
              &lt;get_in_touch /&gt;
            </span>
            <h2 className="text-[1.625rem] sm:text-4xl md:text-5xl font-bold mt-5 mb-5 text-white">
              Let&apos;s{" "}
              <span className="text-white">
                Connect
              </span>
            </h2>
            <p className="max-w-xl sm:max-w-2xl mx-auto text-sm sm:text-base text-gray-400 leading-relaxed">
              Have a project in mind or want to discuss opportunities? I&apos;m
              just a message away.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 sm:gap-8 md:gap-10">
            {/* ---- Contact information card ---- */}
            <div className="md:col-span-2">
              <div className="h-full flex flex-col rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/[0.08] p-5 sm:p-7">
                <h3 className="text-lg sm:text-xl font-bold mb-6 sm:mb-8 flex items-center text-white">
                  <span className="text-amber-400 mr-1.5 text-base sm:text-lg font-mono">
                    &lt;
                  </span>
                  Contact Information
                  <span className="text-amber-400 ml-1.5 text-base sm:text-lg font-mono">
                    /&gt;
                  </span>
                </h3>

                <ul className="space-y-5 sm:space-y-6 mb-8 sm:mb-10 flex-1">
                  {/* Email */}
                  <li className="flex items-start group">
                    <div className="mr-3 sm:mr-4 p-2.5 sm:p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                      <FiMail className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-xs text-gray-400 mb-1 font-mono uppercase tracking-wider">
                        Email
                      </span>
                      <div className="flex items-center gap-2">
                        <a
                          href="mailto:idrissa.maiga@iditechs.com"
                          className="text-sm sm:text-base text-gray-200 hover:text-blue-400 transition-colors truncate"
                        >
                          idrissa.maiga@iditechs.com
                        </a>
                        <button
                          onClick={copyEmail}
                          className="flex-shrink-0 text-gray-500 hover:text-blue-400 p-1 rounded-md transition-colors"
                          aria-label="Copy email"
                        >
                          {showCopied ? (
                            <FiCheckCircle className="text-emerald-400 w-4 h-4" />
                          ) : (
                            <FiClipboard className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {showCopied && (
                        <span className="text-xs text-emerald-400 mt-1 font-mono">
                          Copied to clipboard!
                        </span>
                      )}
                    </div>
                  </li>

                  {/* Location */}
                  <li className="flex items-start group">
                    <div className="mr-3 sm:mr-4 p-2.5 sm:p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                      <FiMapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <span className="block text-xs text-gray-400 mb-1 font-mono uppercase tracking-wider">
                        Location
                      </span>
                      <span className="text-sm sm:text-base text-gray-200">
                        Budapest, Hungary
                      </span>
                    </div>
                  </li>
                </ul>

                {/* Social links */}
                <div>
                  <h4 className="text-sm sm:text-base font-semibold mb-4 text-gray-300">
                    Connect With Me
                  </h4>
                  <div className="flex gap-3">
                    {socialLinks.map((social) => (
                      <a
                        key={social.name}
                        href={social.href}
                        target={social.name !== "Email" ? "_blank" : undefined}
                        rel={
                          social.name !== "Email"
                            ? "noopener noreferrer"
                            : undefined
                        }
                        className="p-2.5 sm:p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:bg-blue-500/15 hover:text-blue-400 hover:border-blue-500/30 transition-all duration-300"
                        aria-label={social.name}
                      >
                        <social.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ---- Contact form card ---- */}
            <div className="md:col-span-3">
              <div className="h-full relative rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/[0.08] p-5 sm:p-7 overflow-hidden">
                {/* Code decorations */}
                <div className="absolute top-2 right-5 sm:right-7 text-white/[0.15] font-mono text-xs select-none">
                  {"function sendMessage() {"}
                </div>
                <div className="absolute bottom-2 right-5 sm:right-7 text-white/[0.15] font-mono text-xs select-none">
                  {"}"}
                </div>

                <AnimatedField index={0}>
                  <h3 className="text-lg sm:text-xl font-bold mb-6 sm:mb-8 flex items-center text-white">
                    <span className="text-amber-400 mr-1.5 text-base sm:text-lg font-mono">
                      &lt;
                    </span>
                    Send a Message
                    <span className="text-amber-400 ml-1.5 text-base sm:text-lg font-mono">
                      /&gt;
                    </span>
                  </h3>
                </AnimatedField>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Name */}
                    <AnimatedField index={1}>
                      <label
                        htmlFor="connect-name"
                        className="block text-xs sm:text-sm font-medium text-gray-400 mb-2"
                      >
                        <span className="flex items-center">
                          <FiUser className="mr-1.5 w-3.5 h-3.5" />
                          <span className="font-mono">
                            name<span className="text-red-400">*</span>:
                          </span>
                        </span>
                      </label>
                      <input
                        type="text"
                        id="connect-name"
                        name="name"
                        value={formState.name}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-100 placeholder-gray-400 font-mono text-[16px] sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 hover:border-white/[0.15] transition-all"
                        placeholder="John Doe"
                        required
                      />
                    </AnimatedField>

                    {/* Email */}
                    <AnimatedField index={2}>
                      <label
                        htmlFor="connect-email"
                        className="block text-xs sm:text-sm font-medium text-gray-400 mb-2"
                      >
                        <span className="flex items-center">
                          <FiMail className="mr-1.5 w-3.5 h-3.5" />
                          <span className="font-mono">
                            email<span className="text-red-400">*</span>:
                          </span>
                        </span>
                      </label>
                      <input
                        type="email"
                        id="connect-email"
                        name="email"
                        value={formState.email}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-100 placeholder-gray-400 font-mono text-[16px] sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 hover:border-white/[0.15] transition-all"
                        placeholder="your@email.com"
                        required
                      />
                    </AnimatedField>
                  </div>

                  {/* Subject */}
                  <AnimatedField index={3}>
                    <label
                      htmlFor="connect-subject"
                      className="block text-xs sm:text-sm font-medium text-gray-400 mb-2"
                    >
                      <span className="flex items-center">
                        <span className="font-mono text-blue-400 mr-1.5">const</span>
                        <span className="font-mono">subject:</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      id="connect-subject"
                      name="subject"
                      value={formState.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-100 placeholder-gray-400 font-mono text-[16px] sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 hover:border-white/[0.15] transition-all"
                      placeholder="Project Inquiry"
                    />
                  </AnimatedField>

                  {/* Message */}
                  <AnimatedField index={4}>
                    <label
                      htmlFor="connect-message"
                      className="block text-xs sm:text-sm font-medium text-gray-400 mb-2"
                    >
                      <span className="flex items-center">
                        <FiMessageSquare className="mr-1.5 w-3.5 h-3.5" />
                        <span className="font-mono">
                          message<span className="text-red-400">*</span>:
                        </span>
                      </span>
                    </label>
                    <div className="relative">
                      <div className="absolute top-3 left-4 font-mono text-white/[0.15] text-xs select-none pointer-events-none">
                        {"/*"}
                      </div>
                      <textarea
                        id="connect-message"
                        name="message"
                        value={formState.message}
                        onChange={handleChange}
                        rows={5}
                        className="w-full px-4 py-2.5 sm:py-3 pl-14 sm:pl-16 pt-9 sm:pt-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-100 placeholder-gray-400 font-mono text-[16px] sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 hover:border-white/[0.15] transition-all resize-none"
                        placeholder="Hello Idrissa, I'd like to discuss..."
                        required
                      />
                      <div className="absolute bottom-3 right-4 font-mono text-white/[0.15] text-xs select-none pointer-events-none">
                        {"*/"}
                      </div>
                    </div>
                  </AnimatedField>

                  {/* Status message */}
                  {submitStatus && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3.5 sm:p-4 rounded-xl text-xs sm:text-sm flex items-start border ${
                        submitStatus.success
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-red-500/10 border-red-500/20 text-red-400"
                      }`}
                    >
                      {submitStatus.success ? (
                        <FiCheckCircle className="mr-2 mt-0.5 flex-shrink-0 w-4 h-4" />
                      ) : (
                        <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0 w-4 h-4" />
                      )}
                      <span className="font-mono">{submitStatus.message}</span>
                    </motion.div>
                  )}

                  {/* Submit row */}
                  <AnimatedField index={5}>
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="group relative inline-flex items-center justify-center px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-[16px] sm:text-base font-medium overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <span className="relative flex items-center">
                          {isSubmitting ? (
                            <>
                              <FiLoader className="animate-spin mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                              <span className="font-mono">Processing...</span>
                            </>
                          ) : (
                            <>
                              <FiSend className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                              <span className="font-mono">sendMessage()</span>
                            </>
                          )}
                        </span>
                      </button>
                      <p className="text-xs text-gray-400 font-mono hidden sm:block">
                        <span className="text-red-400">*</span> required fields
                      </p>
                    </div>
                  </AnimatedField>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/*  FOOTER                                                           */}
      {/* ================================================================ */}
      <footer className="relative z-10 text-white">
        {/* Gradient line separator */}
        <div className="h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        <div className="border-t border-white/10" />

        {/* Scroll to top */}
        <div className="flex justify-center pt-8">
          <motion.button
            onClick={scrollToTop}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-3 border border-white/10 transition-colors duration-200"
            aria-label="Scroll to top"
          >
            <FiArrowUp className="w-5 h-5 text-gray-300" />
          </motion.button>
        </div>

        <div className="container mx-auto px-4 sm:px-6 pt-8 pb-10">
          {/* Name & tagline */}
          <div className="flex flex-col items-center text-center space-y-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Idrissa Maiga
              </h3>
              <p className="text-gray-400 text-sm sm:text-base mt-1">
                Full Stack Engineer &middot; Building robust, scalable
                applications
              </p>
            </div>

            {/* Social icons */}
            <div className="flex items-center space-x-5">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  target={social.name !== "Email" ? "_blank" : undefined}
                  rel={
                    social.name !== "Email"
                      ? "noopener noreferrer"
                      : undefined
                  }
                  whileHover={{ scale: 1.15, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2.5 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all duration-200"
                  aria-label={social.name}
                >
                  <social.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-center sm:text-left">
            <p className="text-gray-400 text-xs sm:text-sm">
              &copy; 2026 Idrissa Maiga. All rights reserved.
              <span className="block text-gray-400 mt-1">{legalLine("en")}</span>
            </p>
            <p className="text-gray-400 text-xs sm:text-sm">
              Built with Next.js &amp; Tailwind CSS
            </p>
          </div>
        </div>
      </footer>
    </section>
  );
}
