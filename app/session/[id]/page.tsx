"use client";
import { useParams } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { useEffect, useState } from "react";
import ChatComponent from "@/components/chatComponent";
export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const { socket, isConnected } = useSocket();
  const [username, setUsername] = useState("");
  useEffect(() => {
    // Retrieve username from sessionStorage set during join
    const stored = sessionStorage.getItem("username");
    if (stored) setUsername(stored);
  }, []);

  if (!isConnected) return <div>Connecting...</div>;

  return <ChatComponent socket={socket} sessionId={id} username={username} />;
}
