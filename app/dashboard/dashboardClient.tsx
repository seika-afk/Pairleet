"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import Lobby from "@/components/serverComponent";
import { SignOutButton } from "@clerk/nextjs";

export default function DashboardClient() {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const [sessionId, setSessionId] = useState("");
  const [username, setUsername] = useState("");
  const [joinDenied, setJoinDenied] = useState(false);
  useEffect(() => {
    if (!socket) return;

    const handleJoinDenied = (msg: string) => {
      setJoinDenied(true);
    };

    socket.on("join_denied", handleJoinDenied);

    return () => {
      socket.off("join_denied", handleJoinDenied);
    };
  }, [socket]);
  const joinSession = () => {
    if (!socket || !sessionId || !username) {
      console.log("❌ blocked — missing:", {
        socket: !!socket,
        sessionId,
        username,
      });
      return;
    }

    sessionStorage.setItem("username", username);
    socket.emit("join_session", { sessionId, username });
    router.push(`/session/${sessionId}`);
  };
  if (joinDenied) {
    return <div>Session has already started</div>;
  }
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
