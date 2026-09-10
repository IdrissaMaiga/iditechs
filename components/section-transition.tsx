"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

interface Props {
  variant?: "double-door" | "single-door" | "slide-up" | "iris";
}

export default function SectionTransition({ variant = "double-door" }: Props) {
  switch (variant) {
    case "double-door": return <DoubleDoor />;
    case "single-door": return <SingleDoor />;
    case "slide-up": return <SlideUp />;
    case "iris": return <Iris />;
  }
}

function useScrollSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  return { ref, scrollYProgress };
}

function DoorFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Outer frame */}
      <div className="absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-[#1a1f35] to-[#12162a] border-b border-white/[0.08]" />
      <div className="absolute inset-x-0 bottom-0 h-3 bg-gradient-to-t from-[#1a1f35] to-[#12162a] border-t border-white/[0.08]" />
      <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-[#1a1f35] to-[#12162a] border-r border-white/[0.08]" />
      <div className="absolute inset-y-0 right-0 w-3 bg-gradient-to-l from-[#1a1f35] to-[#12162a] border-l border-white/[0.08]" />
      {/* Corner bolts */}
      <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-white/[0.12]" />
      <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white/[0.12]" />
      <div className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-white/[0.12]" />
      <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-white/[0.12]" />
      {children}
    </div>
  );
}

function DoorPanel({ className = "" }: { className?: string }) {
  return (
    <div className={`h-full relative ${className}`}>
      {/* Panel surface */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#151b30] via-[#111627] to-[#0d1220]" />
      {/* Panel inner frame */}
      <div className="absolute inset-[12%] border border-white/[0.06] rounded-sm">
        <div className="absolute inset-[8%] border border-white/[0.04] rounded-sm" />
      </div>
      {/* Surface texture */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.03)_0%,_transparent_70%)]" />
    </div>
  );
}

function DoubleDoor() {
  const { ref, scrollYProgress } = useScrollSection();
  const leftX = useTransform(scrollYProgress, [0.15, 0.55], ["0%", "-110%"]);
  const rightX = useTransform(scrollYProgress, [0.15, 0.55], ["0%", "110%"]);
  const containerOpacity = useTransform(scrollYProgress, [0.5, 0.65], [1, 0]);
  const gapGlow = useTransform(scrollYProgress, [0.15, 0.35, 0.55], [0, 1, 0.3]);
  const lightSpill = useTransform(scrollYProgress, [0.2, 0.45], [0, 0.6]);

  return (
    <div ref={ref} className="relative w-full h-[12vh] pointer-events-none z-30 overflow-hidden">
      {/* `absolute` only: this used to also carry `sticky`, which wins in Tailwind's output
          and collapses the box to 0px because every child is absolutely positioned. */}
      <motion.div style={{ opacity: containerOpacity }} className="absolute inset-0">
        <DoorFrame>
          {/* Left panel */}
          <motion.div style={{ x: leftX }} className="absolute inset-y-[3px] left-[3px] right-1/2 origin-left">
            <DoorPanel />
            {/* Right edge (hinge side) */}
            <div className="absolute right-0 top-[10%] bottom-[10%] w-[2px] bg-gradient-to-b from-transparent via-white/[0.1] to-transparent" />
            {/* Handle */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
              <div className="w-2 h-10 rounded-full bg-gradient-to-b from-white/[0.15] to-white/[0.05] border border-white/[0.1]" />
              <div className="w-1 h-1 rounded-full bg-white/[0.2]" />
            </div>
          </motion.div>

          {/* Right panel */}
          <motion.div style={{ x: rightX }} className="absolute inset-y-[3px] right-[3px] left-1/2 origin-right">
            <DoorPanel />
            {/* Left edge (hinge side) */}
            <div className="absolute left-0 top-[10%] bottom-[10%] w-[2px] bg-gradient-to-b from-transparent via-white/[0.1] to-transparent" />
            {/* Handle */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
              <div className="w-2 h-10 rounded-full bg-gradient-to-b from-white/[0.15] to-white/[0.05] border border-white/[0.1]" />
              <div className="w-1 h-1 rounded-full bg-white/[0.2]" />
            </div>
          </motion.div>

          {/* Center gap glow */}
          <motion.div
            style={{ opacity: gapGlow }}
            className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 z-10"
          >
            <div className="w-full h-full bg-blue-400/60 blur-[3px]" />
            <div className="absolute inset-0 w-px mx-auto bg-blue-300/80" />
          </motion.div>
        </DoorFrame>

        {/* Light spill behind doors */}
        <motion.div
          style={{ opacity: lightSpill }}
          className="absolute inset-0 bg-gradient-to-b from-indigo-500/[0.08] via-blue-500/[0.05] to-transparent -z-10"
        />
      </motion.div>
    </div>
  );
}

function SingleDoor() {
  const { ref, scrollYProgress } = useScrollSection();
  // Positive rotation swings the free edge away from the viewer, so in perspective the
  // panel shrinks into the frame instead of growing past it; 90deg is edge-on.
  const rotateY = useTransform(scrollYProgress, [0.15, 0.55], [0, 90]);
  const containerOpacity = useTransform(scrollYProgress, [0.5, 0.65], [1, 0]);
  const glow = useTransform(scrollYProgress, [0.2, 0.45], [0, 0.8]);

  return (
    <div ref={ref} className="relative w-full h-[10vh] pointer-events-none z-30 overflow-hidden">
      <motion.div style={{ opacity: containerOpacity }} className="absolute inset-0">
        <DoorFrame>
          <motion.div
            style={{ rotateY, transformOrigin: "left center", transformPerspective: 1500, backfaceVisibility: "hidden" }}
            className="absolute inset-[3px]"
          >
            <DoorPanel />
            {/* Hinges on left side */}
            <div className="absolute left-1 top-[15%] w-2 h-6 rounded-sm bg-gradient-to-r from-white/[0.1] to-white/[0.05] border border-white/[0.08]" />
            <div className="absolute left-1 top-[45%] w-2 h-6 rounded-sm bg-gradient-to-r from-white/[0.1] to-white/[0.05] border border-white/[0.08]" />
            <div className="absolute left-1 bottom-[15%] w-2 h-6 rounded-sm bg-gradient-to-r from-white/[0.1] to-white/[0.05] border border-white/[0.08]" />
            {/* Handle on right */}
            <div className="absolute right-[8%] top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
              <div className="w-2.5 h-12 rounded-full bg-gradient-to-b from-white/[0.18] to-white/[0.06] border border-white/[0.12] shadow-[0_0_8px_rgba(255,255,255,0.05)]" />
              <div className="w-3 h-3 rounded-full border border-white/[0.1] bg-white/[0.05]" />
            </div>
          </motion.div>
        </DoorFrame>

        {/* Light reveal behind */}
        <motion.div
          style={{ opacity: glow }}
          className="absolute inset-0 bg-gradient-to-r from-cyan-500/[0.06] via-blue-400/[0.04] to-transparent -z-10"
        />
      </motion.div>
    </div>
  );
}

function SlideUp() {
  const { ref, scrollYProgress } = useScrollSection();
  const y = useTransform(scrollYProgress, [0.15, 0.55], ["0%", "-105%"]);
  const containerOpacity = useTransform(scrollYProgress, [0.5, 0.65], [1, 0]);
  const glow = useTransform(scrollYProgress, [0.2, 0.45], [0, 0.7]);

  return (
    <div ref={ref} className="relative w-full h-[12vh] pointer-events-none z-30 overflow-hidden">
      <motion.div style={{ opacity: containerOpacity }} className="absolute inset-0">
        <DoorFrame>
          <motion.div style={{ y }} className="absolute inset-[3px]">
            <DoorPanel />
            {/* Bottom grip bar */}
            <div className="absolute bottom-3 left-[20%] right-[20%] h-1 rounded-full bg-white/[0.08] border border-white/[0.06]" />
            <div className="absolute bottom-6 left-[30%] right-[30%] h-0.5 rounded-full bg-white/[0.04]" />
            {/* Horizontal panel lines */}
            <div className="absolute left-[10%] right-[10%] top-[30%] h-px bg-white/[0.04]" />
            <div className="absolute left-[10%] right-[10%] top-[60%] h-px bg-white/[0.04]" />
          </motion.div>
        </DoorFrame>

        <motion.div
          style={{ opacity: glow }}
          className="absolute inset-0 bg-gradient-to-b from-purple-500/[0.06] via-violet-400/[0.04] to-transparent -z-10"
        />
      </motion.div>
    </div>
  );
}

function Iris() {
  const { ref, scrollYProgress } = useScrollSection();
  const clipRadius = useTransform(scrollYProgress, [0.15, 0.55], [0, 150]);
  const containerOpacity = useTransform(scrollYProgress, [0.5, 0.65], [1, 0]);
  const ringGlow = useTransform(scrollYProgress, [0.2, 0.4], [0, 1]);
  const ringScale = useTransform(scrollYProgress, [0.2, 0.55], [0.4, 1.2]);

  return (
    <div ref={ref} className="relative w-full h-[10vh] pointer-events-none z-30 overflow-hidden">
      <motion.div style={{ opacity: containerOpacity }} className="absolute inset-0">
        <DoorFrame>
          {/* Solid panel with circular cutout that grows */}
          <motion.div className="absolute inset-[3px]">
            <div className="absolute inset-0 bg-gradient-to-b from-[#151b30] via-[#111627] to-[#0d1220]" />
            {/* Mask: cover everything except the growing circle */}
            <motion.div
              style={{
                WebkitMaskImage: useTransform(clipRadius, (v: number) =>
                  `radial-gradient(circle at 50% 50%, transparent ${v}%, black ${v + 0.5}%)`
                ),
                maskImage: useTransform(clipRadius, (v: number) =>
                  `radial-gradient(circle at 50% 50%, transparent ${v}%, black ${v + 0.5}%)`
                ),
              }}
              className="absolute inset-0 bg-gradient-to-b from-[#151b30] via-[#111627] to-[#0d1220]"
            />
          </motion.div>

          {/* Expanding ring */}
          <motion.div
            style={{ opacity: ringGlow, scale: ringScale }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-16 h-16 rounded-full border-2 border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.2),inset_0_0_20px_rgba(6,182,212,0.1)]" />
          </motion.div>
        </DoorFrame>
      </motion.div>
    </div>
  );
}
