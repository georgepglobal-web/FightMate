"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import AvatarImage from "./AvatarImage";
import type { MemberRanking } from "@/lib/constants";

interface GroupRankingPageProps {
  groupMembers: MemberRanking[];
  userId: string;
  username: string | null;
  currentUserScore: number;
  currentUserBadges: string[];
  onSelectUser: (userId: string) => void;
}

export default function GroupRankingPage({ groupMembers, userId, username, currentUserScore, currentUserBadges, onSelectUser }: GroupRankingPageProps) {
  const router = useRouter();

  const sortedMembers = useMemo(() => {
    const updated = groupMembers.map((m) =>
      m.userId === userId ? { ...m, score: currentUserScore, badges: currentUserBadges, isCurrentUser: true, name: username || "You" } : m
    );
    if (!updated.some((m) => m.userId === userId) && userId) {
      updated.push({ userId, name: username || "You", score: currentUserScore, badges: currentUserBadges, isCurrentUser: true });
    }
    return updated.filter((m) => m.isCurrentUser || (m.name && m.name !== "Anonymous Fighter")).sort((a, b) => b.score - a.score);
  }, [groupMembers, userId, currentUserScore, currentUserBadges, username]);

  const getRankIcon = (i: number) => {
    if (i === 0) return "🥇";
    if (i === 1) return "🥈";
    if (i === 2) return "🥉";
    const rank = i + 1;
    const suffix = [, "st", "nd", "rd"][rank % 10 > 3 || [11,12,13].includes(rank % 100) ? 0 : rank % 10] || "th";
    return `${rank}${suffix}`;
  };
  const getRankColor = (i: number) => i === 0 ? "from-yellow-400 to-yellow-600" : i === 1 ? "from-gray-300 to-gray-500" : i === 2 ? "from-orange-400 to-orange-600" : "from-blue-400 to-blue-600";

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-8 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-black dark:via-purple-950 dark:to-black">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 mt-8 sm:mt-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 drop-shadow-lg">Group Ranking</h2>
          <p className="text-white/70 text-sm sm:text-base">Compete with your training group</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
          {sortedMembers.length === 0 ? (
            <div className="p-12 text-center"><p className="text-white/60 text-lg">No members found.</p></div>
          ) : (
            <div className="divide-y divide-white/10">
              {sortedMembers.map((member, index) => (
                <div key={member.userId} onClick={() => { onSelectUser(member.userId); router.push("/profile"); }} className={`px-4 sm:px-6 py-5 sm:py-6 transition-all duration-200 hover:bg-white/10 cursor-pointer rounded-lg ${member.isCurrentUser ? "bg-blue-500/20 border-l-4 border-blue-400" : index % 2 === 0 ? "bg-white/5" : "bg-white/[0.02]"}`}>
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="flex-shrink-0 relative">
                      <AvatarImage level={member.avatarLevel || "Novice"} size="sm" fullImage={true} />
                      <div className={`absolute -bottom-2 -right-2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br ${getRankColor(index)} flex items-center justify-center text-white font-bold text-sm sm:text-lg shadow-lg border-2 border-white/30`}>{getRankIcon(index)}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                        <div>
                          <h3 className={`font-bold text-lg sm:text-xl mb-1 truncate ${member.isCurrentUser ? "text-blue-300" : "text-white"}`}>
                            {member.name}{member.isCurrentUser && <span className="ml-2 text-xs bg-blue-500/30 px-2 py-0.5 rounded-full">You</span>}
                          </h3>
                          <span className="text-white/70 text-sm sm:text-base">{member.score.toFixed(1)} points</span>
                        </div>
                        {member.badges.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {member.badges.map((badge) => (
                              <span key={badge} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 text-black shadow-md border border-yellow-300/50">{badge}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 text-center hover:bg-white/10 transition-colors duration-200">
          <p className="text-white/60 text-xs sm:text-sm">Rankings are based on training activity. Earn badges for your achievements!</p>
        </div>
      </div>
    </div>
  );
}
