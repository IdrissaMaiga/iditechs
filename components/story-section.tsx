"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import {
  FiUser,
  FiAward,
  FiMapPin,
  FiGlobe,
  FiBriefcase,
  FiCalendar,
  FiBookOpen,
  FiLinkedin,
} from "react-icons/fi";
import AnimatedCounter from "@/components/animated-counter";
import FloatingCodeBlock from "@/components/floating-code-block";
import ArtBg from "@/components/art-bg";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const tabs = [
  { id: "background", label: "Background", icon: <FiUser className="w-4 h-4" /> },
  { id: "education", label: "Education", icon: <FiBookOpen className="w-4 h-4" /> },
  { id: "experience", label: "Experience", icon: <FiBriefcase className="w-4 h-4" /> },
];

const languages = [
  { lang: "English", level: "Fluent" },
  { lang: "French", level: "Native" },
  { lang: "Bambara", level: "Native" },
  { lang: "Hungarian", level: "Beginner" },
];

const certifications = [
  { name: "HOOK SHMN Mentor Camp 2025", desc: "Hungarian Student Leadership & Mentorship" },
  { name: "INDUSAC Co-Creation Certificate", desc: "Innovation Ecosystem Development" },
  { name: "Spring Boot & Microservices", desc: "Comprehensive Backend Architecture" },
  { name: "Full-Stack JS (MERN)", desc: "MERN Stack Specialization" },
  { name: "ASP.NET Core with Orchard CMS", desc: "Advanced .NET Development" },
  { name: "CCNA", desc: "Cisco Networking Certification" },
  { name: "Kennedy Lugar YES Program Scholar", desc: "Cultural Exchange Program, USA" },
];

const techHighlights = [
  "Java",
  "JavaScript",
  "Python",
  "MERN Stack",
  "React Native",
  "Spring Boot",
  "Cloud Systems",
];

const timelineNodes = [
  { label: "Bamako, Mali", sub: "Born & raised", color: "#f59e0b", year: "2002", icon: <FiMapPin className="w-3.5 h-3.5" /> },
  { label: "USA (YES Program)", sub: "Cultural exchange scholar", color: "#10b981", year: "2019", icon: <FiGlobe className="w-3.5 h-3.5" /> },
  { label: "Budapest", sub: "Relocated to Hungary", color: "#3b82f6", year: "2023", icon: <FiMapPin className="w-3.5 h-3.5" /> },
  { label: "Óbuda University", sub: "BSc Computer Software Eng.", color: "#8b5cf6", year: "2023", icon: <FiBookOpen className="w-3.5 h-3.5" /> },
  { label: "EISMEA", sub: "Full Stack Engineer", color: "#06b6d4", year: "2025", icon: <FiBriefcase className="w-3.5 h-3.5" /> },
  { label: "4D Consulting", sub: "Software Developer Intern", color: "#ec4899", year: "Now", icon: <FiBriefcase className="w-3.5 h-3.5" /> },
];

// Each number is attributable to something on this page. "530+ Commits" used to sit
// here: hardcoded, so it only aged worse, and low for a working engineer.
const stats = [
  { target: 28, suffix: "+", label: "Projects shipped", color: "#3b82f6" },
  { target: 5000, suffix: "+", label: "Monthly users on horizoneurope.io", color: "#10b981" },
  { target: 1100, suffix: "+", label: "Neptun API endpoints mapped", color: "#a855f7" },
];

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.4, ease: "easeOut" },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function StorySection() {
  const [activeTab, setActiveTab] = useState("background");

  return (
    <section
      id="story"
      className="py-12 sm:py-16 lg:py-20 relative bg-[#080d1c] overflow-x-clip"
    >
      <ArtBg variant="story" />

      {/* ---- Floating code blocks ---- */}
      <FloatingCodeBlock
        code={`class Developer:\n    name = "Idrissa Maiga"\n    location = "Budapest, HU"\n    gpa = 8.7\n\n    def build(self, idea):\n        return Solution(idea)`}
        language="python"
        position="left"
        className="top-40"
      />
      <FloatingCodeBlock
        code={`const journey = [\n  "Bamako, Mali",\n  "USA (YES Program)",\n  "Budapest, Hungary",\n  "Óbuda University",\n];`}
        language="typescript"
        position="right"
        className="bottom-32"
      />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* ---- Section Header ---- */}
        <div className="mb-12 sm:mb-16 text-center">
          <span className="inline-block px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-cyan-400 text-sm font-medium mb-6">
            About Me
          </span>
          <h2 className="text-[1.625rem] sm:text-4xl md:text-5xl font-bold text-white mb-4">
            My{" "}
            <span className="text-white">
              Story
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-gray-400 text-base sm:text-lg leading-relaxed">
            Software Developer specializing in Java, JavaScript, and Python.
            Focused on algorithmic problem-solving and building scalable solutions.
          </p>
        </div>

        {/* ---- Two-column layout ---- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* LEFT: Personal Info Card */}
          <motion.div
            initial={{ x: -80, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
            className="relative"
          >
            <div className="relative z-10 h-full rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6 sm:p-8 overflow-hidden group">
              {/* Hover glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              <div className="relative z-10">
                {/* Profile photo in glowing ring, links to LinkedIn */}
                <div className="flex justify-center mb-6">
                  <a
                    href="https://www.linkedin.com/in/idrissa-maiga-16581b245/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative w-28 h-28 sm:w-32 sm:h-32 group"
                    title="View LinkedIn Profile"
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 blur-md opacity-50 group-hover:opacity-80 transition-opacity duration-300" />
                    <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-cyan-400/30 group-hover:border-blue-400 transition-colors duration-300">
                      <Image
                        src="/logos/id_.jpg"
                        alt="Idrissa Maiga"
                        fill
                        sizes="128px"
                        className="object-cover object-top"
                      />
                    </div>
                    <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#0A66C2] border-2 border-[#080d1c] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
                      <FiLinkedin className="w-3.5 h-3.5 text-white" />
                    </span>
                  </a>
                </div>

                <h3 className="text-xl font-bold text-white mb-6 text-center">
                  Idrissa Maiga
                </h3>

                <ul className="space-y-5 text-sm sm:text-base">
                  <li className="flex items-start">
                    <span className="text-gray-500 font-medium min-w-[90px] sm:min-w-[100px]">Name</span>
                    <span className="text-gray-200">Idrissa Maiga</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-500 font-medium min-w-[90px] sm:min-w-[100px]">Born in</span>
                    <span className="text-gray-200">Bamako, Mali</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-500 font-medium min-w-[90px] sm:min-w-[100px]">Location</span>
                    <span className="text-gray-200 flex items-center">
                      <FiMapPin className="mr-1.5 w-4 h-4 text-blue-400/70" />
                      Budapest, Hungary
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-500 font-medium min-w-[90px] sm:min-w-[100px]">Languages</span>
                    <div className="flex flex-col space-y-2">
                      {languages.map((item) => (
                        <span key={item.lang} className="flex items-center text-gray-300">
                          <FiGlobe className="mr-1.5 w-3.5 h-3.5 text-cyan-400/60" />
                          {item.lang}{" "}
                          <span className="text-gray-500 ml-1">({item.level})</span>
                        </span>
                      ))}
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* RIGHT: Timeline + Tabs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Career Journey */}
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6 sm:p-8 overflow-hidden">
              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-8 flex items-center gap-2">
                <span className="w-6 h-px bg-gradient-to-r from-cyan-500 to-transparent" />
                Career Journey
              </h4>

              <div className="relative">
                {/* Vertical connecting line (mobile) / horizontal (desktop) */}
                <div className="absolute top-0 bottom-0 left-[19px] w-px bg-gradient-to-b from-amber-500/30 via-blue-500/30 to-pink-500/30 sm:hidden" />
                <motion.div
                  className="absolute top-5 left-0 right-0 h-px hidden sm:block origin-left"
                  style={{ background: "linear-gradient(90deg, #f59e0b30, #3b82f630, #8b5cf630, #06b6d430, #ec489930)" }}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  viewport={{ once: true, margin: "-80px" }}
                />

                <div className="flex flex-col sm:grid sm:grid-cols-6 gap-6 sm:gap-3">
                  {timelineNodes.map((node, i) => (
                    <motion.div
                      key={node.label}
                      initial={{ y: 20, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: i * 0.12, ease: "easeOut" }}
                      viewport={{ once: true, margin: "-60px" }}
                      className="relative group"
                    >
                      {/* Mobile: horizontal card layout */}
                      {/* Desktop: vertical card layout */}
                      <div className="flex sm:flex-col items-start sm:items-center gap-4 sm:gap-0">
                        {/* Node circle */}
                        <div className="relative z-10 flex-shrink-0 sm:mb-4">
                          <motion.div
                            className="w-10 h-10 rounded-full flex items-center justify-center border-2"
                            style={{
                              borderColor: node.color,
                              background: `${node.color}15`,
                              boxShadow: `0 0 20px ${node.color}25`,
                            }}
                            whileHover={{
                              scale: 1.15,
                              boxShadow: `0 0 30px ${node.color}50`,
                            }}
                          >
                            <span style={{ color: node.color }}>{node.icon}</span>
                          </motion.div>
                        </div>

                        {/* Content card */}
                        <div className="flex-1 sm:text-center">
                          {/* Year badge */}
                          <span
                            className="inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-1.5"
                            style={{
                              color: node.color,
                              background: `${node.color}15`,
                              border: `1px solid ${node.color}25`,
                            }}
                          >
                            {node.year}
                          </span>
                          <p className="text-sm font-semibold text-white leading-tight">
                            {node.label}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                            {node.sub}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tabbed Content */}
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6 sm:p-8 flex flex-col relative overflow-hidden">
              {/* Tab Navigation */}
              <div className="flex flex-wrap gap-2 mb-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-2 py-2.5 px-4 sm:px-5 rounded-xl text-sm font-medium transition-all duration-300 ${
                      activeTab === tab.id
                        ? "text-white"
                        : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
                    }`}
                  >
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="storyActiveTab"
                        className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/20 rounded-xl"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{tab.icon}</span>
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1">
                <AnimatePresence mode="wait">
                  {activeTab === "background" && (
                    <motion.div
                      key="background"
                      {...fadeIn}
                      className="space-y-4 text-gray-300 text-sm sm:text-base leading-relaxed"
                    >
                      <p>
                        Software Developer specializing in Java, JavaScript, and
                        Python with a focus on algorithmic problem-solving and
                        building scalable solutions. Expertise in MERN stack,
                        React Native, Spring Boot, and cloud systems.
                      </p>
                      <p>
                        Proven track record delivering enterprise-grade
                        applications for EU institutions and innovation
                        platforms. Specialized in microservices architecture,
                        RESTful API design, real-time data processing, and AI/ML
                        integration.
                      </p>
                      <p>
                        Currently pursuing BSc in Computer Software Engineering
                        at Óbuda University (GPA: 8.7/10) while maintaining an
                        active development portfolio. Multilingual professional
                        fluent in English, French, and Bambara.
                      </p>

                      {/* Tech highlights */}
                      <div className="pt-4 flex flex-wrap gap-2">
                        {techHighlights.map((tech) => (
                          <span
                            key={tech}
                            className="px-3 py-1.5 text-xs rounded-lg bg-white/[0.04] border border-white/[0.06] text-gray-400"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "education" && (
                    <motion.div key="education" {...fadeIn} className="space-y-6">
                      {/* Degree */}
                      <div className="relative pl-8 border-l-2 border-blue-500/30">
                        <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1 ring-4 ring-blue-500/10" />
                        <h4 className="text-base sm:text-lg font-semibold text-white">
                          BSc Computer Software Engineering
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
                          <span className="text-blue-400 text-sm font-medium">
                            Óbuda University
                          </span>
                          <span className="text-gray-600">|</span>
                          <span className="flex items-center text-gray-500 text-sm">
                            <FiCalendar className="mr-1 w-3.5 h-3.5" />
                            Sep 2023 - Feb 2027
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm">
                          GPA: 8.7/10 | Budapest, Hungary
                        </p>
                      </div>

                      {/* Certifications */}
                      <div className="relative pl-8 border-l-2 border-purple-500/30">
                        <div className="absolute w-3 h-3 bg-purple-500 rounded-full -left-[7px] top-1 ring-4 ring-purple-500/10" />
                        <h4 className="text-base sm:text-lg font-semibold text-white mb-3">
                          Certifications
                        </h4>
                        <ul className="space-y-2.5">
                          {certifications.map((cert) => (
                            <li key={cert.name} className="flex items-start group/cert">
                              <FiAward className="w-4 h-4 text-purple-400/70 mt-0.5 mr-2.5 flex-shrink-0" />
                              <div>
                                <span className="text-gray-200 text-sm font-medium">
                                  {cert.name}
                                </span>
                                <span className="text-gray-500 text-sm ml-1.5">
                                  &middot; {cert.desc}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "experience" && (
                    <motion.div key="experience" {...fadeIn} className="space-y-6">
                      {/* Experience 1 */}
                      <div className="relative pl-8 border-l-2 border-cyan-500/30">
                        <div className="absolute w-3 h-3 bg-cyan-500 rounded-full -left-[7px] top-1 ring-4 ring-cyan-500/10" />
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="text-base sm:text-lg font-semibold text-white">
                            Software Developer Intern
                          </h4>
                          <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium uppercase tracking-wider">
                            Current
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
                          <span className="text-blue-400 text-sm font-medium">
                            4D Consulting Kft.
                          </span>
                          <span className="text-gray-600">|</span>
                          <span className="flex items-center text-gray-500 text-sm">
                            <FiCalendar className="mr-1 w-3.5 h-3.5" />
                            Aug 2025 - Present
                          </span>
                          <span className="text-gray-600">|</span>
                          <span className="flex items-center text-gray-500 text-sm">
                            <FiMapPin className="mr-1 w-3.5 h-3.5" />
                            Budapest
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                          Leading development of the INDUSAC Innovation Ecosystem
                          Matchmaking Platform connecting startups, investors,
                          and research institutions across European innovation
                          markets. Architecting scalable microservices backend
                          using Spring Boot with PostgreSQL, implementing
                          intelligent matching algorithms.
                        </p>
                      </div>

                      {/* Experience 2 */}
                      <div className="relative pl-8 border-l-2 border-blue-500/30">
                        <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1 ring-4 ring-blue-500/10" />
                        <h4 className="text-base sm:text-lg font-semibold text-white mb-1">
                          Full Stack Engineer
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
                          <span className="text-blue-400 text-sm font-medium">
                            EISMEA
                          </span>
                          <span className="text-gray-600">|</span>
                          <span className="flex items-center text-gray-500 text-sm">
                            <FiCalendar className="mr-1 w-3.5 h-3.5" />
                            Jan 2025 - Jul 2025
                          </span>
                          <span className="text-gray-600">|</span>
                          <span className="flex items-center text-gray-500 text-sm">
                            <FiMapPin className="mr-1 w-3.5 h-3.5" />
                            Hungary
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                          Built{" "}
                          <span className="text-cyan-400/80">horizoneurope.io</span>,
                          an AI-powered EU funding guidance platform.
                          Engineered smart context management engine processing
                          500+ funding opportunities with NLP-based
                          categorization. Built document processing system for
                          automated parsing of EU funding calls and application
                          templates.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* ---- Stats Bar ---- */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mt-10 sm:mt-14"
        >
          <div
            className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-8 sm:p-12"
            style={{
              boxShadow:
                "0 0 60px rgba(59,130,246,0.04), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            <div className="flex flex-wrap justify-center items-center gap-y-10">
              {stats.map((stat, i) => (
                <div
                  key={stat.label}
                  className={`flex-1 min-w-[140px] ${
                    i < stats.length - 1
                      ? "border-r border-white/10 max-sm:border-r-0"
                      : ""
                  }`}
                >
                  <AnimatedCounter
                    target={stat.target}
                    suffix={stat.suffix}
                    label={stat.label}
                    color={stat.color}
                  />
                </div>
              ))}

              {/* GPA -- static decimal, not animated */}
              <div className="flex-1 min-w-[140px]">
                <div className="text-center">
                  <div
                    className="text-4xl sm:text-5xl font-bold text-white mb-2"
                    style={{ textShadow: "0 0 30px rgba(245,158,11,0.25)" }}
                  >
                    8.7
                    <span className="text-2xl sm:text-3xl ml-1" style={{ color: "#f59e0b" }}>
                      /10
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">GPA</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom gradient fade to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-950 to-transparent pointer-events-none" />
    </section>
  );
}
