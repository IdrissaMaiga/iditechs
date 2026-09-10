"use client";

import ScrollOrchestrator from "@/components/scroll-orchestrator";
import HeroSection from "@/components/hero-section";
import StorySection from "@/components/story-section";
import ProjectsSection from "@/components/projects-section";
import SkillsBentoSection from "@/components/skills/skills-bento-section";
import InsightsSection from "@/components/insights-section";
import ConnectSection from "@/components/connect-section";
import SectionTransition from "@/components/section-transition";
import RoomFrame from "@/components/room-frame";

export default function Home() {
  return (
    <ScrollOrchestrator>
      <main className="min-h-screen relative overflow-x-hidden bg-[#020510]">

        <RoomFrame accent="blue">
          <HeroSection />
        </RoomFrame>

        <SectionTransition variant="double-door" />

        <RoomFrame accent="indigo">
          <StorySection />
        </RoomFrame>

        <SectionTransition variant="single-door" />

        <RoomFrame accent="purple">
          <ProjectsSection />
        </RoomFrame>

        <SectionTransition variant="double-door" />

        <RoomFrame accent="cyan">
          <SkillsBentoSection />
        </RoomFrame>

        <SectionTransition variant="slide-up" />

        <RoomFrame accent="indigo">
          <InsightsSection />
        </RoomFrame>

        <SectionTransition variant="iris" />

        <RoomFrame accent="amber">
          <ConnectSection />
        </RoomFrame>
      </main>
    </ScrollOrchestrator>
  );
}
