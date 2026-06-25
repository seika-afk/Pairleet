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

  if (!isOwner)
    return (
      <div className="flex flex-col gap-2">
        <p className="text-white font-black text-2xl leading-tight m-0">
          Waiting for
          <br />
          host...
        </p>
        <p className="text-white/30 text-xs font-mono m-0">
          The session will start soon.
        </p>
        <div className="flex gap-1 mt-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#B7ADCF]/40 animate-pulse"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-white font-black text-2xl leading-tight m-0">
          Ready to
          <br />
          begin?
        </p>
        <p className="text-white/30 text-xs font-mono mt-1 m-0">
          All participants will be redirected.
        </p>
      </div>

      <button
        onClick={onClick}
        className="self-start bg-[#B7ADCF] text-[#2e2640] text-sm font-bold tracking-wide px-5 py-2.5 rounded-full hover:bg-white transition-colors duration-150 active:scale-95 cursor-pointer"
      >
        Start session →
      </button>
    </div>
  );
}
