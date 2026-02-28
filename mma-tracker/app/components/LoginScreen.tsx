"use client";

import React, { useState } from "react";
import { db } from "../../lib/data";

const isSupabase = process.env.NEXT_PUBLIC_DATA_PROVIDER === "supabase";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) return;
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(trimmed)) {
      setError("Username must be 3-20 characters: letters, numbers, underscores, or hyphens");
      return;
    }
    db.setUser({ id: crypto.randomUUID(), username: trimmed });
    window.location.reload();
  };

  const handleSupabaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { supabase } = await import("../../lib/supabase");
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) { setError(error.message); return; }
        setError("Check your email for a confirmation link.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setError(error.message); return; }
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isSupabase) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-black dark:via-purple-950 dark:to-black">
        <div className="w-full max-w-md p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to FightMate 🥊</h2>
          <p className="text-white/70 text-sm mb-4">Choose a username to get started.</p>
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <form onSubmit={handleLocalSubmit} className="space-y-4">
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username (3-20 characters)" maxLength={20} autoFocus className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60" />
            <p className="text-white/50 text-xs">Letters, numbers, underscores, or hyphens only</p>
            <button type="submit" disabled={!username.trim()} className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl">Get Started</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-black dark:via-purple-950 dark:to-black">
      <div className="w-full max-w-md p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to FightMate 🥊</h2>
        <p className="text-white/70 text-sm mb-4">{isSignUp ? "Create an account" : "Sign in to continue"}</p>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <form onSubmit={handleSupabaseSubmit} className="space-y-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoFocus className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" minLength={6} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60" />
          <button type="submit" disabled={loading || !email || !password} className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl">
            {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>
        <button onClick={() => { setIsSignUp(!isSignUp); setError(""); }} className="mt-4 text-white/60 hover:text-white text-sm w-full text-center">
          {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
