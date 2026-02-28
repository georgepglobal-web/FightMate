"use client";

import React, { useEffect } from "react";
import LoginScreen from "./LoginScreen";
import { db } from "../../lib/data";

export default function AuthGate({
  userId,
  setUserId,
  authLoading,
  setAuthLoading,
  children,
}: {
  userId: string;
  setUserId: React.Dispatch<React.SetStateAction<string>>;
  authLoading: boolean;
  setAuthLoading: React.Dispatch<React.SetStateAction<boolean>>;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const user = db.getUser();
    if (user) {
      setUserId(user.id);
    }
    setAuthLoading(false);
  }, [setUserId, setAuthLoading]);

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-black dark:via-purple-950 dark:to-black">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!userId) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}
