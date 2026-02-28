"use client";

import React, { useState } from "react";
import { db } from "../../lib/data";

export default function LoginScreen() {
  const [username, setUsername] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) return;
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(trimmed)) {
      alert("Username must be 3-20 characters: letters, numbers, underscores, or hyphens");
      return;
    }
    const id = crypto.randomUUID();
    db.setUser({ id, username: trimmed });
    window.location.reload();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-black dark:via-purple-950 dark:to-black">
      <div className="w-full max-w-md p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to FightMate 🥊</h2>
        <p className="text-white/70 text-sm mb-4">Choose a username to get started.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username (3-20 characters)"
            maxLength={20}
            autoFocus
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60"
          />
          <p className="text-white/50 text-xs">Letters, numbers, underscores, or hyphens only</p>
          <button
            type="submit"
            disabled={!username.trim()}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl"
          >
            Get Started
          </button>
        </form>
      </div>
    </div>
  );
}
