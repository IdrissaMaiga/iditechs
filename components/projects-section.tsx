"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  FiExternalLink,
  FiGithub,
  FiCode,
  FiLayers,
  FiServer,
  FiInfo,
  FiX,
  FiChevronRight,
  FiCheckCircle,
  FiAlertTriangle,
} from "react-icons/fi";
import FloatingCodeBlock from "@/components/floating-code-block";
import ArtBg from "@/components/art-bg";
import EngagementBar from "@/components/engagement-bar";
import Comments from "@/components/comments";

/* ------------------------------------------------------------------ */
/*  Project data                                                       */
/* ------------------------------------------------------------------ */

interface Project {
  id: string;
  title: string;
  shortDesc: string;
  description: string;
  techStack: string[];
  features: string[];
  challenges: string[];
  image: string;
  additionalImages: string[];
  githubLink: string | null;
  liveLink: string | null;
}

const projects: Project[] = [
  {
    id: "horizoneurope",
    title: "HorizonEurope.io",
    shortDesc:
      "AI-powered EU funding guidance platform built for the European Innovation Council, serving 5,000+ monthly users.",
    description:
      "Built during my role as Full Stack Engineer at EISMEA (European Innovation Council). The platform helps researchers find the right EU funding opportunities using AI-powered matching, smart context management, and automated document processing. Features a resilient ingestion pipeline for EU grant data and an intelligent categorization engine processing 500+ funding opportunities.",
    techStack: [
      "Spring Boot",
      "React.js",
      "TypeScript",
      "PostgreSQL",
      "AWS",
      "Docker",
    ],
    features: [
      "Smart context management engine for intelligent interactions",
      "NLP-based categorization of 500+ funding opportunities",
      "Resilient ingestion pipeline that keeps EU grant data in sync as source portals change",
      "Cached funding lookups served in under 2ms server-side",
      "Document processing for EU funding calls",
      "Serving 5,000+ monthly users",
    ],
    challenges: [
      "Processing large EU datasets efficiently",
      "Keeping ingestion reliable as source portals change their markup and rate limits",
      "Getting cached lookups under 2ms server-side without stale funding data",
      "Handling complex multi-language funding documents",
    ],
    image: "/logos/HorizonEurope Home.png",
    additionalImages: ["/logos/HorizonEurope Login.png"],
    githubLink: null,
    liveLink: "https://horizoneurope.io",
  },
  {
    id: "neptun-api",
    title: "Neptun API",
    shortDesc:
      "The most complete Python wrapper for Hungary's Neptun university system: 1,100+ endpoints reverse-engineered across 75+ controllers.",
    description:
      "A comprehensive Python library that reverse-engineers the Angular web client of Hungary's Neptun university management system. Covers 25+ functional areas including messaging (18+ methods), calendar (29), courses (60+), exams (30+), grades (21), financials (50+), and more. Features automated JWT authentication with transparent token refresh, Playwright-based survey automation, and MCP server support for AI assistant integration.",
    techStack: ["Python", "Playwright", "MCP Protocol"],
    features: [
      "1,100+ API endpoints across 75+ controllers",
      "Automated JWT authentication with token refresh",
      "MCP server for Claude Desktop and Cursor integration",
      "Playwright-based automated survey filling",
      "Support for multiple Hungarian universities (Óbuda, BME, ELTE)",
      "Modular pip installation with optional extras",
    ],
    challenges: [
      "Reverse-engineering undocumented Angular API calls",
      "Handling complex JWT authentication flows",
      "Supporting multiple university instances",
      "Building reliable browser automation",
    ],
    image: "/logos/skills.png",
    additionalImages: [],
    githubLink: "https://github.com/IdrissaMaiga/neptun-api",
    liveLink: null,
  },
  {
    id: "gmail-ai",
    title: "Gmail AI Assistant",
    shortDesc:
      "AI-powered Gmail automation using dual LLMs for smart email categorization, priority detection, and response generation.",
    description:
      "An intelligent email management platform that leverages DeepSeek R1 and Mistral AI to automate Gmail workflows. Features secure Google OAuth 2.0 integration, AI-powered email categorization and prioritization, smart response generation, and batch processing for 1,000+ emails.",
    techStack: [
      "Next.js",
      "TypeScript",
      "Google OAuth",
      "DeepSeek R1",
      "Mistral AI",
      "Tailwind CSS",
    ],
    features: [
      "Secure Google OAuth 2.0 authentication",
      "Dual LLM support (DeepSeek R1 + Mistral AI)",
      "AI-powered email categorization and prioritization",
      "Smart response generation",
      "Batch processing for 1,000+ emails",
      "Dark mode UI with Radix components",
    ],
    challenges: [
      "Integrating multiple AI services efficiently",
      "Managing API rate limits and costs",
      "Ensuring data privacy with OAuth",
      "Processing large email volumes",
    ],
    image: "/logos/gmail.png",
    additionalImages: [],
    githubLink: "https://github.com/IdrissaMaiga/gmail-ai-agent",
    liveLink: null,
  },
  {
    id: "trading-bot",
    title: "Trading Bot",
    shortDesc:
      "Automated BUY-only grid trading bot for XAUUSD on MetaTrader 5 with real-time dashboard and tick-based backtester.",
    description:
      "A sophisticated grid-trading strategy bot for gold (XAUUSD) on MetaTrader 5. Uses pure grid mechanics, no indicators and no prediction. Features automatic pause/resume after stop-loss events, a real-time web dashboard for monitoring, a tick-based backtester using real MT5 data, and a comprehensive test suite with 32 passing tests.",
    techStack: ["Python", "MetaTrader 5", "WebSockets", "HTML/CSS"],
    features: [
      "Pure grid mechanics trading strategy",
      "Real-time web dashboard on localhost:8765",
      "Tick-based backtester with real MT5 data",
      "32 passing automated tests",
      "Automatic pause/resume after stop-loss",
      "CLI configuration and demo mode",
    ],
    challenges: [
      "Implementing reliable grid trading logic",
      "Real-time market data processing",
      "Building accurate backtesting system",
      "Risk management with shared stop-loss",
    ],
    image: "/logos/skills.png",
    additionalImages: [],
    githubLink: "https://github.com/IdrissaMaiga/trading-bot",
    liveLink: null,
  },
  {
    id: "filmu",
    title: "Filmu",
    shortDesc:
      "Full-stack VOD streaming platform with HLS video, live TV channels, subscription management, and admin dashboard.",
    description:
      "A comprehensive Netflix-like streaming platform built with the MERN stack. Users can browse movies and TV series, watch live channels via HLS streaming, manage subscriptions, and track watch history. Includes an admin dashboard for user and financial management, a referral program, and M3U playlist processing.",
    techStack: [
      "React",
      "Node.js",
      "Express",
      "MongoDB",
      "Prisma",
      "HLS.js",
    ],
    features: [
      "HLS adaptive video streaming (ArtPlayer, Video.js, HLS.js)",
      "Live TV channels with country-based filtering",
      "JWT authentication with role-based access",
      "Subscription system with payment tracking",
      "Admin dashboard with analytics",
      "React Native mobile app (companion repo)",
    ],
    challenges: [
      "Implementing efficient HLS streaming",
      "Building recommendation engine",
      "Cross-platform mobile + web support",
      "Subscription and payment management",
    ],
    image: "/logos/Filmu.png",
    additionalImages: [],
    githubLink: "https://github.com/IdrissaMaiga/filmu-server",
    liveLink: null,
  },
  {
    id: "signalapp",
    title: "SignalApp",
    shortDesc:
      "Real-time forex and binary trading signals mobile app with Firebase, role-based access, and push notifications.",
    description:
      "A mobile trading signals platform delivering real-time market insights via Firebase Realtime Database. Features Google Sign-In authentication, admin/sender signal management panel, role-based access control, and a responsive UI with haptic feedback. Built with React Native and Expo 52.",
    techStack: [
      "React Native",
      "Expo 52",
      "TypeScript",
      "Firebase",
      "Google Sign-In",
    ],
    features: [
      "Real-time signal delivery via Firebase",
      "Google Sign-In authentication",
      "Admin/sender signal management panel",
      "Role-based access control",
      "Push notifications for critical signals",
      "Cross-device responsive UI with haptic feedback",
    ],
    challenges: [
      "Ensuring minimal latency signal delivery",
      "Real-time data sync across devices",
      "Implementing reliable push notifications",
      "Balancing information density with UI clarity",
    ],
    image: "/logos/signal.png",
    additionalImages: [],
    githubLink: "https://github.com/IdrissaMaiga/signal-app",
    liveLink: null,
  },
];

/* ------------------------------------------------------------------ */
/*  Tab definitions                                                    */
/* ------------------------------------------------------------------ */

const detailTabs = [
  { id: "overview", label: "Overview", icon: <FiInfo className="w-4 h-4" /> },
  {
    id: "features",
    label: "Features",
    icon: <FiLayers className="w-4 h-4" />,
  },
  {
    id: "challenges",
    label: "Engineering challenges",
    icon: <FiAlertTriangle className="w-4 h-4" />,
  },
  {
    id: "tech",
    label: "Tech Stack",
    icon: <FiCode className="w-4 h-4" />,
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DetailedProjectsSection() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const modalRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedProject) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedProject]);

  const lastFocused = useRef<HTMLElement | null>(null);

  const openProject = useCallback((project: Project) => {
    lastFocused.current = document.activeElement as HTMLElement | null;
    setActiveTab("overview");
    setSelectedProject(project);
  }, []);

  const closeProject = useCallback(() => {
    setSelectedProject(null);
  }, []);

  // Move focus into the dialog on open and hand it back to the card on close,
  // so keyboard and screen-reader users are not left behind the modal.
  useEffect(() => {
    if (selectedProject) {
      modalRef.current?.focus();
    } else if (lastFocused.current) {
      lastFocused.current.focus();
      lastFocused.current = null;
    }
  }, [selectedProject]);

  // Listen for open-project events from the AI assistant
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const { projectId } = e.detail;
      const project = projects.find(p => p.id === projectId);
      if (project) {
        openProject(project);
      }
    };
    window.addEventListener('open-project', handler as EventListener);
    return () => window.removeEventListener('open-project', handler as EventListener);
  }, [openProject]);

  // Close on escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeProject();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [closeProject]);

  return (
    <section
      id="projects"
      className="py-12 sm:py-16 lg:py-20 relative bg-[#050a16] overflow-x-hidden"
    >
      <ArtBg variant="projects" />

      {/* ---- Floating code block ---- */}
      <FloatingCodeBlock
        code={`@GetMapping("/api/projects")\npublic List<Project> getAll() {\n    return projectService\n        .findAll()\n        .stream()\n        .filter(Project::isPublic)\n        .toList();\n}`}
        language="java"
        position="right"
        className="top-48"
      />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* ---- Section header ---- */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true, margin: "-80px" }}
          className="mb-12 sm:mb-16 text-center"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-blue-400 text-sm font-medium mb-6"
          >
            Portfolio
          </motion.span>
          <h2 className="text-[1.625rem] sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Featured{" "}
            <span className="text-white">
              Projects
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-gray-400 text-base sm:text-lg leading-relaxed">
            A selection of my most significant work showcasing full-stack
            development, AI integration, and system design
          </p>
        </motion.div>

        {/* ---- Project grid (6 cards) ---- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 project-grid" style={{ perspective: "1200px" }}>
          {projects.map((project, index) => (
            <div key={project.id} className="project-card-wrapper">
            <motion.div
              initial={{ opacity: 0, z: -100, rotateY: index % 2 === 0 ? -10 : 10 }}
              whileInView={{ opacity: 1, z: 0, rotateY: 0 }}
              transition={{ duration: 0.7, delay: index * 0.1 }}
              viewport={{ once: true, margin: "-80px" }}
              style={{ transformStyle: "preserve-3d" }}
              onClick={() => openProject(project)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openProject(project);
                }
              }}
              role="button"
              tabIndex={0}
              aria-haspopup="dialog"
              aria-label={`${project.title}: open project details`}
              className="group cursor-pointer bg-white/[0.03] backdrop-blur-md border border-white/[0.08] rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/[0.15] hover:shadow-[0_0_30px_rgba(59,130,246,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030712]"
            >
              {/* Card image */}
              <div className="relative h-48 overflow-hidden bg-[#0a0f1e]">
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/40 to-transparent" />
                {/* Hover glow overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-purple-500/0 group-hover:from-blue-500/[0.05] group-hover:to-purple-500/[0.05] transition-all duration-500" />
              </div>

              {/* Card body */}
              <div className="p-5">
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors duration-300">
                  {project.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 mb-4">
                  {project.shortDesc}
                </p>

                {/* Tech stack badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.techStack.slice(0, 3).map((tech) => (
                    <span
                      key={tech}
                      className="text-xs px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-gray-300"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.techStack.length > 3 && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-gray-500">
                      +{project.techStack.length - 3}
                    </span>
                  )}
                </div>

                {/* Links row */}
                <div className="flex items-center gap-3">
                  {project.githubLink && (
                    <a
                      href={project.githubLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      <FiGithub className="w-3.5 h-3.5" />
                      GitHub
                    </a>
                  )}
                  {project.liveLink && (
                    <a
                      href={project.liveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-cyan-400 transition-colors"
                    >
                      <FiExternalLink className="w-3.5 h-3.5" />
                      Live Demo
                    </a>
                  )}
                  <span className="ml-auto inline-flex items-center gap-1 text-xs text-gray-400 group-hover:text-blue-400 transition-colors">
                    View details
                    <FiChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>

                {/* Engagement: like + comment count */}
                <div className="pt-3 mt-3 border-t border-white/[0.06]">
                  <EngagementBar
                    slug={`project:${project.id}`}
                    compact
                    onCommentClick={() => openProject(project)}
                  />
                </div>
              </div>
            </motion.div>
            </div>
          ))}
        </div>
      </div>

      {/* ================================================================ */}
      {/*  DETAIL MODAL                                                     */}
      {/* ================================================================ */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-4 sm:pt-8 pb-4 sm:pb-8 px-3 sm:px-4 overflow-y-auto"
            onClick={closeProject}
          >
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Modal panel */}
            <motion.div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-label={`${selectedProject.title} project details`}
              tabIndex={-1}
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.97 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl lg:max-w-3xl bg-[#0a0f1e]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/10 z-10 my-auto focus:outline-none"
            >
              {/* Close button */}
              <button
                onClick={closeProject}
                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all"
                aria-label="Close"
              >
                <FiX className="w-5 h-5" />
              </button>

              {/* Hero image */}
              <div className="relative h-56 sm:h-72 bg-[#070c18] overflow-hidden">
                <Image
                  src={selectedProject.image}
                  alt={selectedProject.title}
                  fill
                  sizes="(min-width: 640px) 640px, 100vw"
                  className="object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e] via-[#0a0f1e]/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    {selectedProject.title}
                  </h3>
                  <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-xl">
                    {selectedProject.shortDesc}
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-white/[0.06] bg-white/[0.02]">
                <div className="flex overflow-x-auto scrollbar-hide">
                  {detailTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 whitespace-nowrap py-3.5 px-5 text-sm font-medium transition-all border-b-2 ${
                        activeTab === tab.id
                          ? "border-blue-400 text-blue-400"
                          : "border-transparent text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab content */}
              <div className="p-6 sm:p-8 min-h-[260px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* -- Overview -- */}
                    {activeTab === "overview" && (
                      <div>
                        <p className="text-gray-300 leading-relaxed text-[15px]">
                          {selectedProject.description}
                        </p>
                      </div>
                    )}

                    {/* -- Features -- */}
                    {activeTab === "features" && (
                      <ul className="space-y-3">
                        {selectedProject.features.map((feature, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                              duration: 0.3,
                              delay: i * 0.06,
                            }}
                            className="flex items-start gap-3"
                          >
                            <FiCheckCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-300 text-[15px]">
                              {feature}
                            </span>
                          </motion.li>
                        ))}
                      </ul>
                    )}

                    {/* Challenges */}
                    {activeTab === "challenges" && (
                      <ul className="space-y-3">
                        {selectedProject.challenges.map((challenge, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                              duration: 0.3,
                              delay: i * 0.06,
                            }}
                            className="flex items-start gap-3"
                          >
                            <FiAlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-300 text-[15px]">
                              {challenge}
                            </span>
                          </motion.li>
                        ))}
                      </ul>
                    )}

                    {/* -- Tech Stack -- */}
                    {activeTab === "tech" && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {selectedProject.techStack.map((tech, i) => (
                          <motion.div
                            key={tech}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                              duration: 0.3,
                              delay: i * 0.06,
                            }}
                            className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-blue-500/20 hover:bg-blue-500/[0.04] transition-all duration-300"
                          >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                              <FiServer className="w-4 h-4 text-blue-400" />
                            </div>
                            <span className="text-gray-300 text-sm font-medium">
                              {tech}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer with links */}
              {(selectedProject.githubLink || selectedProject.liveLink) && (
                <div className="px-6 sm:px-8 pb-4 flex flex-wrap gap-3">
                  {selectedProject.githubLink && (
                    <a
                      href={selectedProject.githubLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-gray-300 text-sm font-medium hover:border-white/20 hover:bg-white/[0.08] hover:text-white transition-all duration-300"
                    >
                      <FiGithub className="w-4 h-4" />
                      View on GitHub
                    </a>
                  )}
                  {selectedProject.liveLink && (
                    <a
                      href={selectedProject.liveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/20 text-blue-300 text-sm font-medium hover:from-blue-500/30 hover:to-cyan-500/30 hover:border-blue-400/30 hover:text-blue-200 transition-all duration-300"
                    >
                      <FiExternalLink className="w-4 h-4" />
                      Live Demo
                    </a>
                  )}
                </div>
              )}

              {/* Engagement + Comments */}
              <div className="px-6 sm:px-8 pb-6 sm:pb-8">
                <div className="border-t border-white/[0.06] pt-4">
                  <EngagementBar slug={`project:${selectedProject.id}`} />
                </div>
                <Comments postSlug={`project:${selectedProject.id}`} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
