"use client";

import { useState, useEffect, useCallback } from "react";
import { db, type SparringSession as SparringSessionType } from "@/lib/data";
import ConfirmDialog from "./ConfirmDialog";

interface SparringSessionProps {
  userId: string;
  username: string | null;
}

export default function SparringSessions({ userId, username }: SparringSessionProps) {
  const [sparringSessions, setSparringSessions] = useState<SparringSessionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const fetchSessions = useCallback(() => {
    setSparringSessions(db.getSparringSessions());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSessions();
    return db.subscribe(db.KEYS.SPARRING, fetchSessions);
  }, [fetchSessions]);

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) { setError("Set a username first."); return; }
    if (!date || !time || !location) { setError("Please fill in all required fields"); return; }
    setError("");

    setIsSubmitting(true);
    db.addSparringSession({ creator_id: userId, opponent_id: null, date, time, location, notes: notes || null, status: "open" });
    db.addShoutboxMessage({ user_id: userId, type: "system", content: `${username} is looking for a sparring partner on ${date}! 🥊` });
    setDate(""); setTime(""); setLocation(""); setNotes("");
    setIsSubmitting(false);
  };

  const handleAcceptSession = (sessionId: string) => {
    if (!username) { setError("Set a username first."); return; }
    db.updateSparringSession(sessionId, { opponent_id: userId, status: "accepted" });
  };

  const handleCancelSession = (sessionId: string) => {
    db.updateSparringSession(sessionId, { status: "cancelled" });
    setPendingCancelId(null);
  };

  const openSessions = sparringSessions.filter((s) => s.status === "open");
  const userSessions = sparringSessions.filter((s) => s.creator_id === userId || s.opponent_id === userId);
  const acceptedSessions = userSessions.filter((s) => s.status === "accepted");

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-8 bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 dark:from-black dark:via-red-950 dark:to-black">
      {pendingCancelId && (
        <ConfirmDialog
          message="Cancel this sparring request?"
          onConfirm={() => handleCancelSession(pendingCancelId)}
          onCancel={() => setPendingCancelId(null)}
        />
      )}
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 mt-8 sm:mt-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 drop-shadow-lg">Sparring Sessions</h2>
          <p className="text-white/70 text-sm sm:text-base">Find training partners for sparring</p>
        </div>
        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
        {!username && (
          <div className="mb-6 p-4 rounded-lg bg-yellow-600/20 text-yellow-200">
            You haven&apos;t chosen a username yet – browse requests, but set a username to create or accept one.
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-6 sm:p-8 mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-6">Create Sparring Request</h3>
          <form onSubmit={handleCreateSession} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="sparring-date" className="block text-white font-semibold mb-2 text-sm">Date *</label>
                <input type="date" id="sparring-date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500" style={{ colorScheme: "dark" }} />
              </div>
              <div>
                <label htmlFor="sparring-time" className="block text-white font-semibold mb-2 text-sm">Time *</label>
                <input type="time" id="sparring-time" value={time} onChange={(e) => setTime(e.target.value)} required className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500" style={{ colorScheme: "dark" }} />
              </div>
            </div>
            <div>
              <label htmlFor="sparring-location" className="block text-white font-semibold mb-2 text-sm">Location/Gym *</label>
              <input type="text" id="sparring-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Downtown Boxing Gym" required className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label htmlFor="sparring-notes" className="block text-white font-semibold mb-2 text-sm">Notes (Optional)</label>
              <textarea id="sparring-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g., Beginner-friendly, focus on footwork..." rows={3} className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl shadow-2xl transition-all duration-300 hover:scale-[1.02] border-2 border-white/20">
              {isSubmitting ? "Creating..." : "Create Request"}
            </button>
          </form>
        </div>

        {acceptedSessions.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-6 sm:p-8 mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">My Upcoming Sparring Sessions</h3>
            <div className="space-y-3">
              {acceptedSessions.map((session) => (
                <div key={session.id} className="bg-white/5 rounded-lg p-4 border border-green-500/30">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-white font-semibold">{session.location}</p>
                      <p className="text-white/70 text-sm">{session.date} at {session.time}</p>
                      {session.notes && <p className="text-white/60 text-sm mt-1 italic">{session.notes}</p>}
                    </div>
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-500/20 text-green-300 border border-green-400/30 whitespace-nowrap">✓ Confirmed</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-white/10">
            <h3 className="text-xl sm:text-2xl font-bold text-white">Available Sparring Requests</h3>
          </div>
          {loading ? (
            <div className="p-8 text-center"><p className="text-white/60">Loading sessions...</p></div>
          ) : openSessions.length === 0 ? (
            <div className="p-8 text-center"><p className="text-white/60">No open sparring requests. Be the first to create one!</p></div>
          ) : (
            <div className="divide-y divide-white/10">
              {openSessions.map((session) => {
                const isMySession = session.creator_id === userId;
                return (
                  <div key={session.id} className="px-6 sm:px-8 py-5 sm:py-6 hover:bg-white/10 transition-colors duration-150">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-white font-semibold text-lg">{session.location}</p>
                        <p className="text-white/70 text-sm">📅 {session.date} at {session.time}</p>
                        {session.notes && <p className="text-white/60 text-sm mt-2 italic">&quot;{session.notes}&quot;</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        {isMySession ? (
                          <button onClick={() => setPendingCancelId(session.id)} className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-400/30 rounded-lg text-sm font-semibold transition-colors">Cancel</button>
                        ) : (
                          <button onClick={() => handleAcceptSession(session.id)} className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg text-sm font-semibold transition-all hover:scale-105">Accept</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
