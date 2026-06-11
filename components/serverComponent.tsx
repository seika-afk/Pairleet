type LobbyProps = {
  sessionId: string;
  username: string;
  setSessionId: (v: string) => void;
  setUsername: (v: string) => void;
  joinSession: () => void;
  isConnected: boolean;
};

export default function Lobby({
  sessionId,
  username,
  setSessionId,
  setUsername,
  joinSession,
  isConnected,
}: LobbyProps) {
  return (
    <div>
      <div>
        {" "}
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
        <button onClick={joinSession}>Create</button>
      </div>
      <div>
        {" "}
        <h1>Join Server</h1>
        <input
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          placeholder="Enter Session ID"
        />
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter Username"
          onKeyDown={(e) => e.key == "Enter" && joinSession}
        />
        <button onClick={joinSession}>Create</button>
      </div>
    </div>
  );
}
