"use client";
import { useSocket } from "@/hooks/useSocket";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function StartSession() {
  const params = useParams();

  const { socket, isConnected } = useSocket();
  const [user, setUser] = useState("");
  const sessionId = params.id as string;
  const [isOwner, setIsOwner] = useState(false);

  const router = useRouter();
  useEffect(() => {
    if (!socket || !isConnected) return;

    const stored = sessionStorage.getItem("username") ?? "";
    setUser(stored);

    const handleOwner = (username: string) => {
      setIsOwner(username === stored);
    };

    const handleNavigate = (id: string) => {
      router.push(`/room/${id}`);
    };

    socket.on("owner_name", handleOwner);
    socket.on("navigate_to_room", handleNavigate);
    socket.emit("get_owner", { sessionId });

    return () => {
      socket.off("owner_name", handleOwner);
      socket.off("navigate_to_room", handleNavigate);
    };
  }, [socket, isConnected, sessionId, router]);

  const onClick = () => {
    socket.emit("session_started", sessionId);
  };

  return (
    <div>
      {isOwner && (
        <div>
          <button onClick={onClick}>start</button>
        </div>
      )}
    </div>
  );
}
