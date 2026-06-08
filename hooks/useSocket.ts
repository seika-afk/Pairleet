"use client";

import { useEffect } from "react";
import { socket } from "@/websocket/client";

export function useSocket() {
  useEffect(() => {
    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, []);
  return socket;
}
