"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import DotIndicator from "./dot-indicator";

interface SkillCompactCardProps {
  name: string;
  level: number;
  color: string;
  icon: ReactNode;
}

export default function SkillCompactCard({
  name,
  level,
  color,
  icon,
}: SkillCompactCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      viewport={{ once: true, margin: "-40px" }}
      whileHover={{ scale: 1.03 }}
      className="group relative rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md overflow-hidden transition-[border-color,box-shadow] duration-300 hover:border-white/[0.16] h-full"
      style={{ boxShadow: "none" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 24px ${color}15`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      <div className="flex items-center justify-between p-4">
        {/* Left: icon + name */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
            style={{
              background: `${color}18`,
              color: color,
            }}
          >
            {icon}
          </div>
          <span className="text-sm font-semibold text-white truncate">
            {name}
          </span>
        </div>

        {/* Right: dot indicator */}
        <DotIndicator level={level} color={color} size={7} />
      </div>
    </motion.div>
  );
}
