"use client";

import { useApp } from "../contexts/AppContext";
import AuthGate from "./AuthGate";
import Header from "./Header";
import ChatFAB from "./ChatFAB";
import ChatOverlay from "./ChatOverlay";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { userId, setUserId, authLoading, setAuthLoading, dataReady, handleSignOut, isChatOpen, setIsChatOpen, unreadCount, username } = useApp();

  return (
    <AuthGate userId={userId} setUserId={setUserId} authLoading={authLoading} setAuthLoading={setAuthLoading}>
      <>
        <Header onSignOut={handleSignOut} />
        <ChatFAB unreadCount={unreadCount} onClick={() => setIsChatOpen((v) => !v)} />
        {dataReady ? children : (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}
        {isChatOpen && <ChatOverlay onClose={() => setIsChatOpen(false)} userId={userId} username={username} />}
      </>
    </AuthGate>
  );
}
