"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

const titles = ["Full Stack Engineer", "Software Developer"];

const TYPE_MS = 150;
const DELETE_MS = 50;
const PAUSE_MS = 2000;

// Lives in its own component so a keystroke re-renders this span and nothing else.
// Inside HeroSection it used to reconcile the whole hero, including ArtBg, 7-20x a second.
export default function TypedTitle() {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const current = titles[index];
    const done = text === current;
    const delay = isDeleting ? DELETE_MS : done ? PAUSE_MS : TYPE_MS;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (done) setIsDeleting(true);
        else setText(current.slice(0, text.length + 1));
      } else if (text.length === 0) {
        setIsDeleting(false);
        setIndex((i) => (i + 1) % titles.length);
      } else {
        setText(current.slice(0, text.length - 1));
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [text, isDeleting, index, reduced]);

  return (
    <span className="text-xl sm:text-2xl font-mono text-blue-300/90">
      &gt; {reduced ? titles[0] : text}
      {!reduced && <span className="inline-block w-0.5 h-6 bg-blue-400 ml-1 animate-pulse" />}
    </span>
  );
}
