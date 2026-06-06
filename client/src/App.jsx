import { useEffect, useState } from "react";
import { socket } from "./socket/socket";
import "./App.css";

function App() {
  const [playerName, setPlayerName] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [room, setRoom] = useState(null);
  const isHost = room?.hostId === socket.id;
  const currentPlayer =
    room?.players.find(
      player => player.id === socket.id
    );
  const isMyTurn =
    room?.currentTurnPlayerId ===
    socket.id;

  useEffect(() => {
    socket.connect();

    socket.on("room-created", (data) => {
      setRoom(data.room);
    });

    socket.on("room-updated", (roomData) => {
      setRoom(roomData);
    });

    socket.on("game-started", (roomData) => {
      console.log(roomData);
      setRoom(roomData);
    });

    socket.on("error-message", (data) => {
      alert(data.message);
    });

    return () => {
      socket.off("room-created");
      socket.off("room-updated");
      socket.off("error-message");
    };
  }, []);

  const createRoom = () => {
    if (!playerName.trim()) return;

    socket.emit("create-room", {
      playerName,
    });
  };

  const joinRoom = () => {
    if (!playerName.trim()) return;
    if (!roomCodeInput.trim()) return;

    socket.emit("join-room", {
      roomCode: roomCodeInput,
      playerName,
    });
  };

  const leaveRoom = () => {
    socket.emit("leave-room");

    setRoom(null);

    setRoomCodeInput("");
  };

  const movePlayer = (
    playerId,
    direction
  ) => {
    socket.emit("move-player", {
      playerId,
      direction,
    });
  };

  

  return (
    <div>
      <h1>Opathijian</h1>

      <hr />

      {room ? (
        <>
          <h2>
            Room: {room.roomCode}
          </h2>
          
          <p>
            Playing as: <strong>{playerName}</strong>
            {isHost && (
              <span
                className="host-badge"
                title="Host"
              >
                🏠
              </span>
            )}
          </p>

          <button onClick={leaveRoom}>
            Leave Room
          </button>

          {
            isHost && (
              <button
                onClick={() =>
                  socket.emit("start-game")
                }
              >
                Start Game
              </button>
            )
          }

          <p>Status: {room.status}</p>

          <h3>Players</h3>

          <ul>
            {room.players.map((player, index) => (
              <li key={player.id}>
                {index + 1}. {player.name}

                {room.hostId === player.id && (
                  <span
                    className="host-badge"
                    title="Host"
                  >
                    🏠
                  </span>
                )}

                {isHost && (
                  <>
                    <button
                      onClick={() =>
                        movePlayer(
                          player.id,
                          "up"
                        )
                      }
                      disabled={index === 0}
                    >
                      ↑
                    </button>

                    <button
                      onClick={() =>
                        movePlayer(
                          player.id,
                          "down"
                        )
                      }
                      disabled={
                        index ===
                        room.players.length - 1
                      }
                    >
                      ↓
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>

          {room.status === "playing" && (
            <>
              <h3>Your Cards</h3>

              <ul>
                {room.yourHand.map(
                  (card, index) => (
                    <li key={index}>
                      {card.rank} {card.suit}
                    </li>
                  )
                )}
              </ul>

              <p>
                {isMyTurn
                  ? "🟢 Your Turn"
                  : "⏳ Waiting for other player..."}
              </p>
            </>
          )}
        </>
      )
      : (
        <>
          <input
            type="text"
            placeholder="Player Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />

          <br />
          <br />

          <button onClick={createRoom}>
            Create Room
          </button>

          <br />
          <br />

          <input
            type="text"
            placeholder="Room Code"
            value={roomCodeInput}
            onChange={(e) =>
              setRoomCodeInput(e.target.value)
            }
          />

          <button onClick={joinRoom}>
            Join Room
          </button>
        </>
      )}
    </div>
  );
}

export default App;