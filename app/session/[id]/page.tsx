"use client";
import { useParams } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { useEffect, useState } from "react";
import ChatComponent from "@/components/chatComponent";
import SearchBox from "@/components/searchQuestions";
export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const { socket, isConnected } = useSocket();
  const [username, setUsername] = useState("");
  useEffect(() => {
    const stored = sessionStorage.getItem("username");
    if (stored) setUsername(stored);
  }, []);

  if (!isConnected) return <div>Connecting...</div>;

  return (
    <div>
      <div className="border-2 border-black">
        <SearchBox />
      </div>

      <ChatComponent socket={socket} sessionId={id} username={username} />
    </div>
  );
}
