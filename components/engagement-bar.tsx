"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { FiMessageCircle } from "react-icons/fi";

interface EngagementBarProps {
  slug: string;
  onCommentClick?: () => void;
  compact?: boolean;
}

export default function EngagementBar({ slug, onCommentClick, compact }: EngagementBarProps) {
  const { data: session } = useSession();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/likes?postSlug=${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        setLikeCount(data.count);
        setLiked(data.liked);
      })
      .catch(() => {});

    fetch(`/api/engagement?slugs=${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        if (data[slug]) setCommentCount(data[slug].comments);
      })
      .catch(() => {});

    return () => controller.abort();
  }, [slug]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session) { signIn("google"); return; }
    if (loading) return;
    setLoading(true);
    setLiked(prev => !prev);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postSlug: slug }),
      });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikeCount(data.count);
      } else {
        setLiked(prev => !prev);
        setLikeCount(prev => liked ? prev + 1 : prev - 1);
      }
    } catch {
      setLiked(prev => !prev);
      setLikeCount(prev => liked ? prev + 1 : prev - 1);
    } finally {
      setLoading(false);
    }
  };

  const handleComment = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onCommentClick?.();
  };

  return (
    <div className={`flex items-center ${compact ? "gap-3" : "gap-4"}`}>
      <button
        onClick={handleLike}
        disabled={loading}
        aria-pressed={liked}
        aria-label={`Like this post (${likeCount} ${likeCount === 1 ? "like" : "likes"})`}
        className={`relative after:absolute after:content-[''] after:-inset-y-[15px] after:-inset-x-[5px] inline-flex items-center gap-1.5 transition-all ${
          compact ? "text-xs" : "text-sm"
        } ${
          liked
            ? "text-red-400"
            : "text-gray-400 hover:text-red-400"
        }`}
      >
        <svg
          aria-hidden="true"
          focusable="false"
          className={compact ? "w-4 h-4" : "w-5 h-5"}
          fill={liked ? "currentColor" : "none"}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={liked ? 0 : 2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        {likeCount > 0 && <span aria-hidden="true">{likeCount}</span>}
      </button>

      <button
        onClick={handleComment}
        aria-label={`View comments (${commentCount})`}
        className={`relative after:absolute after:content-[''] after:-inset-y-[15px] after:-inset-x-[5px] inline-flex items-center gap-1.5 text-gray-400 hover:text-blue-400 transition-all ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        <FiMessageCircle aria-hidden="true" className={compact ? "w-4 h-4" : "w-5 h-5"} />
        {commentCount > 0 && <span aria-hidden="true">{commentCount}</span>}
      </button>
    </div>
  );
}
