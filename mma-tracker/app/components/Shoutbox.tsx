"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { db, type ShoutboxMessage } from "../../lib/data";

interface ShoutboxMessageWithName extends ShoutboxMessage {
  displayName: string;
}

interface ShoutboxProps {
  userId: string;
  username: string | null;
  onNewMessages?: (messages: ShoutboxMessageWithName[]) => void;
}

export default function Shoutbox({ userId, username, onNewMessages }: ShoutboxProps) {
  const [messages, setMessages] = useState<ShoutboxMessageWithName[]>([]);
  const [input, setInput] = useState("");
  const [posting, setPosting] = useState(false);
  const lastPostTsRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const onNewMessagesRef = useRef(onNewMessages);
  onNewMessagesRef.current = onNewMessages;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const timeAgo = (iso: string) => {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  };

  const fetchMessages = useCallback(() => {
    const raw = db.getShoutboxMessages(30);
    const mapped: ShoutboxMessageWithName[] = raw.map((m) => ({
      ...m,
      displayName: db.getMemberUsername(m.user_id) || (m.user_id === userId ? username || "You" : "Anonymous"),
    }));
    setMessages(mapped);
    onNewMessagesRef.current?.(mapped);
  }, [userId, username]);

  useEffect(() => {
    fetchMessages();
    const unsub = db.subscribe(db.KEYS.SHOUTBOX, fetchMessages);
    return unsub;
  }, [fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const postMessage = () => {
    if (!userId) return alert("You must be signed in to post");
    const trimmed = input.trim();
    if (!trimmed) return;
    if (trimmed.length > 200) return alert("Message must be 200 characters or less");
    const t = Date.now();
    if (t - lastPostTsRef.current < 10000) return alert("Rate limit: 1 message per 10 seconds");
    lastPostTsRef.current = t;

    setPosting(true);
    db.addShoutboxMessage({ user_id: userId, type: "user", content: trimmed });
    setInput("");
    setPosting(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow p-4">
        <h3 className="text-white font-bold mb-3">Activity</h3>

        <div className="max-h-72 overflow-auto divide-y divide-white/10 mb-3">
          {messages.length === 0 ? (
            <div className="text-white/60 p-3">No messages yet.</div>
          ) : (
            [...messages].reverse().map((m) => (
              <div key={m.id} className="p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="text-white font-semibold text-sm">{m.displayName}</div>
                    <div className="text-white/90 text-sm">{m.content}</div>
                  </div>
                  <div className="text-white/50 text-xs whitespace-nowrap">{timeAgo(m.created_at)}</div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="mt-2">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Say something..."
              maxLength={200}
              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            />
            <button
              onClick={postMessage}
              disabled={posting}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-lg"
            >
              {posting ? "Posting…" : "Send"}
            </button>
          </div>
          <div className="text-white/50 text-xs mt-2">Max 200 characters — 1 message per 10s</div>
        </div>
      </div>
    </div>
  );
}
