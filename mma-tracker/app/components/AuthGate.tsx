"use client";

import React, { useEffect, useState } from "react";
import LoginScreen from "./LoginScreen";
import { db } from "../../lib/data";

const isSupabase = process.env.NEXT_PUBLIC_DATA_PROVIDER === "supabase";

function UsernamePrompt({ userId, onComplete }: { userId: string; onComplete: () => void }) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) return;
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(trimmed)) {
      setError("3-20 characters: letters, numbers, underscores, or hyphens");
      return;
    }
    db.setUser({ id: userId, username: trimmed });
    onComplete();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-black dark:via-purple-950 dark:to-black">
      <div className="w-full max-w-md p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-2">Choose a Username 🥊</h2>
        <p className="text-white/70 text-sm mb-4">Pick a display name for the leaderboard.</p>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username (3-20 characters)" maxLength={20} autoFocus className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60" data-testid="username-input" />
          <button type="submit" disabled={!username.trim()} className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl">Continue</button>
        </form>
      </div>
    </div>
  );
}

export default function AuthGate({
  userId, setUserId, authLoading, setAuthLoading, children,
}: {
  userId: string;
  setUserId: React.Dispatch<React.SetStateAction<string>>;
  authLoading: boolean;
  setAuthLoading: React.Dispatch<React.SetStateAction<boolean>>;
  children: React.ReactNode;
}) {
  const [needsUsername, setNeedsUsername] = useState(false);

  useEffect(() => {
    if (!isSupabase) {
      const user = db.getUser();
      if (user) setUserId(user.id);
      setAuthLoading(false);
      return;
    }

    // Supabase auth: check session
    let mounted = true;
    (async () => {
      const { supabase } = await import("../../lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (session?.user) {
        const uid = session.user.id;
        const existing = db.getUser();
        if (existing && existing.id === uid && existing.username) {
          setUserId(uid);
        } else {
          // Check if username exists in Supabase group_members
          const { data: member } = await supabase.from("group_members").select("username").eq("user_id", uid).maybeSingle();
          if (member?.username) {
            db.setUser({ id: uid, username: member.username });
            setUserId(uid);
          } else {
            setUserId(uid);
            setNeedsUsername(true);
          }
        }
      }
      setAuthLoading(false);

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
        if (sess?.user) {
          setUserId(sess.user.id);
          // Username check handled by initial load above
        } else {
          setUserId("");
          setNeedsUsername(false);
        }
      });
      return () => { subscription.unsubscribe(); };
    })();
    return () => { mounted = false; };
  }, [setUserId, setAuthLoading]);

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-black dark:via-purple-950 dark:to-black">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!userId) return <LoginScreen />;

  if (isSupabase && needsUsername) {
    return <UsernamePrompt userId={userId} onComplete={() => {
      setNeedsUsername(false);
      window.location.reload();
    }} />;
  }

  return <>{children}</>;
}
