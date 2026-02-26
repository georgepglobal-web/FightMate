"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, type SparringSession as DbSparringSession } from "@/lib/supabase";

interface SparringSessionProps {
  userId: string;
  username: string | null;
}

export default function SparringSessions({ userId, username }: SparringSessionProps) {
  const [sparringSessions, setSparringSessions] = useState<DbSparringSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch sparring sessions
  const fetchSessions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("sparring_sessions")
        .select("*")
        .order("date", { ascending: true });

      if (error) {
        console.error("[SparringSessions] Error fetching:", error);
        setSparringSessions([]);
      } else {
        setSparringSessions(data || []);
      }
    } catch (e) {
      console.error("[SparringSessions] Error:", e);
      setSparringSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();

    // Subscribe to changes
    const subscription = supabase
      .channel("sparring-sessions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sparring_sessions",
        },
        () => {
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchSessions]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !time || !location) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const newSession: DbSparringSession = {
        creator_id: userId,
        opponent_id: null,
        date,
        time,
        location,
        notes: notes || null,
        status: "open",
      };

      const { data: insertedSession, error: insertError } = await supabase
        .from("sparring_sessions")
        .insert(newSession)
        .select()
        .single();

      if (insertError) {
        console.error("[SparringSessions] Error creating session:", insertError);
        alert("Failed to create sparring request");
        return;
      }

      // Insert system message to shoutbox
      const displayName = username || "Fighter";
      const systemMessage = `${displayName} is looking for a sparring partner on ${date}! 🥊`;

      await supabase.from("shoutbox_messages").insert({
        user_id: userId,
        type: "system",
        content: systemMessage,
      });

      // Reset form
      setDate("");
      setTime("");
      setLocation("");
      setNotes("");

      // Refresh sessions
      await fetchSessions();

      alert("Sparring request created successfully!");
    } catch (err) {
      console.error("[SparringSessions] Error:", err);
      alert("Failed to create sparring request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from("sparring_sessions")
        .update({
          opponent_id: userId,
          status: "accepted",
        })
        .eq("id", sessionId);

      if (error) {
        console.error("[SparringSessions] Error accepting:", error);
        alert("Failed to accept sparring request");
        return;
      }

      // Refresh sessions
      await fetchSessions();

      alert("Sparring request accepted!");
    } catch (err) {
      console.error("[SparringSessions] Error:", err);
      alert("Failed to accept sparring request");
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    if (!confirm("Cancel this sparring request?")) return;

    try {
      const { error } = await supabase
        .from("sparring_sessions")
        .update({ status: "cancelled" })
        .eq("id", sessionId);

      if (error) {
        console.error("[SparringSessions] Error cancelling:", error);
        alert("Failed to cancel sparring request");
        return;
      }

      await fetchSessions();
    } catch (err) {
      console.error("[SparringSessions] Error:", err);
      alert("Failed to cancel sparring request");
    }
  };

  // Separate sessions into categories
  const openSessions = sparringSessions.filter(s => s.status === "open");
  const userSessions = sparringSessions.filter(
    s => s.creator_id === userId || s.opponent_id === userId
  );
  const acceptedSessions = userSessions.filter(s => s.status === "accepted");

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-8 bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 dark:from-black dark:via-red-950 dark:to-black">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 mt-8 sm:mt-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 drop-shadow-lg">Sparring Sessions</h2>
          <p className="text-white/70 text-sm sm:text-base">Find training partners for sparring</p>
        </div>

        {/* Create New Session Form */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-6 sm:p-8 mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-6">Create Sparring Request</h3>

          <form onSubmit={handleCreateSession} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="sparring-date" className="block text-white font-semibold mb-2 text-sm sm:text-base">
                  Date *
                </label>
                <input
                  type="date"
                  id="sparring-date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm text-sm sm:text-base"
                  style={{ colorScheme: "dark" }}
                />
              </div>

              <div>
                <label htmlFor="sparring-time" className="block text-white font-semibold mb-2 text-sm sm:text-base">
                  Time *
                </label>
                <input
                  type="time"
                  id="sparring-time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm text-sm sm:text-base"
                  style={{ colorScheme: "dark" }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="sparring-location" className="block text-white font-semibold mb-2 text-sm sm:text-base">
                Location/Gym *
              </label>
              <input
                type="text"
                id="sparring-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Downtown Boxing Gym"
                required
                className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm text-sm sm:text-base"
              />
            </div>

            <div>
              <label htmlFor="sparring-notes" className="block text-white font-semibold mb-2 text-sm sm:text-base">
                Notes (Optional)
              </label>
              <textarea
                id="sparring-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Beginner-friendly, focus on footwork..."
                rows={3}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm text-sm sm:text-base resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full group relative overflow-hidden bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl shadow-2xl transform transition-all duration-300 hover:scale-[1.02] hover:shadow-red-500/50 border-2 border-white/20 backdrop-blur-sm"
            >
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
              <div className="relative flex items-center justify-center gap-2">
                <span className="text-lg">{isSubmitting ? "Creating..." : "Create Request"}</span>
              </div>
            </button>
          </form>
        </div>

        {/* Accepted Sessions */}
        {acceptedSessions.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-6 sm:p-8 mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">My Upcoming Sparring Sessions</h3>
            <div className="space-y-3">
              {acceptedSessions.map((session) => {
                const isCreator = session.creator_id === userId;
                const opponent = isCreator ? "Your Opponent" : "Opponent";
                return (
                  <div key={session.id} className="bg-white/5 rounded-lg p-4 border border-green-500/30">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="text-white font-semibold">{session.location}</p>
                        <p className="text-white/70 text-sm">{session.date} at {session.time}</p>
                        {session.notes && <p className="text-white/60 text-sm mt-1 italic">{session.notes}</p>}
                      </div>
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-500/20 text-green-300 border border-green-400/30 whitespace-nowrap">
                        ✓ Confirmed
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Open Sessions */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-white/10">
            <h3 className="text-xl sm:text-2xl font-bold text-white">Available Sparring Requests</h3>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <p className="text-white/60">Loading sessions...</p>
            </div>
          ) : openSessions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-white/60">No open sparring requests. Be the first to create one!</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {openSessions.map((session) => {
                const isMySession = session.creator_id === userId;
                const creatorMember = null; // You could fetch creator name if needed

                return (
                  <div
                    key={session.id}
                    className="px-6 sm:px-8 py-5 sm:py-6 hover:bg-white/10 transition-colors duration-150"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-white font-semibold text-lg">{session.location}</p>
                        <p className="text-white/70 text-sm">📅 {session.date} at {session.time}</p>
                        {session.notes && <p className="text-white/60 text-sm mt-2 italic">"{session.notes}"</p>}
                      </div>

                      <div className="flex items-center gap-3">
                        {isMySession ? (
                          <button
                            onClick={() => handleCancelSession(session.id || "")}
                            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-400/30 rounded-lg text-sm font-semibold transition-colors duration-200"
                          >
                            Cancel
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAcceptSession(session.id || "")}
                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105"
                          >
                            Accept
                          </button>
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
