"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signIn } from "next-auth/react";
import {
  FiMessageCircle, FiSend, FiX, FiMinus, FiMic, FiMicOff,
  FiVolume2, FiVolumeX, FiPlus, FiTrash2, FiChevronLeft,
} from "react-icons/fi";

interface Message {
  text: string;
  sender: "User" | "AI";
  timestamp: number;
  code?: boolean;
  isStreaming?: boolean;
  fullText?: string;
}

interface ChatSessionItem {
  id: string;
  title: string | null;
  updatedAt: string;
  lastMessage: string | null;
}

const suggestions = [
  "Show me your projects",
  "What's your tech stack?",
  "How can I contact you?",
  "Tell me about your experience",
];

export default function ChatButton() {
  const { data: session } = useSession();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [userMessage, setUserMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnreadMessage, setHasUnreadMessage] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  // Session management
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showSessionList, setShowSessionList] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatHistory = useRef<HTMLDivElement>(null);
  const streamingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isChatOpenRef = useRef(isChatOpen);
  const voiceEnabledRef = useRef(voiceEnabled);
  const isStreamingRef = useRef(false);

  useEffect(() => { isChatOpenRef.current = isChatOpen; }, [isChatOpen]);
  useEffect(() => { voiceEnabledRef.current = voiceEnabled; }, [voiceEnabled]);

  // Load sessions when chat opens
  const loadSessions = useCallback(async () => {
    if (!session) return;
    setLoadingSessions(true);
    try {
      const res = await fetch("/api/chat/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch { /* ignore */ }
    setLoadingSessions(false);
  }, [session]);

  // Load messages for a session
  const loadSessionMessages = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`/api/chat/sessions/${sessionId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(
          data.map((m: { sender: string; text: string; createdAt: string }) => ({
            text: m.text,
            sender: m.sender as "User" | "AI",
            timestamp: new Date(m.createdAt).getTime(),
          }))
        );
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (isChatOpen && session) {
      loadSessions();
    }
  }, [isChatOpen, session, loadSessions]);

  // Scroll to bottom
  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, isStreamingRef.current ? 200 : 0);
  }, [messages]);

  useEffect(() => {
    if (isChatOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 300);
      setHasUnreadMessage(false);
    }
  }, [isChatOpen, isMinimized]);

  useEffect(() => {
    return () => {
      if (streamingTimerRef.current) clearTimeout(streamingTimerRef.current);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, []);

  // Voice input
  const startListening = () => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    let finalTranscript = "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      if (inputRef.current) {
        inputRef.current.value = (finalTranscript + interim).trim();
        setUserMessage((finalTranscript + interim).trim());
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => {
      setIsListening(false);
      const text = finalTranscript.trim();
      if (text) sendMessage(text);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  // Voice output
  const speakText = useCallback((text: string) => {
    if (!voiceEnabledRef.current || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/```[\s\S]*?```/g, "code block").replace(/[*_#`]/g, "").replace(/\n+/g, ". ");
    const chunks = clean.match(/.{1,200}[.!?,;:]?\s*/g) || [clean];
    chunks.forEach((chunk, i) => {
      const utterance = new SpeechSynthesisUtterance(chunk.trim());
      utterance.rate = 1.1;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      if (i === 0) {
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => v.lang.startsWith("en") && v.name.includes("Google")) || voices.find(v => v.lang.startsWith("en"));
        if (preferred) utterance.voice = preferred;
      }
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const adjustTextareaHeight = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const toggleChat = () => {
    // Anonymous visitors get an explanation first. Firing signIn() straight from the
    // site's most prominent button meant a stranger's first interaction was a Google
    // consent screen for an account they had no reason to hand over.
    if (!session) {
      setIsChatOpen((open) => !open);
      return;
    }
    if (isChatOpen) { setIsChatOpen(false); setIsMinimized(false); }
    else { setIsChatOpen(true); setIsMinimized(false); }
  };

  const handleMinimize = () => { setIsMinimized(true); setIsChatOpen(false); };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const val = inputRef.current?.value || userMessage;
      if (val.trim()) sendMessage(val);
    }
  };

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const startNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setShowSessionList(false);
  };

  const openSession = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    setShowSessionList(false);
    await loadSessionMessages(sessionId);
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/chat/sessions?id=${sessionId}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch { /* ignore */ }
  };

  // Stream text character by character
  const streamText = useCallback((fullText: string, messageIndex: number) => {
    let idx = 0;
    isStreamingRef.current = true;

    const tick = () => {
      if (idx <= fullText.length) {
        setMessages((prev) => {
          const updated = [...prev];
          if (!updated[messageIndex]) return prev;
          updated[messageIndex] = {
            ...updated[messageIndex],
            text: fullText.substring(0, idx),
            fullText,
            isStreaming: idx < fullText.length,
          };
          return updated;
        });
        idx++;
        const delay = idx > 1 && /[.,!?;:]/.test(fullText[idx - 2]) ? 120 : 25;
        streamingTimerRef.current = setTimeout(tick, delay);
      } else {
        streamingTimerRef.current = null;
        isStreamingRef.current = false;
        setMessages((prev) => {
          const updated = [...prev];
          if (!updated[messageIndex]) return prev;
          updated[messageIndex] = { ...updated[messageIndex], isStreaming: false };
          return updated;
        });
        speakText(fullText);
      }
    };

    tick();
  }, [speakText]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    if (!session) { signIn("google"); return; }

    if (streamingTimerRef.current) {
      clearTimeout(streamingTimerRef.current);
      streamingTimerRef.current = null;
      isStreamingRef.current = false;
    }
    window.speechSynthesis?.cancel();

    const userMsg: Message = { text: trimmed, sender: "User", timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setUserMessage("");
    setIsTyping(true);
    if (inputRef.current) inputRef.current.style.height = "auto";

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          userCommand: trimmed,
          sessionId: activeSessionId,
        }),
      });
      clearTimeout(timeout);

      if (!response.ok) {
        if (response.status === 401) {
          signIn("google");
          return;
        }
        throw new Error(`${response.status}`);
      }
      const data = await response.json();

      // Update sessionId if a new one was created
      if (data.sessionId && !activeSessionId) {
        setActiveSessionId(data.sessionId);
        loadSessions();
      }

      const aiText = data.response || (data.action ? "Done!" : "How can I help?");

      if (data.action) {
        const navActions = ["navigate_to_section", "show_project", "get_contact_info", "highlight_skill", "show_stats"];
        if (navActions.includes(data.action.type)) {
          setTimeout(() => { setIsChatOpen(false); setIsMinimized(true); }, 800);
        }
        setTimeout(() => {
          try {
            window.dispatchEvent(new CustomEvent("portfolio-action", { detail: data.action }));
          } catch (err) { console.error("Action dispatch failed:", err); }
        }, 400);
      }

      const containsCode = trimmed.toLowerCase().includes("code") || trimmed.toLowerCase().includes("example") || aiText.includes("```");

      let aiIdx = -1;
      setMessages(prev => {
        aiIdx = prev.length;
        return [...prev, {
          text: "", fullText: aiText, sender: "AI" as const,
          timestamp: Date.now(), code: containsCode, isStreaming: true,
        }];
      });

      setTimeout(() => {
        if (aiIdx >= 0) streamText(aiText, aiIdx);
      }, 300);

      if (!isChatOpenRef.current) setHasUnreadMessage(true);
    } catch (error) {
      const msg = error instanceof Error && error.name === "AbortError"
        ? "Request timed out. Please try again."
        : "Something went wrong. Please try again.";
      setMessages(prev => [...prev, { text: msg, sender: "AI", timestamp: Date.now() }]);
      if (!isChatOpenRef.current) setHasUnreadMessage(true);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMarkdown = (text: string): React.ReactNode[] => {
    const nodes: React.ReactNode[] = [];
    const lines = text.split("\n");
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      if (line.startsWith("```")) {
        const lang = line.slice(3).trim();
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }
        if (i < lines.length) i++;
        nodes.push(
          <div key={`code-${i}`} className="my-2">
            {lang && <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1 font-medium">{lang}</div>}
            <div className="bg-black/40 text-gray-200 p-3 rounded-lg font-mono text-xs overflow-x-auto border border-white/[0.06] whitespace-pre">
              {codeLines.join("\n")}
            </div>
          </div>
        );
        continue;
      }

      if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
        const tableRows: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
          tableRows.push(lines[i]);
          i++;
        }
        const parseRow = (row: string) => row.split("|").slice(1, -1).map(c => c.trim());
        const header = parseRow(tableRows[0]);
        const isSeparator = (r: string) => /^\|[\s\-:|]+\|$/.test(r.trim());
        const dataStart = tableRows.length > 1 && isSeparator(tableRows[1]) ? 2 : 1;
        const bodyRows = tableRows.slice(dataStart).map(parseRow);

        nodes.push(
          <div key={`table-${i}`} className="my-2 overflow-x-auto rounded-lg border border-white/[0.08]">
            <table className="w-full text-xs">
              <thead className="bg-white/[0.05]">
                <tr>{header.map((h, j) => <th key={j} className="px-2 py-1.5 text-left font-semibold text-gray-200">{renderInline(h)}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {bodyRows.map((row, ri) => (
                  <tr key={ri} className="hover:bg-white/[0.02]">
                    {row.map((cell, ci) => <td key={ci} className="px-2 py-1.5 text-gray-300">{renderInline(cell)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }

      const headerMatch = line.match(/^(#{1,4})\s+(.+)/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const sizes = ["text-base font-bold", "text-sm font-bold", "text-sm font-semibold", "text-xs font-semibold"];
        nodes.push(<div key={`h-${i}`} className={`${sizes[level - 1]} text-white mt-2 mb-1`}>{renderInline(headerMatch[2])}</div>);
        i++;
        continue;
      }

      if (/^[\s]*[-*]\s/.test(line)) {
        const listItems: string[] = [];
        while (i < lines.length && /^[\s]*[-*]\s/.test(lines[i])) {
          listItems.push(lines[i].replace(/^[\s]*[-*]\s/, ""));
          i++;
        }
        nodes.push(
          <ul key={`ul-${i}`} className="my-1 pl-3 space-y-0.5">
            {listItems.map((item, j) => <li key={j} className="text-gray-300 flex gap-1.5 items-start"><span className="text-blue-400 mt-1.5 shrink-0 w-1 h-1 rounded-full bg-blue-400 inline-block" /><span>{renderInline(item)}</span></li>)}
          </ul>
        );
        continue;
      }

      if (/^\d+[.)]\s/.test(line)) {
        const listItems: string[] = [];
        while (i < lines.length && /^\d+[.)]\s/.test(lines[i])) {
          listItems.push(lines[i].replace(/^\d+[.)]\s/, ""));
          i++;
        }
        nodes.push(
          <ol key={`ol-${i}`} className="my-1 pl-3 space-y-0.5">
            {listItems.map((item, j) => <li key={j} className="text-gray-300 flex gap-1.5 items-start"><span className="text-blue-400 text-xs font-medium shrink-0 w-4">{j + 1}.</span><span>{renderInline(item)}</span></li>)}
          </ol>
        );
        continue;
      }

      if (!line.trim()) {
        nodes.push(<div key={`br-${i}`} className="h-2" />);
        i++;
        continue;
      }

      nodes.push(<div key={`p-${i}`} className="text-gray-200">{renderInline(line)}</div>);
      i++;
    }

    return nodes;
  };

  const renderInline = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*(.+?)\*\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))/g;
    let lastIdx = 0;
    let match: RegExpExecArray | null;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push(<span key={key++}>{text.slice(lastIdx, match.index)}</span>);
      }
      if (match[2]) {
        parts.push(<strong key={key++} className="text-white font-semibold">{match[2]}</strong>);
      } else if (match[4]) {
        parts.push(<code key={key++} className="px-1 py-0.5 rounded bg-white/[0.08] text-cyan-300 text-[0.85em] font-mono">{match[4]}</code>);
      } else if (match[6] && match[7]) {
        const href = /^https?:\/\//i.test(match[7]) ? match[7] : "#";
        parts.push(<a key={key++} href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline underline-offset-2">{match[6]}</a>);
      }
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < text.length) {
      parts.push(<span key={key++}>{text.slice(lastIdx)}</span>);
    }
    return parts.length > 0 ? parts : text;
  };

  const renderMessageContent = (message: Message) => {
    const textToRender = message.text;
    const cursor = message.isStreaming ? (
      <span className="inline-block w-0.5 h-4 ml-0.5 bg-blue-400 animate-blink align-middle" />
    ) : null;

    return (
      <div className="text-sm leading-relaxed">
        {renderMarkdown(textToRender)}
        {cursor}
      </div>
    );
  };

  const showSuggestions = messages.length === 0 && !isTyping;

  return (
    <>
      <AnimatePresence>
        {!isChatOpen && (() => {
          const lastAI = [...messages].reverse().find(m => m.sender === "AI" && (m.fullText || m.text));
          const preview = lastAI ? (lastAI.fullText || lastAI.text).replace(/[*#`_\[\]]/g, "").replace(/\n+/g, " ").trim() : "";
          const showPreview = preview && hasUnreadMessage;

          return (
            <motion.div
              className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
            >
              {showPreview && (
                <motion.div
                  onClick={toggleChat}
                  className="max-w-[260px] px-3.5 py-2.5 rounded-2xl rounded-br-sm bg-[#0a0f1e]/95 backdrop-blur-xl border border-white/[0.1] text-gray-300 text-xs leading-relaxed cursor-pointer hover:border-blue-500/30 transition-colors shadow-lg shadow-black/30"
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.8, type: "spring", stiffness: 300, damping: 25 }}
                >
                  <div className="line-clamp-2">{preview.length > 120 ? preview.slice(0, 120) + "..." : preview}</div>
                  <div className="text-[10px] text-blue-400/60 mt-1">Tap to continue</div>
                </motion.div>
              )}

              <motion.button
                onClick={toggleChat}
                className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-blue-600/90 backdrop-blur-md border border-blue-400/20 text-white font-medium text-sm shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-shadow cursor-pointer select-none relative"
                whileHover={{ scale: 1.05 }}
                aria-label="Open AI chat"
              >
                <FiMessageCircle className="w-[18px] h-[18px]" />
                <span>{session ? "Ask AI" : "Sign in to chat"}</span>
                {hasUnreadMessage && (
                  <>
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-300" />
                    </span>
                    <span className="absolute inset-0 rounded-2xl animate-pulse-slow opacity-40 shadow-[0_0_20px_6px_rgba(59,130,246,0.5)]" />
                  </>
                )}
              </motion.button>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      <AnimatePresence>
        {isChatOpen && !session && (
          <motion.div
            role="dialog"
            aria-label="Sign in to chat"
            className="fixed z-50 bottom-6 right-6 w-[90vw] max-w-[360px] rounded-2xl bg-[#0a0f1e]/95 backdrop-blur-xl border border-white/[0.08] p-5 shadow-2xl shadow-blue-500/10"
            initial={{ scale: 0.9, opacity: 0, y: 20, transformOrigin: "bottom right" }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          >
            <h2 className="text-white font-semibold text-base">Ask about my work</h2>
            <p className="mt-2 text-sm text-gray-300 leading-relaxed">
              An AI assistant that answers questions about my projects, stack and experience.
              Sign in so your conversation is saved and you can pick it up later.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => signIn("google")}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
              >
                Continue with Google
              </button>
              <button
                onClick={() => setIsChatOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm text-gray-400 transition-colors hover:text-white"
              >
                Not now
              </button>
            </div>
            <p className="mt-3 text-xs text-gray-400">
              Prefer not to sign in? Email{" "}
              <a href="mailto:idrissa.maiga@iditechs.com" className="text-blue-400 hover:text-blue-300">
                idrissa.maiga@iditechs.com
              </a>
              .
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isChatOpen && session && (
          <motion.div
            className="fixed z-50 bottom-6 right-6 w-[90vw] max-w-[420px] flex flex-col rounded-2xl overflow-hidden bg-[#0a0f1e]/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-blue-500/10"
            style={{ height: "min(600px, calc(100dvh - 48px))", minHeight: "400px" }}
            initial={{ scale: 0.85, opacity: 0, y: 30, transformOrigin: "bottom right" }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/[0.05] border-b border-white/[0.08] shrink-0">
              <div className="flex items-center gap-2.5">
                {showSessionList ? (
                  <span className="text-white font-semibold text-sm tracking-tight">Chat History</span>
                ) : (
                  <>
                    <button
                      onClick={() => setShowSessionList(true)}
                      className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                      title="Chat history"
                    >
                      <FiChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-60" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
                    </span>
                    <span className="text-white font-semibold text-sm tracking-tight">Idrissa&apos;s AI</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1">
                {!showSessionList && (
                  <button
                    onClick={startNewChat}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                    title="New chat"
                  >
                    <FiPlus className="w-4 h-4" />
                  </button>
                )}
                <button onClick={handleMinimize} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors" aria-label="Minimize"><FiMinus className="w-4 h-4" /></button>
                <button onClick={toggleChat} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors" aria-label="Close"><FiX className="w-4 h-4" /></button>
              </div>
            </div>

            {showSessionList ? (
              /* Session list view */
              <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
                <div className="p-3">
                  <button
                    onClick={startNewChat}
                    className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl bg-blue-600/20 border border-blue-500/20 text-blue-300 text-sm font-medium hover:bg-blue-600/30 transition-colors mb-3"
                  >
                    <FiPlus className="w-4 h-4" />
                    New Chat
                  </button>

                  {loadingSessions ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-5 h-5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                    </div>
                  ) : sessions.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8">No previous chats</p>
                  ) : (
                    <div className="space-y-1">
                      {sessions.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => openSession(s.id)}
                          className={`group flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                            activeSessionId === s.id
                              ? "bg-blue-500/15 border border-blue-500/20"
                              : "hover:bg-white/[0.04] border border-transparent"
                          }`}
                        >
                          <FiMessageCircle className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-200 truncate">{s.title || "Untitled chat"}</p>
                            {s.lastMessage && (
                              <p className="text-xs text-gray-500 truncate mt-0.5">{s.lastMessage}</p>
                            )}
                            <p className="text-[10px] text-gray-600 mt-0.5">
                              {new Date(s.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </p>
                          </div>
                          <button
                            onClick={(e) => deleteSession(s.id, e)}
                            className="p-1 rounded text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                            title="Delete chat"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" ref={chatHistory} style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
                  {/* Welcome message for new chats */}
                  {messages.length === 0 && (
                    <div className="flex flex-col items-start">
                      <div className="max-w-[85%] px-3.5 py-2.5 bg-white/[0.05] border border-white/[0.06] rounded-2xl rounded-tl-sm text-gray-200">
                        <div className="text-sm leading-relaxed">
                          Hello{session?.user?.name ? ` ${session.user.name.split(" ")[0]}` : ""}! I&apos;m Idrissa&apos;s AI assistant. Ask me anything about his work, skills, or projects.
                        </div>
                      </div>
                    </div>
                  )}

                  {messages.map((message) => {
                    const displayText = message.text || message.fullText || "";
                    if (!displayText && !message.isStreaming) return null;
                    return (
                      <div key={message.timestamp} className={`flex flex-col ${message.sender === "User" ? "items-end" : "items-start"}`}>
                        <div className={`max-w-[85%] px-3.5 py-2.5 ${message.sender === "AI" ? "bg-white/[0.05] border border-white/[0.06] rounded-2xl rounded-tl-sm text-gray-200" : "bg-blue-600/80 rounded-2xl rounded-tr-sm text-white"}`}>
                          {renderMessageContent(message)}
                        </div>
                        <span className="text-[11px] text-gray-500 mt-1 px-1">{formatTime(message.timestamp)}</span>
                      </div>
                    );
                  })}

                  {showSuggestions && (
                    <div className="grid grid-cols-2 gap-2 pt-2 pb-1">
                      {suggestions.map((s, i) => (
                        <button key={i} onClick={() => sendMessage(s)} className="text-xs text-left px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-gray-300 hover:bg-blue-500/20 hover:border-blue-500/30 hover:text-blue-200 transition-all duration-200 cursor-pointer">{s}</button>
                      ))}
                    </div>
                  )}

                  {isTyping && (
                    <div className="flex flex-col items-start">
                      <div className="max-w-[85%] px-3.5 py-3 bg-white/[0.05] border border-white/[0.06] rounded-2xl rounded-tl-sm">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="shrink-0 px-3 py-3 border-t border-white/[0.08] bg-white/[0.02]">
                  <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-1.5">
                    <button
                      onClick={isListening ? stopListening : startListening}
                      className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer ${isListening ? "bg-red-500/80 text-white animate-pulse" : "bg-white/[0.06] text-gray-400 hover:text-blue-400 hover:bg-blue-500/20"}`}
                      aria-label={isListening ? "Stop listening" : "Voice input"}
                    >
                      {isListening ? <FiMicOff className="w-3.5 h-3.5" /> : <FiMic className="w-3.5 h-3.5" />}
                    </button>
                    <textarea
                      ref={inputRef}
                      value={userMessage}
                      onChange={(e) => { setUserMessage(e.target.value); adjustTextareaHeight(e.target); }}
                      onKeyDown={handleKeyDown}
                      placeholder={isListening ? "Listening..." : "Ask me anything about Idrissa..."}
                      rows={1}
                      className="flex-1 resize-none bg-transparent text-gray-200 text-[16px] sm:text-sm placeholder-gray-400 outline-none leading-relaxed py-1.5"
                      style={{ minHeight: "40px", maxHeight: "120px" }}
                    />
                    <button
                      onClick={() => sendMessage(userMessage)}
                      disabled={!userMessage.trim() || isTyping}
                      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:opacity-30 disabled:hover:bg-blue-600 cursor-pointer"
                      aria-label="Send message"
                    >
                      <FiSend className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-1.5 px-1">
                    <button
                      onClick={() => { setVoiceEnabled(v => !v); if (voiceEnabled) window.speechSynthesis?.cancel(); }}
                      className={`flex items-center gap-1 text-[10px] cursor-pointer transition-colors ${voiceEnabled ? "text-blue-400" : "text-gray-600 hover:text-gray-400"}`}
                    >
                      {voiceEnabled ? <FiVolume2 className="w-3 h-3" /> : <FiVolumeX className="w-3 h-3" />}
                      {voiceEnabled ? "Voice on" : "Voice off"}
                    </button>
                    <span className="text-[10px] text-gray-600">Enter to send</span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .animate-blink { animation: blink 0.8s steps(2, start) infinite; }
      `}</style>
    </>
  );
}
