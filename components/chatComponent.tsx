"use client";
import { useEffect, useState, useRef } from "react";
import { EVENTS } from "@/websocket/events";
import { msg_ } from "@/websocket/listeners";
type Props = {
  socket: any;
  sessionId: string;
  username: string;
};
export default function ChatComponent({ socket, sessionId, username }: Props) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<msg_[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!socket) return;
    const handler = (msg: msg_) => {
      setMessages((prev) => [...prev, msg]);
    };
    socket.on(EVENTS.RECEIVE_MESSAGE, handler);
    return () => {
      socket.off(EVENTS.RECEIVE_MESSAGE, handler);
    };
  }, [socket]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const sendMessage = () => {
    if (!message.trim()) return;
    socket.emit(EVENTS.SEND_MESSAGE, { sessionId, username, content: message });
    setMessage("");
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };
  return (
    <div className="flex flex-col h-full gap-3">
      {/* Message list */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1.5 pr-1">
        {messages.length === 0 && (
          <p className="text-white/20 text-xs font-mono text-center py-6">
            No messages yet
          </p>
        )}
        {messages.map((m, i) => {
          const isServer = m.username === "server";
          const isMe = m.username === username;
          return (
            <div
              key={i}
              className={`flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}
            >
              {!isServer && (
                <span className="text-white/20 font-mono text-[10px] px-1">
                  {m.username}
                </span>
              )}
              <div
                className={`px-3 py-1.5 rounded-xl text-sm max-w-[85%] ${
                  isServer
                    ? "bg-transparent text-[#B7ADCF]/60 font-mono text-xs text-center w-full border-t border-b border-[#B7ADCF]/10 rounded-none py-1"
                    : isMe
                      ? "bg-[#B7ADCF]/20 text-white/80"
                      : "bg-[#1a1a1b] text-white/60"
                }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      {/* Input row */}
      <div className="flex items-center gap-2 shrink-0">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          className="flex-1 bg-[#1a1a1b] text-white/80 placeholder-white/20 font-mono text-sm px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#B7ADCF]/50 transition-colors"
        />
        <button
          onClick={sendMessage}
          disabled={!message.trim()}
          className="bg-[#B7ADCF] text-[#2e2640] text-sm font-bold px-4 py-2 rounded-xl hover:bg-white transition-colors duration-150 active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
        >
          ↑
        </button>
      </div>
    </div>
  );
}
