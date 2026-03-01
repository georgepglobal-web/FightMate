"use client";

import Link from "next/link";
import AvatarImage from "./AvatarImage";
import { getLevelColor, type Avatar } from "@/lib/constants";
import type { DbSession } from "@/lib/data";

export default function HomePage({ avatar, sessions }: { avatar: Avatar; sessions: DbSession[] }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-8 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-black dark:via-purple-950 dark:to-black">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center mb-12 mt-8 sm:mt-16">
          <div className="relative mb-8">
            <div className="relative w-48 h-64 sm:w-56 sm:h-72 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20">
              <AvatarImage level={avatar.level} size="xl" showGlow={false} fullImage={true} className="w-full h-full" />
            </div>
            <div className={`absolute -bottom-3 left-1/2 transform -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r ${getLevelColor(avatar.level)} text-white text-xs font-bold shadow-lg border-2 border-white/30 whitespace-nowrap z-10`}>
              {avatar.level} Fighter
            </div>
          </div>
          <div className="flex gap-6 mt-8 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20 hover:bg-white/15 transition-colors duration-200">
              <div className="text-2xl font-bold text-white">{sessions.length}</div>
              <div className="text-xs text-white/70 uppercase tracking-wide">Sessions</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20 hover:bg-white/15 transition-colors duration-200">
              <div className="text-2xl font-bold text-white">{avatar.level}</div>
              <div className="text-xs text-white/70 uppercase tracking-wide">Level</div>
            </div>
          </div>
          <div className="w-full max-w-xs mt-6">
            <div className="flex justify-between text-xs text-white/80 mb-2"><span>Level Progress</span></div>
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden border border-white/20 backdrop-blur-sm shadow-inner">
              <div className={`h-full bg-gradient-to-r ${getLevelColor(avatar.level)} transition-all duration-700 ease-out rounded-full shadow-lg`} style={{ width: `${avatar.progress}%` }} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {([
            { href: "/log", label: "Log Session", gradient: "from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700", shadow: "hover:shadow-blue-500/50", icon: "M12 4v16m8-8H4" },
            { href: "/history", label: "History", gradient: "from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700", shadow: "hover:shadow-green-500/50", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
            { href: "/avatar", label: "Avatar Evolution", gradient: "from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600", shadow: "hover:shadow-orange-500/50", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
            { href: "/ranking", label: "Group Ranking", gradient: "from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700", shadow: "hover:shadow-purple-500/50", icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
          ]).map(({ href, label, gradient, shadow, icon }) => (
            <Link key={href} href={href} className={`group relative overflow-hidden bg-gradient-to-br ${gradient} text-white font-bold py-6 px-6 rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-105 ${shadow} border-2 border-white/20 backdrop-blur-sm text-center`}>
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
              <div className="relative flex items-center justify-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} /></svg>
                <span className="text-lg">{label}</span>
              </div>
            </Link>
          ))}
          <Link href="/sparring" className="group relative overflow-hidden bg-gradient-to-br from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-6 px-6 rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-red-500/50 border-2 border-white/20 backdrop-blur-sm sm:col-span-2 text-center">
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
            <div className="relative flex items-center justify-center gap-3">
              <span className="text-2xl">🥊</span>
              <span className="text-lg">Sparring Sessions</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
