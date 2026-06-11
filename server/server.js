/* eslint-disable @typescript-eslint/no-require-imports */
const { Server } = require("socket.io");

const io = new Server(3001, {
  cors: {
    origin: "http://localhost:3000",
  },
});
const sessions = new Map();
//session_id: {,participant: {socketid,Array<participants'name>}}
io.on("connection", (socket) => {
  console.log(` connected: ${socket.id}`);

  socket.on("join_session", ({ sessionId, username }) => {
    socket.join(sessionId);
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, {
        participants: [],
      });
    }
    sessions.get(sessionId).participants.push({
      socketId: socket.id,
      username,
    });

    console.log("new Session map ::", sessions);
    socket.to(sessionId).emit("participant_joined", username);
  });

  socket.on("send_message", (msg) => {
    console.log(`Message received from ${socket.id}:`, msg);
    io.to(msg.sessionId).emit("receive_message", msg);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

console.log("WebSocket server running on port 3001");
