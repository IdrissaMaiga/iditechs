"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import DotIndicator from "./dot-indicator";

interface SkillEntry {
  name: string;
  level: number;
}

interface SkillCategoryCardProps {
  name: string;
  color: string;
  icon: ReactNode;
  skills: SkillEntry[];
}

export default function SkillCategoryCard({
  name,
  color,
  icon,
  skills,
}: SkillCategoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      viewport={{ once: true, margin: "-60px" }}
      className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md overflow-hidden transition-[border-color,box-shadow] duration-500 hover:border-white/[0.16] h-full"
      style={{ boxShadow: "none" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 30px ${color}12`;
        (e.currentTarget as HTMLDivElement).style.borderColor = `${color}30`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        (e.currentTarget as HTMLDivElement).style.borderColor = "";
      }}
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-30 group-hover:opacity-60 transition-opacity duration-500"
        style={{ background: color }}
      />

      <div className="p-5">
        {/* Header: icon + category name */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl"
            style={{
              background: `${color}18`,
              color: color,
            }}
          >
            {icon}
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">
            {name}
          </h3>
        </div>

        {/* Skill list */}
        <div className="space-y-3">
          {skills.map((skill) => (
            <div
              key={skill.name}
              className="flex items-center justify-between"
            >
              <span className="text-sm text-gray-300">{skill.name}</span>
              <DotIndicator level={skill.level} color={color} size={6} />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
