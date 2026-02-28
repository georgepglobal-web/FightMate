"use client";

import { useState } from "react";
import { usePage } from "../contexts/PageContext";
import { SESSION_TYPES, CLASS_LEVELS, DEFAULT_GROUP_ID, normalizeDateToISO } from "@/lib/constants";
import type { DbSession } from "@/lib/data";

export default function LogSession({ onAddSession }: { onAddSession: (session: Omit<DbSession, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void }) {
  const { setCurrentPage: setPage } = usePage();
  const [date, setDate] = useState("");
  const [type, setType] = useState(SESSION_TYPES[0]);
  const [level, setLevel] = useState(CLASS_LEVELS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) { alert("Please select a date"); return; }
    setIsSubmitting(true);
    onAddSession({ date: normalizeDateToISO(date), type, level, group_id: DEFAULT_GROUP_ID, points: 0 });
    setDate(""); setType(SESSION_TYPES[0]); setLevel(CLASS_LEVELS[0]);
    setIsSubmitting(false);
    setPage("history");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-8 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 dark:from-black dark:via-blue-950 dark:to-black">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8 mt-8 sm:mt-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 drop-shadow-lg">Log Training Session</h2>
          <p className="text-white/70 text-sm sm:text-base">Track your progress and level up your fighter avatar</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="date" className="block text-white font-semibold mb-2 text-sm sm:text-base">Date</label>
              <input type="date" id="date" value={date} onChange={(e) => setDate(normalizeDateToISO(e.target.value))} required className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm text-sm sm:text-base" style={{ colorScheme: "dark" }} />
            </div>
            <div>
              <label htmlFor="session-type" className="block text-white font-semibold mb-2 text-sm sm:text-base">Session Type</label>
              <select id="session-type" value={type} onChange={(e) => setType(e.target.value)} className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none backdrop-blur-sm cursor-pointer">
                {SESSION_TYPES.map((t) => <option key={t} value={t} className="bg-slate-800 text-white">{t}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="class-level" className="block text-white font-semibold mb-2 text-sm sm:text-base">Class Level</label>
              <select id="class-level" value={level} onChange={(e) => setLevel(e.target.value)} className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none backdrop-blur-sm cursor-pointer">
                {CLASS_LEVELS.map((l) => <option key={l} value={l} className="bg-slate-800 text-white">{l}</option>)}
              </select>
            </div>
            <div className="pt-4">
              <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl shadow-2xl transform transition-all duration-300 hover:scale-[1.02] hover:shadow-blue-500/50 border-2 border-white/20 backdrop-blur-sm">
                <span className="text-lg">{isSubmitting ? "Saving..." : "Log Session"}</span>
              </button>
            </div>
          </form>
        </div>
        <div className="mt-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 text-center hover:bg-white/10 transition-colors duration-200">
          <p className="text-white/60 text-xs sm:text-sm">💡 Tip: Each logged session increases your avatar progress</p>
        </div>
      </div>
    </div>
  );
}
