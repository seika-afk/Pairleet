import { Socket } from "socket.io-client";
import { EVENTS } from "./events";

export const setupSocketListeners = (socket: Socket, onMessage: (msg: any) => void) => {
  socket.on(EVENTS.RECEIVE_MESSAGE, (msg: any) => {
    onMessage(msg);
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err);
  });
};
