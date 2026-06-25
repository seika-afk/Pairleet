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
      <div className="flex gap-2 flex-col">
        {" "}
        <input
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          placeholder="Session ID"
          className="border-2  border-zinc-400 rounded-xl p-2 focus:outline-none focus:bg-neutral-600"
        />
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="border-2 border-zinc-400 rounded-xl p-2  focus:border-none focus:outline-none focus:bg-neutral-600"
        />
        <button
          className=" hover:bg-neutral-600  font-bold rounded-2xl duration-200 transition cursor-pointer p-2"
          onClick={joinSession}
        >
          Start
        </button>
      </div>
    </div>
  );
}
