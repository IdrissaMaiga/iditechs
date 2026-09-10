"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import RingGauge from "./ring-gauge";

interface SkillHeroCardProps {
  name: string;
  level: number;
  color: string;
  icon: ReactNode;
  tagline: string;
}

export default function SkillHeroCard({
  name,
  level,
  color,
  icon,
  tagline,
}: SkillHeroCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      viewport={{ once: true, margin: "-60px" }}
      whileHover={{ scale: 1.02 }}
      className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md overflow-hidden transition-[border-color,box-shadow] duration-500 hover:border-white/[0.18] h-full"
      style={{
        boxShadow: "none",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 40px ${color}18, 0 0 80px ${color}08`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-40 group-hover:opacity-70 transition-opacity duration-500"
        style={{ background: color }}
      />

      <div className="flex flex-col items-center justify-center p-6 pt-8">
        {/* Ring gauge */}
        <div className="mb-4">
          <RingGauge level={level} color={color} size={120} strokeWidth={8} />
        </div>

        {/* Icon */}
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl mb-3"
          style={{
            background: `${color}18`,
            color: color,
          }}
        >
          {icon}
        </div>

        {/* Name */}
        <h3 className="text-lg font-bold text-white tracking-tight mb-1">
          {name}
        </h3>

        {/* Tagline */}
        <p className="text-sm text-gray-500 text-center">{tagline}</p>
      </div>
    </motion.div>
  );
}
