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
    const session = sessions.get(sessionId);

    if (session?.started) {
      console.log("REJECTED USER", username);
      socket.emit("join_denied", "Session already started");
      return;
    }
    socket.join(sessionId);
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, {
        participants: [],
        questions: [],
        owner: username,
        started: false,
      });
    }
    console.log("ADDED USER", username);
    const sessionObj = sessions.get(sessionId);
    const existingParticipant = sessionObj.participants.find(p => p.username === username);
    if (existingParticipant) {
      existingParticipant.socketId = socket.id;
    } else {
      sessionObj.participants.push({
        socketId: socket.id,
        username,
      });
    }

    console.log("new Session map ::", sessions);
    socket.to(sessionId).emit("participant_joined", username);
  });

  socket.on("session_started", (sessionId) => {
    console.log("SESSION STARTED", sessionId);
    const session = sessions.get(sessionId);
    if (session) {
      session.started = true;
      io.to(sessionId).emit("navigate_to_room", sessionId);
    }
  });

  socket.on("get_owner", ({ sessionId }) => {
    const session = sessions.get(sessionId);
    if (!session) {
      socket.emit("owner_name", "");
      return;
    }
    socket.emit("owner_name", session.owner);
  });

  socket.on("send_message", (msg) => {
    console.log(`Message received from ${socket.id}:`, msg);
    io.to(msg.sessionId).emit("receive_message", msg);
  });
  socket.on("add_question", ({ sessionId, question }) => {
    const session = sessions.get(sessionId);
    if (!session) return;
    if (!question?.slug) return;

    const alreadyExists = session.questions.some(
      (q) => q.slug === question.slug,
    );
    if (alreadyExists) return;

    session.questions.push({ slug: question.slug });
    io.to(sessionId).emit("questions_list", session.questions);
  });

  socket.on("remove_question", ({ sessionId, slug }) => {
    const session = sessions.get(sessionId);
    if (!session) return;

    session.questions = session.questions.filter((q) => q.slug !== slug);
    io.to(sessionId).emit("questions_list", session.questions);
  });
  socket.on("get_questions", ({ sessionId }) => {
    const session = sessions.get(sessionId);
    if (!session) {
      socket.emit("questions_list", []);
      return;
    }
    socket.emit("questions_list", session.questions);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

console.log("WebSocket server running on port 3001");
