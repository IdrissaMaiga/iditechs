"use client";

import { useState } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";

interface FloatingCodeBlockProps {
  code: string;
  language: string;
  position?: "left" | "right";
  className?: string;
}

export default function FloatingCodeBlock({
  code,
  language,
  position = "right",
  className = "",
}: FloatingCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-100, 100], [8, -8]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-100, 100], [-8, 8]), { stiffness: 200, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: position === "right" ? 40 : -40 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true, margin: "-100px" }}
      className={`absolute z-[5] hidden lg:block ${
        position === "right" ? "right-4 xl:right-8" : "left-4 xl:left-8"
      } ${className}`}
      style={{ perspective: 800 }}
    >
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleCopy}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="w-[240px] rounded-lg overflow-hidden cursor-pointer group"
        whileHover={{ scale: 1.05 }}
      >
        <div
          className="transition-all duration-300 opacity-40 group-hover:opacity-90"
          style={{
            background: "rgba(10, 15, 30, 0.9)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          {/* Title bar */}
          <div
            className="flex items-center gap-1.5 px-3 py-2 transition-all duration-300 group-hover:bg-white/[0.03]"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="w-2 h-2 rounded-full bg-red-500/70 group-hover:bg-red-500" />
            <div className="w-2 h-2 rounded-full bg-yellow-500/70 group-hover:bg-yellow-500" />
            <div className="w-2 h-2 rounded-full bg-green-500/70 group-hover:bg-green-500" />
            <span className="ml-auto text-[9px] text-gray-500 group-hover:text-gray-300 font-mono transition-colors">
              {copied ? "Copied!" : language}
            </span>
          </div>
          {/* Code */}
          <pre className="p-3 m-0 text-[10px] leading-[1.6] font-mono text-gray-500 group-hover:text-gray-300 whitespace-pre overflow-hidden transition-colors duration-300">
            {code}
          </pre>
          {/* Hover hint */}
          <div className="h-0 overflow-hidden group-hover:h-6 transition-all duration-300 text-center">
            <span className="text-[9px] text-blue-400/70">
              {copied ? "Copied to clipboard" : "Click to copy"}
            </span>
          </div>
        </div>
        {/* Glow effect on hover */}
        <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ boxShadow: "0 0 40px rgba(96, 165, 250, 0.15), inset 0 0 40px rgba(96, 165, 250, 0.05)" }}
        />
      </motion.div>
    </motion.div>
  );
}
