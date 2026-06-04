import { useEffect, useState } from "react";
import { socket } from "./socket/socket";

function App() {
  const [playerName, setPlayerName] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [room, setRoom] = useState(null);

  useEffect(() => {
    socket.connect();

    socket.on("room-created", (data) => {
      console.log("Room created:", data);

      setRoom(data.room);
    });

    socket.on("room-updated", (roomData) => {
      console.log("Room updated:", roomData);

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

  return (
    <div>
      <h1>Opathijian</h1>

      <input
        type="text"
        placeholder="Player Name"
        value={playerName}
        onChange={(e) =>
          setPlayerName(e.target.value)
        }
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

      <hr />

      {room && (
        <>
          <h2>
            Room: {room.roomCode}
          </h2>

          <h3>Players</h3>

          <ul>
            {room.players.map((player) => (
              <li key={player.id}>
                {player.name}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default App;