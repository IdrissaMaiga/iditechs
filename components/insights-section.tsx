"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  FiArrowRight,
  FiClock,
  FiCalendar,
  FiGithub,
  FiStar,
  FiExternalLink,
} from "react-icons/fi";
import FloatingCodeBlock from "@/components/floating-code-block";
import ArtBg from "@/components/art-bg";
import EngagementBar from "@/components/engagement-bar";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PostPreview {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  readingTime: number;
  image: string;
}

interface GitHubRepo {
  name: string;
  description: string | null;
  updatedAt: string;
  language: string | null;
  stars: number;
  url: string;
}

interface GitHubActivity {
  recentRepos: GitHubRepo[];
  publicRepos: number;
  followers: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const languageColors: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Java: "#b07219",
  "C#": "#178600",
  Go: "#00ADD8",
  Rust: "#dea584",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Kotlin: "#A97BFF",
  Swift: "#F05138",
  Ruby: "#701516",
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMonth = Math.floor(diffDay / 30);
  return `${diffMonth}mo ago`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function InsightsSection() {
  const [posts, setPosts] = useState<PostPreview[]>([]);
  const [activity, setActivity] = useState<GitHubActivity | null>(null);
  const [ghLoading, setGhLoading] = useState(true);
  const [blogError, setBlogError] = useState(false);
  const [ghError, setGhError] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 10000);

    fetch("/api/blog/recent", { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data) => setPosts(data.posts || []))
      .catch(() => setBlogError(true))
      .finally(() => clearTimeout(timeout));

    const ghCtrl = new AbortController();
    const ghTimeout = setTimeout(() => ghCtrl.abort(), 10000);

    fetch("/api/github/activity", { signal: ghCtrl.signal })
      .then((res) => res.json())
      .then((data) => { setActivity(data); setGhLoading(false); })
      .catch(() => { setGhError(true); setGhLoading(false); })
      .finally(() => clearTimeout(ghTimeout));

    return () => { ctrl.abort(); ghCtrl.abort(); };
  }, []);

  return (
    <section
      id="insights"
      className="py-12 sm:py-16 lg:py-20 relative bg-[#070c1a] overflow-x-hidden"
    >
      <ArtBg variant="insights" />

      {/* ---- Floating code block ---- */}
      <FloatingCodeBlock
        code={`async def publish(post):\n    await blog.save(post)\n    await linkedin.share(post)\n    await github.sync()\n    return {"status": "live"}`}
        language="python"
        position="right"
        className="top-40"
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* ---- Section Header ---- */}
        <div className="mb-12 sm:mb-16 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-4">
              Insights
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
              Latest{" "}
              <span className="text-white">
                Insights
              </span>
            </h2>
            <p className="mt-3 text-gray-400 max-w-lg">
              Technical deep-dives, project breakdowns, and lessons from building real-world systems.
            </p>
          </div>
          <Link
            href="/blog"
            className="group flex items-center text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
          >
            View all posts
            <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* ---- Content: Blog Cards + GitHub Widget ---- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Blog cards -- 2/3 width */}
          <motion.div
            initial={{ x: -60, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
            className="md:col-span-2"
          >
            {blogError && posts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm text-gray-500">Unable to load latest posts.</p>
              </div>
            ) : posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {posts.slice(0, 3).map((post) => (
                  <div key={post.slug}>
                    <Link href={`/blog/${post.slug}`} className="block h-full">
                      <div className="h-full rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/[0.08] overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
                        {/* Image */}
                        {post.image && (
                          <div className="relative h-44 overflow-hidden">
                            <Image
                              src={post.image}
                              alt={post.title}
                              fill
                              sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent" />
                          </div>
                        )}

                        {/* Content */}
                        <div className="p-5 sm:p-6">
                          {/* Meta */}
                          <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                            <span className="flex items-center gap-1">
                              <FiCalendar className="w-3 h-3" />
                              {new Date(post.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <FiClock className="w-3 h-3" />
                              {post.readingTime} min read
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors line-clamp-2">
                            {post.title}
                          </h3>

                          {/* Description */}
                          <p className="text-sm text-gray-400 line-clamp-3 mb-4">
                            {post.description}
                          </p>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          {/* Engagement */}
                          <div className="pt-3 border-t border-white/[0.06]">
                            <EngagementBar slug={post.slug} compact />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              /* Coming soon state */
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-6">
                  <FiCalendar className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Posts coming soon
                </h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  Technical articles and project deep-dives are on the way. Stay tuned.
                </p>
              </div>
            )}
          </motion.div>

          {/* GitHub Activity Widget -- 1/3 width */}
          <motion.div
            initial={{ x: 60, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.08] rounded-2xl overflow-hidden sticky top-24">
              {/* Header */}
              <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FiGithub className="w-5 h-5 text-gray-300" />
                  <h3 className="text-sm font-semibold text-white">
                    Currently Building
                  </h3>
                </div>
                {activity && (
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{activity.publicRepos} repos</span>
                    <span>{activity.followers} followers</span>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="p-4">
                {ghLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                  </div>
                ) : activity && activity.recentRepos.length > 0 ? (
                  <ul className="space-y-1">
                    {activity.recentRepos.map((repo) => (
                      <li key={repo.name}>
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors duration-200"
                        >
                          {/* Language dot */}
                          <span
                            className="mt-1.5 w-3 h-3 rounded-full flex-shrink-0 border border-white/10"
                            style={{
                              backgroundColor:
                                (repo.language && languageColors[repo.language]) ||
                                "#6b7280",
                            }}
                          />

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-200 group-hover:text-blue-300 transition-colors truncate">
                                {repo.name}
                              </span>
                              <FiExternalLink className="w-3 h-3 text-gray-600 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                            </div>
                            {repo.description && (
                              <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                                {repo.description}
                              </p>
                            )}
                          </div>

                          {/* Meta */}
                          <div className="flex items-center gap-3 text-xs text-gray-500 flex-shrink-0 mt-0.5">
                            {repo.stars > 0 && (
                              <span className="flex items-center gap-1">
                                <FiStar className="w-3 h-3" />
                                {repo.stars}
                              </span>
                            )}
                            <span className="whitespace-nowrap">
                              {relativeTime(repo.updatedAt)}
                            </span>
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-6">
                    {ghError ? "Unable to load GitHub activity." : "No recent activity."}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
