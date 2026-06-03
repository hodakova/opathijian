import { useEffect } from "react";
import { socket } from "./socket/socket";

function App() {
  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      console.log("Connected:", socket.id);
    });

    return () => {
      socket.off("connect");
    };
  }, []);

  return (
    <div>
      <h1>Opathijian</h1>
    </div>
  );
}

export default App;