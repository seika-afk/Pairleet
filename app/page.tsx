"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { EVENTS } from "@/websocket/events";
import { msg_, setupSocketListeners } from "@/websocket/listeners";

export default function Home() {
  const { socket, isConnected } = useSocket();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<msg_[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [username, setUsername] = useState("");
  useEffect(() => {
    if (!socket) return;
    setupSocketListeners(socket, (msg: msg_) => {
      setMessages((prev) => [...prev, msg]);
    });
    return () => {
      socket.off(EVENTS.RECEIVE_MESSAGE);
    };
  }, [socket]);

  const sendMessage = (input_: msg_) => {
    //input should be like : {socketId..,username,content"message"}
    socket.emit(EVENTS.SEND_MESSAGE, input_);
  };

  const joinSession = () => {
    socket.emit("join_session", { sessionId: sessionId, username: username });
  };
  return (
    <div className="border-black border-b-2">
      <div>
        <h1>Create Server</h1>
        <input
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          placeholder="Enter Session ID"
        />
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter Username"
        />

        <button onClick={joinSession} disabled={!isConnected}>
          Create
        </button>
      </div>
    </div>
  );
}
