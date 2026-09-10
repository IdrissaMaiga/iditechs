"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { FiClock, FiCalendar } from "react-icons/fi";
import type { BlogPost } from "@/lib/blog";
import EngagementBar from "@/components/engagement-bar";
import { useRouter } from "next/navigation";

interface BlogCardProps {
  post: BlogPost;
  index: number;
}

export default function BlogCard({ post, index }: BlogCardProps) {
  const router = useRouter();
  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        viewport={{ once: true, margin: "-60px" }}
      >
        <Link href={`/blog/${post.slug}`} className="block group">
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.08] rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/[0.15] hover:shadow-[0_0_30px_rgba(59,130,246,0.08)]">
            {/* Image */}
            {post.image && (
              <div className="relative h-48 overflow-hidden bg-[#0a0f1e]">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  sizes="(min-width: 768px) 496px, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-purple-500/0 group-hover:from-blue-500/[0.05] group-hover:to-purple-500/[0.05] transition-all duration-500" />
              </div>
            )}

            {/* Body */}
            <div className="p-5">
              {/* Title */}
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors duration-300 font-display line-clamp-2">
                {post.title}
              </h3>

              {/* Meta: date + reading time */}
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                <span className="flex items-center gap-1.5">
                  <FiCalendar className="w-3.5 h-3.5" />
                  {formattedDate}
                </span>
                <span className="flex items-center gap-1.5">
                  <FiClock className="w-3.5 h-3.5" />
                  {post.readingTime} min read
                </span>
              </div>

              {/* Description */}
              <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 mb-4">
                {post.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Engagement: like + comment count */}
              <div className="pt-3 border-t border-white/[0.06]">
                <EngagementBar
                  slug={post.slug}
                  compact
                  onCommentClick={() => router.push(`/blog/${post.slug}#comments-section`)}
                />
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    </div>
  );
}
