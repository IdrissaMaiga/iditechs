"use client";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useMemo, useRef } from "react";

interface Props {
  variant: "hero" | "story" | "projects" | "skills" | "insights" | "connect";
}

function Starfield({ count = 60, maxSize = 2.5 }: { count?: number; maxSize?: number }) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: `${(37 * i + 13) % 100}%`,
        y: `${(53 * i + 7) % 100}%`,
        size: 0.5 + ((17 * i) % 100) / 100 * maxSize,
        delay: (0.7 * i) % 4,
        dur: 2 + (i % 3),
      })),
    [count, maxSize]
  );

  return (
    <>
      {stars.map((s, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: s.x,
            top: s.y,
            width: s.size,
            height: s.size,
            backgroundColor: "#dce6ff",
          }}
          initial={{ opacity: 0.3, scale: 0.8 }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.3, 0.8] }}
          transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </>
  );
}

function Nebulae({ count = 4 }: { count?: number }) {
  const nebulae = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: `${(29 * i + 5) % 90}%`,
        top: `${10 + (23 * i) % 60}%`,
        w: 280 + (73 * i) % 350,
        h: 60 + (31 * i) % 100,
        dur: 28 + (11 * i) % 20,
        delay: 4 * i,
      })),
    [count]
  );

  return (
    <>
      {nebulae.map((n, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: n.left,
            top: n.top,
            width: n.w,
            height: n.h,
            background: "radial-gradient(ellipse, rgba(80,130,255,0.12), transparent 70%)",
            filter: "blur(25px)",
          }}
          initial={{ x: -30, opacity: 0.5 }}
          animate={{ x: [-30, 30, -30], opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: n.dur, delay: n.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </>
  );
}

function LightRays({ count = 3, angle = -20 }: { count?: number; angle?: number }) {
  const rays = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: `${15 + (31 * i) % 70}%`,
        dur: 6 + (3 * i) % 5,
        delay: 2 * i,
        w: 80 + (47 * i) % 140,
      })),
    [count]
  );

  return (
    <>
      {rays.map((r, i) => (
        <motion.div
          key={i}
          className="absolute top-0 pointer-events-none"
          style={{
            left: r.left,
            width: r.w,
            height: "120%",
            background: "linear-gradient(180deg, rgba(80,140,255,0.1), transparent 80%)",
            transform: `rotate(${angle}deg)`,
            transformOrigin: "top center",
          }}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: r.dur, delay: r.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </>
  );
}

function GlowOrbs({ count = 12 }: { count?: number }) {
  const colors = [
    "rgba(80,140,255,0.2)",
    "rgba(60,120,220,0.18)",
    "rgba(100,160,255,0.15)",
    "rgba(70,130,255,0.12)",
  ];
  const orbs = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: `${(41 * i + 11) % 100}%`,
        y: `${(59 * i + 3) % 100}%`,
        size: 15 + (23 * i) % 70,
        color: colors[i % colors.length],
        dur: 5 + (7 * i) % 8,
        delay: (1.3 * i) % 6,
      })),
    [count]
  );

  return (
    <>
      {orbs.map((o, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: o.x,
            top: o.y,
            width: o.size,
            height: o.size,
            background: o.color,
            filter: `blur(${o.size / 3}px)`,
          }}
          initial={{ opacity: 0.15, y: -10, scale: 0.9 }}
          animate={{ opacity: [0.15, 0.5, 0.15], y: [-10, 10, -10], scale: [0.9, 1.15, 0.9] }}
          transition={{ duration: o.dur, delay: o.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </>
  );
}

function ShootingStar({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      className="absolute w-[2px] h-[2px] bg-white rounded-full pointer-events-none"
      style={{
        top: "10%",
        left: "80%",
        boxShadow: "0 0 6px 2px rgba(255,255,255,0.7), -50px 0 25px 2px rgba(200,220,255,0.3)",
      }}
      initial={{ x: 0, y: 0, opacity: 0 }}
      animate={{ x: [0, -350], y: [0, 230], opacity: [0, 1, 1, 0] }}
      transition={{ duration: 1.5, delay, repeat: Infinity, repeatDelay: 8, ease: "easeIn" }}
    />
  );
}

function MountainSilhouette({ height = "25%" }: { height?: string }) {
  return (
    <svg
      className="absolute bottom-0 left-0 w-full pointer-events-none"
      style={{ height }}
      viewBox="0 0 1440 320"
      preserveAspectRatio="none"
    >
      <path
        d="M0,320 L0,220 Q120,120 240,180 Q360,240 480,140 Q540,100 600,130 Q720,200 840,110 Q960,40 1080,120 Q1200,200 1320,160 Q1380,140 1440,180 L1440,320 Z"
        fill="rgba(5,8,20,0.9)"
      />
      <path
        d="M0,320 L0,260 Q180,180 360,230 Q480,260 600,200 Q720,150 840,210 Q960,260 1080,220 Q1200,180 1320,240 L1440,260 L1440,320 Z"
        fill="rgba(5,8,20,0.9)"
        opacity="0.6"
      />
    </svg>
  );
}

function LargeNebulae({ count = 3 }: { count?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: `${15 + (37 * i) % 70}%`,
        y: `${10 + (43 * i) % 70}%`,
        size: 120 + (67 * i) % 200,
        dur: 8 + (5 * i) % 6,
        delay: 3 * i,
      })),
    [count]
  );

  return (
    <>
      {items.map((n, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: n.x,
            top: n.y,
            width: n.size,
            height: n.size,
            background: "radial-gradient(circle, rgba(80,140,255,0.12), rgba(60,100,200,0.06) 40%, transparent 70%)",
            filter: "blur(30px)",
          }}
          initial={{ scale: 0.8, opacity: 0.4 }}
          animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: n.dur, delay: n.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </>
  );
}

function FloatingShapes({ count = 6 }: { count?: number }) {
  const shapes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: `${(19 * i + 8) % 95}%`,
        y: `${(31 * i + 12) % 90}%`,
        size: 20 + (13 * i) % 30,
        rotation: (60 * i) % 360,
        dur: 12 + (7 * i) % 10,
        delay: (2.5 * i) % 8,
        sides: i % 3 === 0 ? 6 : i % 3 === 1 ? 4 : 3,
      })),
    [count]
  );

  return (
    <>
      {shapes.map((sh, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{
            left: sh.x,
            top: sh.y,
            width: sh.size,
            height: sh.size,
            border: "1px solid rgba(100,160,255,0.15)",
            borderRadius: sh.sides === 6 ? "4px" : sh.sides === 4 ? "2px" : "50% 0 50%",
            boxShadow: "0 0 8px rgba(80,140,255,0.08)",
          }}
          initial={{ rotate: sh.rotation, y: -8, opacity: 0.2 }}
          animate={{
            rotate: [sh.rotation, sh.rotation + 360],
            y: [-8, 8, -8],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{ duration: sh.dur, delay: sh.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </>
  );
}

const CODE_SYMBOLS = ["{ }", "< />", "=>", "()", "//", "&&", "||", "fn", "let", "if", "++", "!=", "::", "[]", "/**/", "#!", ">>", "<<"];

function CodeSymbols({ count = 8 }: { count?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: `${(23 * i + 7) % 92}%`,
        y: `${(41 * i + 15) % 85}%`,
        symbol: CODE_SYMBOLS[i % CODE_SYMBOLS.length],
        size: 10 + (3 * i) % 6,
        dur: 14 + (5 * i) % 12,
        delay: (1.8 * i) % 7,
        rotation: -15 + (31 * i) % 30,
      })),
    [count]
  );

  return (
    <>
      {items.map((c, i) => (
        <motion.span
          key={i}
          className="absolute pointer-events-none font-mono select-none"
          style={{
            left: c.x,
            top: c.y,
            fontSize: c.size,
            color: "rgba(100,180,255,0.25)",
            textShadow: "0 0 10px rgba(80,140,255,0.2)",
          }}
          initial={{ rotate: c.rotation, y: -12, opacity: 0.12 }}
          animate={{
            rotate: [c.rotation, c.rotation + 8, c.rotation],
            y: [-12, 12, -12],
            opacity: [0.12, 0.35, 0.12],
          }}
          transition={{ duration: c.dur, delay: c.delay, repeat: Infinity, ease: "easeInOut" }}
        >
          {c.symbol}
        </motion.span>
      ))}
    </>
  );
}

const RAIN_CHARS = ["{", "}", "<", ">", "/", "=", "(", ")", ";", ":", "0", "1", "*", "#", "[", "]", ".", "&", "|", "!"];

function CodeRain({ columns = 6 }: { columns?: number }) {
  const cols = useMemo(
    () =>
      Array.from({ length: columns }, (_, i) => ({
        left: `${5 + (17 * i + 3) % 90}%`,
        chars: Array.from({ length: 6 + (3 * i) % 5 }, (_, j) => RAIN_CHARS[(7 * i + 13 * j) % RAIN_CHARS.length]),
        dur: 18 + (7 * i) % 14,
        delay: (3.2 * i) % 8,
        size: 9 + (2 * i) % 4,
      })),
    [columns]
  );

  return (
    <>
      {cols.map((col, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none font-mono select-none flex flex-col items-center"
          style={{
            left: col.left,
            top: "-5%",
            fontSize: col.size,
            lineHeight: "1.8",
            color: "rgba(80,160,255,0.12)",
            textShadow: "0 0 6px rgba(60,120,255,0.08)",
          }}
          initial={{ y: "-10%", opacity: 0 }}
          animate={{ y: ["-10%", "110%"], opacity: [0, 0.2, 0.2, 0] }}
          transition={{ duration: col.dur, delay: col.delay, repeat: Infinity, ease: "linear" }}
        >
          {col.chars.map((ch, j) => (
            <span key={j} style={{ opacity: 0.4 + ((17 * j) % 6) * 0.1 }}>
              {ch}
            </span>
          ))}
        </motion.div>
      ))}
    </>
  );
}

function AuroraBand() {
  return (
    <motion.div
      className="absolute top-[15%] left-0 right-0 h-[35%] pointer-events-none"
      style={{
        background:
          "linear-gradient(180deg, transparent, rgba(60,120,255,0.1) 20%, rgba(70,130,255,0.08) 50%, rgba(60,140,255,0.06) 70%, transparent)",
      }}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.9, 0.5] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function Moon() {
  return (
    <div
      className="absolute top-[8%] right-[12%] w-24 h-24 rounded-full pointer-events-none"
      style={{
        background:
          "radial-gradient(circle at 40% 40%, rgba(220,230,255,0.3), rgba(180,200,240,0.12) 60%, transparent 80%)",
        boxShadow: "0 0 80px 30px rgba(180,200,255,0.1), 0 0 150px 70px rgba(120,150,255,0.05)",
      }}
    />
  );
}

export default function ArtBg({ variant }: Props) {
  const isHero = variant === "hero";
  const ref = useRef<HTMLDivElement>(null);
  // Six ArtBg instances are mounted at once, each with dozens of repeat:Infinity
  // animations. Only animate the section the visitor can actually see, and stop
  // entirely for anyone who asked their OS for reduced motion.
  const inView = useInView(ref, { margin: "300px 0px 300px 0px" });
  const reduced = useReducedMotion();
  const active = inView && !reduced;

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
      {/* Deep space gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #020818 0%, #091428 15%, #0f1d3a 30%, #142545 50%, #0f1830 70%, #091220 85%, #030712 100%)",
        }}
      />

      {active && (
        <>
          <AuroraBand />
          <Starfield count={isHero ? 50 : 35} maxSize={isHero ? 3 : 2} />
          <FloatingShapes count={isHero ? 5 : 3} />
          <GlowOrbs count={isHero ? 8 : 5} />
          <Nebulae count={isHero ? 4 : 2} />
          <CodeSymbols count={isHero ? 8 : variant === "skills" ? 6 : 4} />
          <CodeRain columns={isHero ? 4 : 3} />
        </>
      )}

      {/* Variant-specific elements */}
      {variant === "hero" && (
        <>
          <Moon />
          {active && (
            <>
              <ShootingStar delay={3} />
              <ShootingStar delay={9} />
              <LightRays count={3} angle={-15} />
              <LargeNebulae count={4} />
            </>
          )}
          <div
            className="absolute bottom-[15%] left-0 right-0 h-[20%]"
            style={{ background: "linear-gradient(0deg, rgba(60,100,200,0.12), transparent)" }}
          />
          <MountainSilhouette height="20%" />
        </>
      )}

      {variant === "story" && (
        <>
          {active && (
            <>
              <LightRays count={2} angle={-25} />
              <LargeNebulae count={3} />
            </>
          )}
          <MountainSilhouette height="15%" />
        </>
      )}

      {variant === "projects" && (
        <>
          {active && (
            <>
              <LargeNebulae count={4} />
              <LightRays count={2} angle={-30} />
            </>
          )}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              top: "20%",
              left: "10%",
              width: "60%",
              height: "50%",
              background: "radial-gradient(ellipse, rgba(80,120,255,0.08), transparent 60%)",
              filter: "blur(40px)",
            }}
          />
        </>
      )}

      {variant === "skills" && (
        <>
          {active && (
            <>
              <LightRays count={2} angle={-10} />
              <LargeNebulae count={3} />
            </>
          )}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              top: "5%",
              right: "20%",
              width: 144,
              height: 144,
              background: "radial-gradient(circle, rgba(0,229,255,0.15), transparent 70%)",
              filter: "blur(10px)",
            }}
          />
        </>
      )}

      {variant === "insights" && (
        <>
          {active && (
            <>
              <ShootingStar delay={5} />
              <LargeNebulae count={3} />
            </>
          )}
          <div
            className="absolute pointer-events-none"
            style={{
              top: "10%",
              left: "20%",
              width: "60%",
              height: "40%",
              background: "linear-gradient(135deg, rgba(80,120,255,0.06), transparent 60%)",
              transform: "rotate(-15deg)",
              filter: "blur(20px)",
            }}
          />
        </>
      )}

      {variant === "connect" && (
        <>
          {active && (
            <>
              <LightRays count={2} angle={-20} />
              <LargeNebulae count={3} />
            </>
          )}
          <MountainSilhouette height="18%" />
        </>
      )}
    </div>
  );
}
