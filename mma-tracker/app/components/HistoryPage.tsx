"use client";

import { normalizeDateToISO, parseDateUTC } from "@/lib/constants";
import type { DbSession } from "@/lib/data";

const SESSION_TYPE_COLORS: Record<string, string> = {
  Boxing: "from-red-500 to-red-600", "Muay Thai": "from-orange-500 to-orange-600",
  K1: "from-yellow-500 to-yellow-600", BJJ: "from-blue-500 to-blue-600",
  Wrestling: "from-purple-500 to-purple-600", MMA: "from-pink-500 to-pink-600",
  Takedowns: "from-cyan-500 to-cyan-600", Judo: "from-indigo-500 to-indigo-600",
  "Strength & Conditioning": "from-green-500 to-green-600",
  "Weight Training": "from-gray-500 to-gray-600", Cardio: "from-emerald-500 to-emerald-600",
};

function formatDate(dateString: string) {
  const date = parseDateUTC(normalizeDateToISO(dateString));
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function HistoryPage({ sessions, onDelete }: { sessions: DbSession[]; onDelete: (id: string) => void }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-8 bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 dark:from-black dark:via-green-950 dark:to-black">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 mt-8 sm:mt-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 drop-shadow-lg">Training History</h2>
          <p className="text-white/70 text-sm sm:text-base">{sessions.length > 0 ? `${sessions.length} session${sessions.length !== 1 ? "s" : ""} logged` : "Track your training journey"}</p>
        </div>
        {sessions.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-12 text-center">
            <p className="text-white/60 text-lg font-medium">No sessions logged yet.</p>
            <p className="text-white/40 text-sm mt-2">Start tracking your training by logging your first session!</p>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
            <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-4 bg-white/5 border-b border-white/10">
              <div className="col-span-4 text-white/70 font-semibold text-sm uppercase tracking-wide">Date</div>
              <div className="col-span-5 text-white/70 font-semibold text-sm uppercase tracking-wide">Session Type</div>
              <div className="col-span-3 text-white/70 font-semibold text-sm uppercase tracking-wide">Class Level</div>
            </div>
            <div className="divide-y divide-white/10">
              {sessions.map((session, index) => (
                <div key={session.id} className={`px-4 sm:px-6 py-4 sm:py-5 transition-all duration-200 hover:bg-white/10 rounded-lg ${index % 2 === 0 ? "bg-white/5" : "bg-white/[0.02]"}`}>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    <div className="col-span-1 sm:col-span-4">
                      <div className="text-white font-medium text-sm sm:text-base">{formatDate(session.date)}</div>
                    </div>
                    <div className="col-span-1 sm:col-span-5">
                      <div className="flex items-center gap-3">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${SESSION_TYPE_COLORS[session.type] || "from-gray-500 to-gray-600"} flex items-center justify-center shadow-lg`}>
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <span className="text-white font-medium text-sm sm:text-base truncate">{session.type}</span>
                      </div>
                    </div>
                    <div className="col-span-1 sm:col-span-3">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/20">{session.level}</span>
                        <button onClick={() => onDelete(session.id)} className="ml-2 p-2 text-white/60 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors duration-200" aria-label="Delete session">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
