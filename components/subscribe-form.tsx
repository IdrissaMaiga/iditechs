"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { FiBell, FiBellOff, FiCheck } from "react-icons/fi";

export default function SubscribeForm({ variant = "full" }: { variant?: "inline" | "full" }) {
  const { data: session, status: sessionStatus } = useSession();
  const [subscribed, setSubscribed] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    fetch("/api/subscribe")
      .then((r) => r.json())
      .then((data) => {
        setSubscribed(data.subscribed);
        setToken(data.token);
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, [sessionStatus]);

  const handleSubscribe = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: session?.user?.email ? "{}" : JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Something went wrong.");
      } else {
        setStatus("success");
        setSubscribed(true);
        setMessage(data.message);
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Try again.");
    }
  };

  const handleUnsubscribe = async () => {
    if (!token) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        setSubscribed(false);
        setToken(null);
        setStatus("idle");
        setMessage("");
      }
    } catch {
      setStatus("error");
      setMessage("Failed to unsubscribe.");
    }
  };

  if (variant === "inline") {
    if (status === "success" && !subscribed) {
      return (
        <span className="inline-flex items-center gap-1.5 text-gray-400 text-sm">
          Unsubscribed
        </span>
      );
    }

    if (session?.user?.email && checked && subscribed) {
      return (
        <button
          onClick={handleUnsubscribe}
          disabled={status === "loading"}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 hover:bg-red-500/10 hover:border-red-500/20 disabled:opacity-50 text-green-400 hover:text-red-400 rounded-lg text-sm transition-colors group"
        >
          <FiCheck className="w-3.5 h-3.5 group-hover:hidden" />
          <FiBellOff className="w-3.5 h-3.5 hidden group-hover:block" />
          <span className="group-hover:hidden">Subscribed</span>
          <span className="hidden group-hover:inline">Unsubscribe</span>
        </button>
      );
    }

    if (status === "success") {
      return (
        <span className="inline-flex items-center gap-1.5 text-green-400 text-sm">
          <FiCheck className="w-3.5 h-3.5" /> Subscribed
        </span>
      );
    }

    return (
      <button
        onClick={() => session?.user?.email ? handleSubscribe() : signIn("google")}
        disabled={status === "loading"}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] disabled:opacity-50 text-gray-300 hover:text-white rounded-lg text-sm transition-colors"
      >
        <FiBell className="w-3.5 h-3.5 text-blue-400" />
        {status === "loading" ? "..." : "Subscribe"}
      </button>
    );
  }

  // Full variant
  if (status === "success" && message) {
    return (
      <div className="flex items-center justify-center gap-2 py-4 text-green-400 text-sm">
        <FiCheck className="w-4 h-4" />
        <span>{message}</span>
      </div>
    );
  }

  if (session?.user?.email && checked && subscribed) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-green-400 text-sm mb-3">
          <FiCheck className="w-3.5 h-3.5" />
          <span>You are subscribed to new posts</span>
        </div>
        <div>
          <button
            onClick={handleUnsubscribe}
            disabled={status === "loading"}
            className="text-gray-500 hover:text-red-400 text-xs transition-colors"
          >
            Unsubscribe
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="inline-flex items-center gap-2 text-gray-400 text-sm mb-4">
        <FiBell className="w-3.5 h-3.5 text-blue-400" />
        <span>Get new posts delivered to your inbox</span>
      </div>

      {session?.user?.email ? (
        <div className="flex justify-center">
          <button
            onClick={() => handleSubscribe()}
            disabled={status === "loading"}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] disabled:opacity-50 text-gray-200 rounded-lg text-sm transition-colors"
          >
            <FiBell className="w-3.5 h-3.5 text-blue-400" />
            {status === "loading" ? "Subscribing..." : "Subscribe"}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubscribe} className="flex gap-2 max-w-sm mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 px-3.5 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-gray-400 text-[16px] sm:text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {status === "loading" ? "..." : "Subscribe"}
          </button>
        </form>
      )}

      {status === "error" && (
        <p className="text-red-400 text-xs mt-2">{message}</p>
      )}

      {!session && (
        <p className="text-gray-400 text-xs mt-2">
          Or{" "}
          <button onClick={() => signIn("google")} className="text-blue-400/70 hover:underline">
            sign in
          </button>{" "}
          to subscribe with one click.
        </p>
      )}
    </div>
  );
}
