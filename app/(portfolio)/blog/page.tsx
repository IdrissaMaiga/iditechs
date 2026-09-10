import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";
import BlogCard from "@/components/blog/blog-card";
import SubscribeForm from "@/components/subscribe-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog | Idrissa Maiga",
  description:
    "Technical blog posts about full-stack development, reverse engineering, AI integration, and building real-world projects.",
  openGraph: {
    title: "Blog | Idrissa Maiga",
    description:
      "Technical blog posts about full-stack development, reverse engineering, AI integration, and building real-world projects.",
  },
};

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <main className="min-h-screen bg-[#030712] relative overflow-hidden">
      {/* Ambient glow blobs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/[0.08] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/[0.10] rounded-full blur-[120px] pointer-events-none" />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-16 sm:pb-24 relative z-10">
        {/* Section header */}
        <div className="mb-12 sm:mb-16">
          <div className="text-center">
            <span className="inline-block px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-blue-400 text-sm font-medium mb-6">
              Blog
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 font-display">
              Technical{" "}
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Writing
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-gray-400 text-base sm:text-lg leading-relaxed">
              Deep dives into the projects I build, the problems I solve, and the
              lessons I learn along the way.
            </p>
          </div>
          <div className="flex justify-end max-w-5xl mx-auto mt-6">
            <SubscribeForm variant="inline" />
          </div>
        </div>

        {/* Posts grid or empty state */}
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
            {posts.map((post, index) => (
              <BlogCard key={post.slug} post={post} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/[0.03] border border-white/[0.08] mb-6">
              <svg
                className="w-8 h-8 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2 font-display">
              Coming Soon
            </h3>
            <p className="text-gray-400 max-w-md mx-auto">
              I am working on some in-depth technical articles. Check back soon
              for posts about reverse engineering, AI, and full-stack development.
            </p>
          </div>
        )}

        {/* Subscribe */}
        <div className="max-w-md mx-auto mt-16">
          <SubscribeForm />
        </div>
      </div>
    </main>
  );
}
