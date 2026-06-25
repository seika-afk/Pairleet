"use client";
import { useParams } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { useEffect, useState } from "react";
import ChatComponent from "@/components/chatComponent";
import SearchBox from "@/components/searchQuestions";
import StartSession from "@/components/startSession";

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const { socket, isConnected } = useSocket();
  const [username, setUsername] = useState("");
  const [isDenied, setIsDenied] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("username");
    if (stored) setUsername(stored);
  }, []);

  useEffect(() => {
    if (!socket || !isConnected || !username || !id) return;
    socket.emit("join_session", { sessionId: id, username });
    const handleDenied = () => setIsDenied(true);
    socket.on("join_denied", handleDenied);
    return () => {
      socket.off("join_denied", handleDenied);
    };
  }, [socket, isConnected, username, id]);

  if (!isConnected)
    return (
      <div className="min-h-screen bg-[#1a1a1b] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-[#B7ADCF] animate-pulse" />
          <p className="text-white/40 font-mono text-sm tracking-widest uppercase">
            Connecting...
          </p>
        </div>
      </div>
    );

  if (isDenied)
    return (
      <div className="min-h-screen bg-[#1a1a1b] flex items-center justify-center">
        <div className="bg-[#2e2e30] rounded-2xl p-10 flex flex-col gap-3 max-w-sm text-center">
          <p className="text-white/30 font-mono text-xs tracking-widest uppercase">
            Access denied
          </p>
          <p className="text-white font-black text-2xl leading-tight">
            Session already started
          </p>
          <p className="text-white/50 text-sm">
            The host has already begun this session. Try joining before it
            starts next time.
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#1a1a1b] p-3 flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          <p className="text-white/30 font-mono text-xs tracking-widest uppercase">
            Session
          </p>
          <span className="text-white/20 font-mono text-xs">/</span>
          <p className="text-white/60 font-mono text-xs tracking-widest">
            {id}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-white/40 font-mono text-xs">
            {username || "anonymous"}
          </p>
        </div>
      </div>

      {/* Bento grid */}
      <div
        className="flex-1 grid gap-3"
        style={{
          gridTemplateColumns: "1fr 1fr 1fr",
          gridTemplateRows: "auto 1fr",
        }}
      >
        <div className="col-span-2 row-span-1 bg-[#2e2e30] rounded-2xl p-6 flex flex-col gap-4">
          <p className="text-white/30 font-mono text-xs tracking-widest uppercase m-0">
            Problem queue
          </p>
          <SearchBox />
        </div>

        {/* Start session — right col, top */}
        <div className="col-span-1 row-span-1 bg-[#B7ADCF]/10 border border-[#B7ADCF]/20 rounded-2xl p-6 flex flex-col justify-between">
          <p className="text-[#B7ADCF]/60 font-mono text-xs tracking-widest uppercase m-0">
            Controls
          </p>
          <StartSession />
        </div>

        <div className="col-span-1 row-span-1 bg-[#2e2e30] rounded-2xl p-6 flex flex-col gap-3 min-h-[340px]">
          <p className="text-white/30 font-mono text-xs tracking-widest uppercase m-0">
            Chat
          </p>
          <div className="flex-1">
            <ChatComponent socket={socket} sessionId={id} username={username} />
          </div>
        </div>

        <div className="col-span-1 row-span-1 bg-[#2e2e30] rounded-2xl p-6 flex flex-col gap-4 min-h-[340px]">
          <p className="text-white/30 font-mono text-xs tracking-widest uppercase m-0">
            In this session
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 py-2 border-b border-white/5">
              <span className="text-white/80 text-sm font-mono">
                {username || "you"}
              </span>
              <span className="ml-auto text-white/20 text-xs font-mono">
                host
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
