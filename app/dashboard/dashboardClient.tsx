"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import Lobby from "@/components/serverComponent";
import { SignOutButton } from "@clerk/nextjs";

export default function DashboardClient() {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const [sessionId, setSessionId] = useState("");
  const [username, setUsername] = useState("");

  const joinSession = () => {
    console.log("🔍 socket:", socket);
    console.log("🔍 sessionId:", sessionId);
    console.log("🔍 username:", username);
    console.log("🔍 isConnected:", isConnected);

    if (!socket || !sessionId || !username) {
      console.log("❌ blocked — missing:", { socket: !!socket, sessionId, username });
      return;
    }

    console.log("📡 joining session:", sessionId);
    sessionStorage.setItem("username", username);
    socket.emit("join_session", { sessionId, username });
    router.push(`/session/${sessionId}`);
  };

  return (
    <div className="p-4">
      <Lobby
        sessionId={sessionId}
        username={username}
        setSessionId={setSessionId}
        setUsername={setUsername}
        joinSession={joinSession}
        isConnected={isConnected}
      />
      <SignOutButton redirectUrl="/sign-in">
        <button>Log out</button>
      </SignOutButton>
    </div>
  );
}
