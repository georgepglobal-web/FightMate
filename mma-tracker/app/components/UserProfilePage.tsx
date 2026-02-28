"use client";

import { useState, useEffect } from "react";
import { usePage } from "../contexts/PageContext";
import AvatarImage from "./AvatarImage";
import { db, type DbSession } from "@/lib/data";
import type { MemberRanking } from "@/lib/constants";

export default function UserProfilePage({ selectedUserId, groupMembers, username }: { selectedUserId: string | null; groupMembers: MemberRanking[]; username: string | null }) {
  const { setCurrentPage: setPage } = usePage();
  const [profileSessions, setProfileSessions] = useState<DbSession[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);

  const profileMember = groupMembers.find((m) => m.userId === selectedUserId) || null;

  useEffect(() => {
    if (!selectedUserId) return;
    setProfileSessions(db.getSessions(selectedUserId));
    setProfileLoading(false);
  }, [selectedUserId]);

  const avatarLevel = profileMember?.avatarLevel || "Novice";

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-8 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-black dark:via-purple-950 dark:to-black">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 mt-8 sm:mt-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 drop-shadow-lg">Fighter Profile</h2>
          <p className="text-white/70 text-sm sm:text-base">View training history and achievements</p>
        </div>
        {!username && (
          <div className="mb-6 p-4 rounded-lg bg-yellow-600/20 text-yellow-200">
            You&apos;re browsing profiles anonymously. Pick a username on the home screen to start interacting.
          </div>
        )}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            <AvatarImage level={avatarLevel} size="md" fullImage={true} />
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">{profileMember?.name || "Loading..."}</h3>
              <p className="text-blue-300 text-lg mb-4">{avatarLevel} Fighter</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white/10 rounded-lg p-3"><p className="text-white/70 text-xs sm:text-sm">Total Score</p><p className="text-white font-bold text-lg sm:text-xl">{(profileMember?.score || 0).toFixed(1)}</p></div>
                <div className="bg-white/10 rounded-lg p-3"><p className="text-white/70 text-xs sm:text-sm">Sessions</p><p className="text-white font-bold text-lg sm:text-xl">{profileSessions.length}</p></div>
                <div className="bg-white/10 rounded-lg p-3"><p className="text-white/70 text-xs sm:text-sm">Badges</p><p className="text-white font-bold text-lg sm:text-xl">{profileMember?.badges.length || 0}</p></div>
              </div>
              {profileMember?.badges && profileMember.badges.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {profileMember.badges.map((badge) => (
                    <span key={badge} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 text-black shadow-md border border-yellow-300/50">{badge}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-white/10"><h4 className="text-xl sm:text-2xl font-bold text-white">Session History</h4></div>
          {profileLoading ? (
            <div className="p-8 text-center"><p className="text-white/60">Loading sessions...</p></div>
          ) : profileSessions.length === 0 ? (
            <div className="p-8 text-center"><p className="text-white/60">No sessions logged yet.</p></div>
          ) : (
            <div className="divide-y divide-white/10">
              {profileSessions.map((session) => (
                <div key={session.id} className="px-6 sm:px-8 py-4 sm:py-5 hover:bg-white/10 transition-colors duration-150">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div><p className="text-white font-semibold">{session.type}</p><p className="text-white/70 text-sm">{session.level} &bull; {session.date}</p></div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">+{session.points.toFixed(1)} pts</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => setPage("ranking")} className="mt-6 w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white font-semibold rounded-xl transition-all duration-200 border border-white/10">← Back to Rankings</button>
      </div>
    </div>
  );
}
