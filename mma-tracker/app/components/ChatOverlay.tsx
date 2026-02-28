"use client";

import Shoutbox from "./Shoutbox";

export default function ChatOverlay({ onClose, userId, username }: { onClose: () => void; userId: string; username: string | null }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full sm:w-[420px] max-h-[80vh] m-4 sm:m-6 bg-slate-900/95 rounded-t-xl sm:rounded-xl shadow-2xl border border-white/10 overflow-hidden backdrop-blur-md">
        <div className="flex items-center justify-between p-3 border-b border-white/10">
          <h3 className="text-white font-bold">Chat</h3>
          <button onClick={onClose} aria-label="Close chat" className="text-white/80 hover:text-white px-2 py-1 rounded-md">✕</button>
        </div>
        <div className="h-[64vh] overflow-auto">
          <Shoutbox userId={userId} username={username} />
        </div>
      </div>
    </div>
  );
}
