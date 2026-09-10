"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  FiUsers,
  FiEye,
  FiActivity,
  FiMessageSquare,
  FiHeart,
  FiCpu,
  FiTrendingUp,
  FiClock,
  FiExternalLink,
  FiBell,
  FiBarChart2,
  FiCalendar,
  FiRefreshCw,
} from "react-icons/fi";

interface ActiveVisitor {
  ip: string | null;
  path: string;
  name: string | null;
  image: string | null;
  isRegistered: boolean;
}

interface Stats {
  overview: {
    totalUsers: number;
    totalSubscribers: number;
    totalPageViews: number;
    activeNow: number;
    todayViews: number;
    weekViews: number;
    monthViews: number;
    uniqueVisitors: {
      today: number;
      week: number;
      month: number;
      allTime: number;
    };
  };
  engagement: {
    totalComments: number;
    totalLikes: number;
    totalChatSessions: number;
    totalChatMessages: number;
  };
  activeNowDetails: ActiveVisitor[];
  recentUsers: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    createdAt: string;
  }[];
  topPages: { path: string; count: number }[];
  todayTopPages: { path: string; count: number }[];
  viewsByDay: { date: string; count: number }[];
  topReferrers: { referrer: string; count: number }[];
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  sub?: string;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{typeof value === "number" ? value.toLocaleString() : value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </motion.div>
  );
}

function MiniBar({ data, maxVal }: { data: { date: string; count: number }[]; maxVal: number }) {
  return (
    <div className="flex items-end gap-[2px] h-24">
      {data.map((d) => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
          <div
            className="w-full bg-blue-500/60 rounded-sm min-h-[2px] transition-colors group-hover:bg-blue-400"
            style={{ height: `${maxVal > 0 ? (d.count / maxVal) * 100 : 0}%` }}
          />
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-gray-800 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
            {d.date}: {d.count}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StatsPage() {
  const { status } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/analytics/stats");
      if (res.status === 403) {
        setError("unauthorized");
        return;
      }
      if (!res.ok) throw new Error();
      setStats(await res.json());
      setError(null);
    } catch {
      setError("Failed to load statistics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") fetchStats();
    else if (status === "unauthenticated") setLoading(false);
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="text-center">
          <FiBarChart2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Sign in required</h1>
          <p className="text-gray-400 mb-6">This page is restricted to the site owner.</p>
          <button
            onClick={() => signIn("google")}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  if (error === "unauthorized") {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="text-center">
          <FiBarChart2 className="w-12 h-12 text-red-500/50 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400">This page is restricted to the site owner.</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <p className="text-gray-400">{error || "Something went wrong."}</p>
      </div>
    );
  }

  const maxDayViews = Math.max(...stats.viewsByDay.map((d) => d.count), 1);

  return (
    <div className="min-h-screen bg-[#030712] pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Site Statistics</h1>
            <p className="text-gray-400 text-sm mt-1">Real-time analytics for your portfolio</p>
          </div>
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.05] border border-white/[0.1] text-gray-300 hover:text-white hover:bg-white/[0.08] transition-colors text-sm"
          >
            <FiRefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2 mb-6">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          <span className="text-sm text-green-400 font-medium">
            {stats.overview.activeNow} {stats.overview.activeNow === 1 ? "visitor" : "visitors"} right now
          </span>
        </div>

        {/* Traffic Overview */}
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Traffic</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard icon={FiUsers} label="Registered Users" value={stats.overview.totalUsers} color="bg-blue-500/10 text-blue-400" />
          <StatCard icon={FiBell} label="Subscribers" value={stats.overview.totalSubscribers} sub="Email notifications" color="bg-pink-500/10 text-pink-400" />
          <StatCard icon={FiActivity} label="Active Now" value={stats.overview.activeNow} sub="Last 2 minutes" color="bg-green-500/10 text-green-400" />
          <StatCard icon={FiEye} label="Views Today" value={stats.overview.todayViews} sub={`${stats.overview.uniqueVisitors.today} unique visitors`} color="bg-purple-500/10 text-purple-400" />
          <StatCard icon={FiCalendar} label="Views This Week" value={stats.overview.weekViews} sub={`${stats.overview.uniqueVisitors.week} unique visitors`} color="bg-indigo-500/10 text-indigo-400" />
          <StatCard icon={FiTrendingUp} label="Views This Month" value={stats.overview.monthViews} sub={`${stats.overview.uniqueVisitors.month} unique visitors`} color="bg-cyan-500/10 text-cyan-400" />
          <StatCard icon={FiBarChart2} label="All Time Views" value={stats.overview.totalPageViews} sub={`${stats.overview.uniqueVisitors.allTime} unique visitors`} color="bg-orange-500/10 text-orange-400" />
        </div>

        {/* Engagement Cards */}
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Engagement</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard icon={FiHeart} label="Total Likes" value={stats.engagement.totalLikes} color="bg-red-500/10 text-red-400" />
          <StatCard icon={FiMessageSquare} label="Comments" value={stats.engagement.totalComments} color="bg-yellow-500/10 text-yellow-400" />
          <StatCard icon={FiCpu} label="Chat Sessions" value={stats.engagement.totalChatSessions} color="bg-emerald-500/10 text-emerald-400" />
          <StatCard icon={FiMessageSquare} label="Chat Messages" value={stats.engagement.totalChatMessages} color="bg-teal-500/10 text-teal-400" />
        </div>

        {/* Active Now Details */}
        {stats.activeNowDetails.length > 0 && (
          <>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Active Right Now
            </h2>
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5 mb-8">
              <div className="space-y-3">
                {stats.activeNowDetails.map((v, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    {v.image ? (
                      <Image src={v.image} alt="" width={24} height={24} className="w-6 h-6 rounded-full" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] text-gray-400">
                        {v.isRegistered ? (v.name?.[0] || "U") : "?"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-200">
                        {v.name || (v.isRegistered ? "Registered User" : "Anonymous")}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 truncate max-w-[200px]">{v.path}</span>
                    {v.ip && <span className="text-[11px] text-gray-600 font-mono hidden sm:block">{v.ip}</span>}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Charts + Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Views Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <FiTrendingUp className="w-4 h-4 text-blue-400" />
              Page Views (Last 30 Days)
            </h3>
            {stats.viewsByDay.length > 0 ? (
              <MiniBar data={stats.viewsByDay} maxVal={maxDayViews} />
            ) : (
              <p className="text-gray-500 text-sm py-8 text-center">No data yet</p>
            )}
            <div className="flex justify-between text-[10px] text-gray-600 mt-2">
              <span>{stats.viewsByDay[0]?.date || ""}</span>
              <span>{stats.viewsByDay[stats.viewsByDay.length - 1]?.date || ""}</span>
            </div>
          </motion.div>

          {/* Top Pages Today */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <FiClock className="w-4 h-4 text-purple-400" />
              Top Pages Today
            </h3>
            {stats.todayTopPages.length > 0 ? (
              <ul className="space-y-2">
                {stats.todayTopPages.map((p) => (
                  <li key={p.path} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300 truncate mr-4">{p.path}</span>
                    <span className="text-gray-500 tabular-nums flex-shrink-0">{p.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm py-8 text-center">No views today yet</p>
            )}
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Pages All Time */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <FiBarChart2 className="w-4 h-4 text-orange-400" />
              Top Pages (All Time)
            </h3>
            <ul className="space-y-2">
              {stats.topPages.map((p) => (
                <li key={p.path} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300 truncate mr-4">{p.path}</span>
                  <span className="text-gray-500 tabular-nums flex-shrink-0">{p.count}</span>
                </li>
              ))}
              {stats.topPages.length === 0 && (
                <li className="text-gray-500 text-sm text-center py-4">No data yet</li>
              )}
            </ul>
          </motion.div>

          {/* Top Referrers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <FiExternalLink className="w-4 h-4 text-cyan-400" />
              Top Referrers (30 days)
            </h3>
            <ul className="space-y-2">
              {stats.topReferrers.map((r) => (
                <li key={r.referrer} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300 truncate mr-4">{r.referrer}</span>
                  <span className="text-gray-500 tabular-nums flex-shrink-0">{r.count}</span>
                </li>
              ))}
              {stats.topReferrers.length === 0 && (
                <li className="text-gray-500 text-sm text-center py-4">No referrer data yet</li>
              )}
            </ul>
          </motion.div>

          {/* Recent Users */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <FiUsers className="w-4 h-4 text-blue-400" />
              Recent Users
            </h3>
            <ul className="space-y-3">
              {stats.recentUsers.map((u) => (
                <li key={u.id} className="flex items-center gap-3">
                  {u.image ? (
                    <Image src={u.image} alt="" width={28} height={28} className="w-7 h-7 rounded-full" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">
                      {u.name?.[0] || "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 truncate">{u.name || "Anonymous"}</p>
                    <p className="text-[11px] text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
