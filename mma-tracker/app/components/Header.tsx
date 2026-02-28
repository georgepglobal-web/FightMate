"use client";

import { usePage } from "../contexts/PageContext";
import { APP_VERSION } from "@/lib/constants";

export default function Header({ onSignOut }: { onSignOut: () => void }) {
  const { currentPage: page, setCurrentPage: setPage } = usePage();

  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
        <div
          onClick={() => setPage("home")}
          className="flex items-center gap-3 cursor-pointer text-white font-bold hover:text-blue-400 transition-colors duration-150"
          aria-label="Go home"
          role="button"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6" />
          </svg>
          <span>FightMate</span>
        </div>
        <div className="flex items-center gap-2">
          {page !== "home" && (
            <button onClick={() => setPage("home")} className="text-white/80 hover:text-white bg-white/0 px-3 py-1 rounded-md border border-white/10" aria-label="Back to home">Back</button>
          )}
          <button onClick={onSignOut} className="text-white/80 hover:text-white bg-white/0 px-3 py-1 rounded-md border border-white/10" aria-label="Sign out">Sign Out</button>
          <span className="text-xs text-white/50 ml-4">v{APP_VERSION}</span>
        </div>
      </div>
    </header>
  );
}
