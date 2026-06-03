import { rooms } from "../rooms/roomStore.js";
import { createRoom } from "../rooms/roomState.js";
import { generateRoomCode } from "../utils/generateRoomCode.js";

export function registerRoomHandlers(io, socket) {
  socket.on("create-room", ({ playerName }) => {
    const roomCode = generateRoomCode();

    const room = createRoom(
      roomCode,
      socket.id,
      playerName
    );

    rooms[roomCode] = room;
    console.log(rooms);

    socket.join(roomCode);

    socket.emit("room-created", {
      roomCode,
      room,
    });

    console.log(
      `${playerName} created room ${roomCode}`
    );
  });
}