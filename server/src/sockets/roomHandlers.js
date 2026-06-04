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

    socket.join(roomCode);

    socket.emit("room-created", {
      roomCode,
      room,
    });

    console.log(`${playerName} created room ${roomCode}`);
  });

  socket.on("join-room", ({ roomCode, playerName }) => {
    const room = rooms[roomCode];

    if (!room) {
      socket.emit("error-message", {message: "Room not found"});
      return;
    }

    room.players.push({
      id: socket.id,
      name: playerName,
      hand: [],
      score: 0,
    });

    socket.join(roomCode);

    io.to(roomCode).emit("room-updated", room);

    console.log(`${playerName} joined room ${roomCode}`);
  });
}