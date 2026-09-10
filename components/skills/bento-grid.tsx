"use client";

import {
  FiServer,
  FiLayout,
  FiDatabase,
  FiCloud,
  FiCpu,
} from "react-icons/fi";
import {
  SiOracle,
  SiHtml5,
  SiMysql,
  SiJavascript,
  SiCss3,
  SiSpring,
  SiGit,
} from "react-icons/si";

import SkillHeroCard from "./skill-hero-card";
import SkillCompactCard from "./skill-compact-card";
import SkillCategoryCard from "./skill-category-card";

// ---- Data ----

const heroSkills = [
  {
    name: "Java",
    level: 95,
    color: "#3b82f6",
    icon: <SiOracle className="w-5 h-5" />,
    tagline: "Primary Language",
  },
  {
    name: "HTML5",
    level: 95,
    color: "#a855f7",
    icon: <SiHtml5 className="w-5 h-5" />,
    tagline: "Markup Expert",
  },
  {
    name: "MySQL",
    level: 92,
    color: "#f59e0b",
    icon: <SiMysql className="w-5 h-5" />,
    tagline: "Database Specialist",
  },
];

const compactSkills = [
  {
    name: "JavaScript",
    level: 90,
    color: "#3b82f6",
    icon: <SiJavascript className="w-4 h-4" />,
  },
  {
    name: "CSS3",
    level: 90,
    color: "#a855f7",
    icon: <SiCss3 className="w-4 h-4" />,
  },
  {
    name: "Spring Boot",
    level: 90,
    color: "#10b981",
    icon: <SiSpring className="w-4 h-4" />,
  },
  {
    name: "Git",
    level: 90,
    color: "#6366f1",
    icon: <SiGit className="w-4 h-4" />,
  },
];

const categoryGroups = [
  {
    name: "Backend",
    color: "#10b981",
    icon: <FiServer className="w-5 h-5" />,
    skills: [
      { name: "Node.js", level: 85 },
      { name: "Express.js", level: 80 },
      { name: ".NET Core", level: 75 },
      { name: "ASP.NET", level: 70 },
      { name: "Laravel", level: 65 },
    ],
  },
  {
    name: "Frontend",
    color: "#a855f7",
    icon: <FiLayout className="w-5 h-5" />,
    skills: [
      { name: "React.js", level: 88 },
      { name: "Next.js", level: 85 },
      { name: "Vue.js", level: 75 },
      { name: "React Native", level: 80 },
      { name: "Tailwind CSS", level: 85 },
    ],
  },
  {
    name: "Databases",
    color: "#f59e0b",
    icon: <FiDatabase className="w-5 h-5" />,
    skills: [
      { name: "PostgreSQL", level: 88 },
      { name: "MongoDB", level: 85 },
      { name: "Redis", level: 80 },
      { name: "Firebase", level: 75 },
    ],
  },
  {
    name: "Cloud & DevOps",
    color: "#6366f1",
    icon: <FiCloud className="w-5 h-5" />,
    skills: [
      { name: "AWS", level: 80 },
      { name: "Docker", level: 85 },
      { name: "Kubernetes", level: 75 },
      { name: "GitHub Actions", level: 80 },
    ],
  },
  {
    name: "AI/ML",
    color: "#f43f5e",
    icon: <FiCpu className="w-5 h-5" />,
    skills: [
      { name: "OpenAI GPT", level: 75 },
      { name: "Mistral AI", level: 70 },
      { name: "DeepSeek R1", level: 70 },
      { name: "TensorFlow", level: 65 },
      { name: "NLP Models", level: 70 },
    ],
  },
];

// ---- Component ----

export default function BentoGrid() {
  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: "repeat(12, 1fr)",
      }}
    >
      {/* ---- Row 1: Hero cards (3) + Compact cards (4) ---- */}

      {/* Hero cards: col-span-4 on xl, col-span-2 on md, col-span-2 on mobile (of 12) */}
      {heroSkills.map((skill) => (
        <div
          key={skill.name}
          className="col-span-12 sm:col-span-6 md:col-span-4 row-span-2"
        >
          <SkillHeroCard
            name={skill.name}
            level={skill.level}
            color={skill.color}
            icon={skill.icon}
            tagline={skill.tagline}
          />
        </div>
      ))}

      {/* Compact cards: col-span-3 on xl, col-span-3 on md, col-span-6 on mobile */}
      {compactSkills.map((skill) => (
        <div
          key={skill.name}
          className="col-span-12 sm:col-span-6 lg:col-span-3"
        >
          <SkillCompactCard
            name={skill.name}
            level={skill.level}
            color={skill.color}
            icon={skill.icon}
          />
        </div>
      ))}

      {/* ---- Row 2: Category cards ---- */}

      {/* Backend: col-span-6 on xl */}
      <div className="col-span-12 md:col-span-6 xl:col-span-6">
        <SkillCategoryCard
          name={categoryGroups[0].name}
          color={categoryGroups[0].color}
          icon={categoryGroups[0].icon}
          skills={categoryGroups[0].skills}
        />
      </div>

      {/* Frontend: col-span-6 on xl */}
      <div className="col-span-12 md:col-span-6 xl:col-span-6">
        <SkillCategoryCard
          name={categoryGroups[1].name}
          color={categoryGroups[1].color}
          icon={categoryGroups[1].icon}
          skills={categoryGroups[1].skills}
        />
      </div>

      {/* Databases: col-span-4 on xl */}
      <div className="col-span-12 md:col-span-6 xl:col-span-4">
        <SkillCategoryCard
          name={categoryGroups[2].name}
          color={categoryGroups[2].color}
          icon={categoryGroups[2].icon}
          skills={categoryGroups[2].skills}
        />
      </div>

      {/* Cloud & DevOps: col-span-4 on xl */}
      <div className="col-span-12 md:col-span-6 xl:col-span-4">
        <SkillCategoryCard
          name={categoryGroups[3].name}
          color={categoryGroups[3].color}
          icon={categoryGroups[3].icon}
          skills={categoryGroups[3].skills}
        />
      </div>

      {/* AI/ML: col-span-4 on xl */}
      <div className="col-span-12 md:col-span-6 xl:col-span-4">
        <SkillCategoryCard
          name={categoryGroups[4].name}
          color={categoryGroups[4].color}
          icon={categoryGroups[4].icon}
          skills={categoryGroups[4].skills}
        />
      </div>
    </div>
  );
}
