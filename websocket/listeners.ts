import { Socket } from "socket.io-client";
import { EVENTS } from "./events";

export interface msg_ {
  socketId: string;
  content: string;
  username: string;
}
export const setupSocketListeners = (
  socket: Socket,
  onMessage: (msg: msg_) => void,
) => {
  socket.on(EVENTS.RECEIVE_MESSAGE, (msg: msg_) => {
    onMessage(msg);
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err);
  });
};
