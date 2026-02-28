"use client";

import AvatarImage from "./AvatarImage";
import { AVATAR_LEVELS, LEVEL_THRESHOLDS, getLevelColor, type Avatar } from "@/lib/constants";

export default function AvatarEvolutionPage({ avatar }: { avatar: Avatar }) {
  const nextLevel = (() => {
    const idx = AVATAR_LEVELS.indexOf(avatar.level);
    return idx < AVATAR_LEVELS.length - 1 ? AVATAR_LEVELS[idx + 1] : "Max Level";
  })();

  const progressText = avatar.progress === 0 ? "Getting started" : avatar.progress === 25 ? "Making progress" : avatar.progress === 50 ? "Halfway there!" : avatar.progress === 75 ? "Almost there" : "Level up!";

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-8 bg-gradient-to-br from-slate-900 via-yellow-900 to-slate-900 dark:from-black dark:via-yellow-950 dark:to-black">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 mt-8 sm:mt-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 drop-shadow-lg">Avatar Evolution</h2>
          <p className="text-white/70 text-sm sm:text-base">Track your progress and unlock new levels</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-4 sm:p-8 md:p-10 mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 md:gap-8">
            {AVATAR_LEVELS.map((level) => {
              const isCurrent = level === avatar.level;
              const isUnlocked = avatar.cumulativePoints >= LEVEL_THRESHOLDS[level].min;
              return (
                <div key={level} className={`flex flex-col items-center transition-all duration-300 ${isCurrent ? "transform scale-105" : ""}`}>
                  <div className="relative mb-3 sm:mb-4 w-full max-w-[140px] sm:max-w-none max-h-[200px] sm:max-h-none flex justify-center items-center">
                    <div className={`w-full h-full rounded-xl overflow-hidden shadow-lg transition-all duration-300 ${isCurrent ? `ring-2 sm:ring-3 ring-offset-2 ring-offset-slate-900/50 ${level === "Novice" ? "ring-gray-400" : level === "Intermediate" ? "ring-green-400" : level === "Seasoned" ? "ring-blue-400" : "ring-purple-400"}` : isUnlocked ? "ring-1 sm:ring-2 ring-white/20" : "ring-1 sm:ring-2 ring-white/10 opacity-50"}`}>
                      <AvatarImage level={level} size="lg" showGlow={false} fullImage={true} className={`w-full h-full ${!isUnlocked ? "opacity-40 grayscale" : ""}`} />
                    </div>
                  </div>
                  <div className="text-center mt-1 sm:mt-2 w-full">
                    <p className={`font-semibold text-xs sm:text-base md:text-lg ${isCurrent ? "text-white" : isUnlocked ? "text-white/80" : "text-white/40"}`}>{level}</p>
                    {isCurrent && <p className="text-xs text-white/60 mt-1 font-medium">Current</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-6 sm:p-10">
          <div className="text-center mb-6">
            <div className="inline-block mb-4">
              <div className={`relative px-6 py-3 rounded-2xl bg-gradient-to-r ${getLevelColor(avatar.level)} shadow-lg border-2 border-white/30`}>
                <div className="absolute inset-0 bg-white/10 rounded-2xl" />
                <span className="relative text-white text-xl sm:text-2xl font-bold uppercase tracking-wide">{avatar.level} Fighter</span>
              </div>
            </div>
            {nextLevel !== "Max Level" && <p className="text-white/60 text-sm sm:text-base">Progress to {nextLevel}</p>}
          </div>
          <div className="mb-6">
            <div className="text-center mb-4"><p className="text-white font-semibold text-lg sm:text-xl">{progressText}</p></div>
            <div className="relative">
              <div className="w-full h-8 sm:h-10 bg-white/10 rounded-full overflow-hidden border border-white/20 shadow-inner backdrop-blur-sm">
                <div className={`h-full bg-gradient-to-r ${getLevelColor(avatar.level)} transition-all duration-700 ease-out rounded-full shadow-lg relative overflow-hidden`} style={{ width: `${avatar.progress}%` }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-colors duration-200">
            <p className="text-white/60 text-xs sm:text-sm text-center">💡 Each training session earns progress. Train different types weekly for bonus points!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
