import { useEffect, useState } from "react";
import { socket } from "./socket/socket";

function App() {
  const [roomCode, setRoomCode] = useState("");

  useEffect(() => {
    socket.connect();

    socket.on("room-created", (data) => {
      console.log(data);

      setRoomCode(data.roomCode);
    });

    return () => {
      socket.off("room-created");
    };
  }, []);

  const createRoom = () => {
    socket.emit("create-room", {
      playerName: "Hodakova",
    });
  };

  return (
    <div>
      <h1>Opathijian</h1>

      <button onClick={createRoom}>
        Create Room
      </button>

      <p>Room Code: {roomCode}</p>
    </div>
  );
}

export default App;