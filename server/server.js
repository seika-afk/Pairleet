const { Server } = require("socket.io");

const io = new Server(10000, {
  cors: {
    origin: "http://localhost:3000",
  },
});

const sessions = new Map();
//session_id: {,participant: {socketid,Array<participants'name>}}

function getLeaderboard(session) {
  return session.participants
    .map((p) => ({
      username: p.username,
      userId: p.userId ?? null,
      solved: session.questions_solved[p.username]?.size ?? 0,
    }))
    .sort((a, b) => b.solved - a.solved);
}

function getParticipantArchiveRows(session) {
  return getLeaderboard(session).map((entry, index) => ({
    userId: entry.userId,
    username: entry.username,
    rank: index + 1,
    solved: entry.solved,
    totalTime: 0,
  }));
}

function getQuestionArchiveRows(session) {
  return session.questions.map((question, index) => {
    const solvers = session.participants.filter((participant) =>
      session.questions_solved[participant.username]?.has(index),
    );

    return {
      title: question.slug,
      wasSolved: solvers.length > 0,
      fastestSolvedBy: solvers[0]?.username ?? "unknown",
    };
  });
}

async function saveSessionArchive(sessionId, session) {
  try {
    const payload = {
      sessionName: sessionId,
      startedAt: session.startedAt ?? new Date().toISOString(),
      endedAt: session.endedAt ?? new Date().toISOString(),
      totalQuestions: session.questions.length,
      winnerUsername: getParticipantArchiveRows(session)[0]?.username ?? null,
      questions: getQuestionArchiveRows(session),
      participants: getParticipantArchiveRows(session),
    };

    const response = await fetch("http://localhost:3000/api/session-archive", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(
        "Failed to save session archive",
        response.status,
        await response.text(),
      );
    }
  } catch (error) {
    console.error("Failed to save session archive", error);
  }
}

function broadcastLeaderboard(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return;
  io.to(sessionId).emit("leaderboard_update", getLeaderboard(session));
}

io.on("connection", (socket) => {
  console.log(` connected: ${socket.id}`);
  socket.on("join_session", ({ sessionId, username, userId }) => {
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
        ownerUserId: userId ?? null,
        started: false,
        startedAt: null,
        endedAt: null,
        questions_solved: {},
      });
    }
    console.log("ADDED USER", username);
    const sessionObj = sessions.get(sessionId);
    const existingParticipant = sessionObj.participants.find(
      (p) => p.username === username,
    );
    if (existingParticipant) {
      existingParticipant.socketId = socket.id;
      existingParticipant.userId = userId ?? existingParticipant.userId ?? null;
    } else {
      sessionObj.participants.push({
        socketId: socket.id,
        username,
        userId: userId ?? null,
      });
    }
    console.log("new Session map ::", sessions);
    socket.to(sessionId).emit("participant_joined", username);
    broadcastLeaderboard(sessionId);
  });
  socket.on("question_solved", ({ sessionId, qIndex, username }) => {
    const session = sessions.get(sessionId);
    if (!session) return;
    if (!session.questions_solved[username]) {
      session.questions_solved[username] = new Set();
    }
    session.questions_solved[username].add(qIndex);
    console.log("QUESTION SOLVED");
    console.log(session.questions_solved);
    broadcastLeaderboard(sessionId);
  });
  socket.on("get_leaderboard", ({ sessionId }) => {
    const session = sessions.get(sessionId);
    socket.emit("leaderboard_update", session ? getLeaderboard(session) : []);
  });
  socket.on("session_started", (sessionId) => {
    console.log("SESSION STARTED", sessionId);
    const session = sessions.get(sessionId);
    if (session) {
      session.started = true;
      session.startedAt = session.startedAt ?? new Date().toISOString();
      io.to(sessionId).emit("navigate_to_room", sessionId);
    }
  });
  socket.on("get_participants", ({ sessionId }, callback) => {
    const session = sessions.get(sessionId);
    const participants = session ? getParticipantArchiveRows(session) : [];
    if (typeof callback === "function") {
      callback(participants);
      return;
    }
    socket.emit("participants_list", participants);
  });
  socket.on("end_session", async ({ sessionId }) => {
    console.log("SESSION ENDED", sessionId);
    const session = sessions.get(sessionId);
    if (!session) return;
    if (session.archived) return;

    session.endedAt = session.endedAt ?? new Date().toISOString();
    session.archived = true;
    await saveSessionArchive(sessionId, session);

    io.to(sessionId).emit("session_ended", {
      sessionId,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      participants: getParticipantArchiveRows(session),
      questions: getQuestionArchiveRows(session),
    });
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
    console.log(session.questions);
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
  socket.on("join_room", ({ sessionId }) => {
    socket.join(sessionId);
    const session = sessions.get(sessionId);
    console.log("join_room called, sessionId:", sessionId, "session:", session);
    socket.emit("questions_list", session?.questions ?? []);
  });
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

console.log("WebSocket server running on port 10000");
