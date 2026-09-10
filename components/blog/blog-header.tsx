import Image from "next/image";
import { FiCalendar, FiClock } from "react-icons/fi";
import type { BlogPost } from "@/lib/blog";

interface BlogHeaderProps {
  post: BlogPost;
}

export default function BlogHeader({ post }: BlogHeaderProps) {
  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="mb-10">
      {/* Title */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white font-display leading-tight mb-6">
        {post.title}
      </h1>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Author */}
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 overflow-hidden rounded-full border-2 border-white/20">
            <Image
              src="/logos/id_.jpg"
              alt="Idrissa Maiga"
              fill
              sizes="36px"
              className="object-cover object-top"
            />
          </div>
          <span className="text-sm font-medium text-gray-300">Idrissa Maiga</span>
        </div>

        {/* Divider */}
        <span className="hidden sm:block w-px h-5 bg-white/10" />

        {/* Date */}
        <span className="flex items-center gap-1.5 text-sm text-gray-400">
          <FiCalendar className="w-4 h-4" />
          {formattedDate}
        </span>

        {/* Reading time */}
        <span className="flex items-center gap-1.5 text-sm text-gray-400">
          <FiClock className="w-4 h-4" />
          {post.readingTime} min read
        </span>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 font-medium"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Separator */}
      <div className="mt-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </header>
  );
}
