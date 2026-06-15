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

    const handleDenied = () => {
      setIsDenied(true);
    };

    socket.on("join_denied", handleDenied);

    return () => {
      socket.off("join_denied", handleDenied);
    };
  }, [socket, isConnected, username, id]);

  if (!isConnected) return <div>Connecting...</div>;
  if (isDenied) return <div>Server has already started</div>;

  return (
    <div>
      <div className="border-2 border-black">
        <SearchBox />
      </div>
      <div className="border-2 hover:bg-green-100 border-black">
        {" "}
        <StartSession />
      </div>

      <ChatComponent socket={socket} sessionId={id} username={username} />
    </div>
  );
}
