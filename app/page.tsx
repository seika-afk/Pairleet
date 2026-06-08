"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { EVENTS } from "@/websocket/events";
import { setupSocketListeners } from "@/websocket/listeners";

export default function Home() {
  const { socket, isConnected } = useSocket();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    if (!socket) return;

    setupSocketListeners(socket, (msg: string) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off(EVENTS.RECEIVE_MESSAGE);
    };
  }, [socket]);

  const sendMessage = () => {
    if (input.trim() && isConnected) {
      socket.emit(EVENTS.SEND_MESSAGE, input);
      setInput("");
    }
  };

  return (
    <main style={{ padding: "2rem" }}>
      <div>
        Status:{" "}
          {isConnected ? "Connected" : "Disconnected"}
      </div>

      <div style={{ marginTop: "1rem" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage} disabled={!isConnected}>
          Send
        </button>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <h3>Messages:</h3>
        {messages.length === 0 && <p>No messages yet.</p>}
        {messages.map((msg, idx) => (
          <p key={idx}>{msg}</p>
        ))}
      </div>
    </main>
  );
}
