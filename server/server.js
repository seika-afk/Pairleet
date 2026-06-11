/* eslint-disable @typescript-eslint/no-require-imports */
const { Server } = require("socket.io");

const io = new Server(3001, {
  cors: {
    origin: "http://localhost:3000",
  },
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("send_message", (msg) => {
    console.log(`Message received from ${socket.id}:`, msg);
    io.emit("receive_message", msg);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

console.log("WebSocket server running on port 3001");
