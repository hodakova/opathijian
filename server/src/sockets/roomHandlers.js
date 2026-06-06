import { rooms } from "../rooms/roomStore.js";
import { createRoom } from "../rooms/roomState.js";
import { generateRoomCode } from "../utils/generateRoomCode.js";
import { createDeck } from "../game/createDeck.js";
import { shuffleDeck } from "../game/shuffleDeck.js";
import { dealCards } from "../game/dealCards.js";
import { buildPublicRoomState } from "../game/buildPublicRoomState.js";

export function registerRoomHandlers(io, socket) {
  function findPlayerRoom(socketId) {
    return Object.values(rooms).find(
      room =>
        room.players.some(
          player => player.id === socketId
        )
    )
  }

  function deleteRoomIfEmpty(roomCode) {
    const room = rooms[roomCode];

    if (!room) return;

    if (room.players.length === 0) {
      delete rooms[roomCode];

      console.log(
        `Room ${roomCode} deleted`
      );
    }
  }

  socket.on("create-room", ({ playerName }) => {
    const existingRoom = findPlayerRoom(socket.id);

    if (existingRoom) {
      socket.emit("error-message", {
        message: "You are already in a room",
      });
      return;
    }

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
      socket.emit("error-message", {
        message: "Room not found"
      });
      return;
    }

    if (room.status !== "waiting") {
      socket.emit("error-message", {
        message: "Game already started",
      });
      return;
    }

    const existingRoom = findPlayerRoom(socket.id);

    if (existingRoom) {
      socket.emit("error-message", {
        message: "You are already in a room",
      });
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

  socket.on("disconnect", () => {
    for (const roomCode in rooms) {
      const room = rooms[roomCode];

      const playerIndex = room.players.findIndex(
        (player) => player.id === socket.id
      );

      if (playerIndex === -1) continue;

      const playerName = room.players[playerIndex].name;

      room.players.splice(playerIndex, 1);

      if (
        room.hostId === socket.id &&
        room.players.length > 0
      ) {
        room.hostId = room.players[0].id;

        console.log(
          `${room.players[0].name} is the new host`
        );

        io.to(roomCode).emit(
          "host-changed",
          {hostId: room.hostId}
        );
      }

      io.to(roomCode).emit(
        "room-updated",
        room
      );

      console.log(
        `${playerName} disconnected from room ${roomCode}`
      );

      deleteRoomIfEmpty(roomCode);

      break;
    }
  });

  socket.on("leave-room", () => {
    for (const roomCode in rooms) {
      const room = rooms[roomCode];

      const playerIndex =
        room.players.findIndex(
          player =>
            player.id === socket.id
        );

      if (playerIndex === -1)
        continue;

      const playerName =
        room.players[playerIndex].name;

      room.players.splice(
        playerIndex,
        1
      );

      socket.leave(roomCode);

      if (
        room.hostId === socket.id &&
        room.players.length > 0
      ) {
        room.hostId =
          room.players[0].id;
      }

      io.to(roomCode).emit(
        "room-updated",
        room
      );

      console.log(
        `${playerName} left room ${roomCode}`
      );

      deleteRoomIfEmpty(roomCode);

      break;
    }
  });

  socket.on("move-player", ({ playerId, direction }) => {
    const room = Object.values(rooms).find(
      room =>
        room.players.some(
          player => player.id === socket.id
        )
    );

    if (!room) return;

    if (room.hostId !== socket.id) {
      return;
    }

    if (room.status !== "waiting") {
      return;
    }


    const index =
      room.players.findIndex(
        player => player.id === playerId
      );

    if (index === -1) return;

    if (
      direction === "up" &&
      index > 0
    ) {
      [
        room.players[index - 1],
        room.players[index]
      ] = [
        room.players[index],
        room.players[index - 1]
      ];
    }

    if (
      direction === "down" &&
      index < room.players.length - 1
    ) {
      [
        room.players[index + 1],
        room.players[index]
      ] = [
        room.players[index],
        room.players[index + 1]
      ];
    }

    io.to(room.roomCode).emit(
      "room-updated",
      room
    );
  });

  socket.on("start-game", () => {
    const room = Object.values(rooms).find(
      room =>
        room.players.some(
          player => player.id === socket.id
        )
    );

    if (!room) return;

    if (room.hostId !== socket.id) {
      return;
    }

    if (room.players.length < 2) {
      socket.emit("error-message", {
        message:
          "At least 2 players are required",
      });

      return;
    }

    if (room.status !== "waiting") {
      return;
    }

    room.status = "playing";

    const deck = shuffleDeck(
      createDeck()
    );

    const remainingDeck =
      dealCards(
        room.players,
        deck
      );
    
    room.deck = remainingDeck;

    room.deadPiles = room.players.map(
      () => []
    );

    room.passingCards = room.players.map(
      () => null
    );

    room.players.forEach(player => {
      io.to(player.id).emit(
        "game-started",
        buildPublicRoomState(
          room,
          player.id
        )
      );
    });

    console.log(
      `Game started in room ${room.roomCode}`
    );
  });
}