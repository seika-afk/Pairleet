"use client";

import { useEffect, useState } from "react";
import { EVENTS } from "@/websocket/events";
import { msg_ } from "@/websocket/listeners";
import { Socket } from "socket.io";

type Props = {
  socket: any;
  sessionId: string;
  username: string;
};

export default function ChatComponent({ socket, sessionId, username }: Props) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<msg_[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handler = (msg: msg_) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on(EVENTS.RECEIVE_MESSAGE, handler);

    return () => {
      socket.off(EVENTS.RECEIVE_MESSAGE, handler);
    };
  }, [socket]);

  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit(EVENTS.SEND_MESSAGE, {
      sessionId,
      username,
      content: message,
    });

    setMessage("");
  };

  return (
    <div>
      <h2>Session: {sessionId}</h2>

      <div
        style={{ height: 200, overflowY: "auto", border: "1px solid black" }}
      >
        {messages.map((m, i) => (
          <div key={i}>
            <b>{m.username}:</b> {m.content}
          </div>
        ))}
      </div>

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type message..."
      />

      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
