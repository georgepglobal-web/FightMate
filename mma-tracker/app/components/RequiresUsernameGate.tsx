"use client";

import { usePage } from "../contexts/PageContext";

export default function RequiresUsernameGate({ username, loading, children }: { username: string | null; loading?: boolean; children: React.ReactNode }) {
  const { setCurrentPage: setPage } = usePage();

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-8 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-black dark:via-purple-950 dark:to-black">
        <div className="max-w-4xl mx-auto mt-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70 text-sm sm:text-base">Loading...</p>
        </div>
      </div>
    );
  }

  if (!username) {
    return (
      <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-8 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-black dark:via-purple-950 dark:to-black">
        <div className="max-w-4xl mx-auto mt-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Username Required</h2>
          <p className="text-white/70 mb-8 text-sm sm:text-base">Set your username in the onboarding modal to unlock this feature</p>
          <button onClick={() => setPage("home")} className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105">Back to Home</button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
