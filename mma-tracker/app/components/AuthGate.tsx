"use client";

import React, { useEffect } from "react";
import LoginScreen from "./LoginScreen";
import { db } from "../../lib/data";

const isSupabase = process.env.NEXT_PUBLIC_DATA_PROVIDER === "supabase";

export default function AuthGate({
  userId, setUserId, authLoading, setAuthLoading, children,
}: {
  userId: string;
  setUserId: React.Dispatch<React.SetStateAction<string>>;
  authLoading: boolean;
  setAuthLoading: React.Dispatch<React.SetStateAction<boolean>>;
  children: React.ReactNode;
}) {
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
        // Ensure local cache has user
        const existing = db.getUser();
        if (!existing || existing.id !== uid) {
          db.setUser({ id: uid, username: session.user.email?.split("@")[0] || "fighter" });
        }
        setUserId(uid);
      }
      setAuthLoading(false);

      // Listen for auth changes (sign in/out from other tabs)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUserId(session.user.id);
        } else {
          setUserId("");
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

  return <>{children}</>;
}
