import { rooms } from "../rooms/roomStore.js";
import { createRoom } from "../rooms/roomState.js";
import { generateRoomCode } from "../utils/generateRoomCode.js";
import { buildPublicRoomState } from "../game/buildPublicRoomState.js";
import { createDeck } from "../game/createDeck.js";
import { shuffleDeck } from "../game/shuffleDeck.js";
import { dealCards } from "../game/dealCards.js";
import { calculateScore } from "../game/calculateScore.js";
import { isGameOver } from "../game/isGameOver.js";
import { finishGame } from "../game/finishGame.js";

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

    console.log(
      `${playerName} created room ${roomCode}`
    );
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
      readyToPlay: true,
    });

    socket.join(roomCode);

    io.to(roomCode).emit(
      "room-updated", 
      room
    );

    console.log(
      `${playerName} joined room ${roomCode}`
    );
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

      if (playerIndex === -1) continue;

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

    if (room.hostId !== socket.id) return;

    if (room.status !== "waiting") return;

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

    if (room.hostId !== socket.id) return;

    if (room.players.length < 2) {
      socket.emit("error-message", {
        message:
          "At least 2 players are required",
      });

      return;
    }

    const allReady =
      room.players.every(
        player =>
          player.readyToPlay
      );
    
    if (!allReady) {
      socket.emit("error-message", {
        message:
          "Some players still seeing the stats of the last game. Please wait for them to click 'Back to Lobby'",
      });

      return;
    }

    if (room.status !== "waiting") return;

    room.status = "playing";

    room.players.forEach(player => {
      player.readyToPlay = false;
    });

    const deck = shuffleDeck(createDeck());

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

    console.log(
      `Game started in room ${room.roomCode}`
    );

    for (const player of room.players) {
      player.score =
        calculateScore(
          player.hand
        );

      console.log(
        `Current ${player.name}'s score: ${player.score}`
      );
    }

    if (isGameOver(room)) {
      const highestScore =
        Math.max(
          ...room.players.map(
            player => player.score
          )
        );

      const winners =
        room.players.filter(
          player =>
            player.score === highestScore
        );

      finishGame(
        room,
        winners.map(
          player => player.id
        )
      );

      console.log(
        `${
          winners.map (
            player => player.name
          ).join(" and ")
        } wins the game`
      );
    }

    room.players.forEach(player => {
      io.to(player.id).emit(
        "game-started",
        buildPublicRoomState(
          room,
          player.id
        )
      );
    });
  });

  socket.on("draw-card", () => {
    const room = Object.values(rooms).find(
      room =>
        room.players.some(
          player => player.id === socket.id
        )
    );

    if (!room) return;

    if (room.status !== "playing") return;

    const currentPlayer = room.players[room.turnIndex];

    if (currentPlayer.id !== socket.id) return;

    const incomingCardIndex =
      (
        room.turnIndex - 1 +
        room.players.length
      ) %
      room.players.length;

    const incomingCard =
      room.passingCards[
        incomingCardIndex
      ];

    if (incomingCard) return;

    if (room.mustPassCard) return;

    if (room.deck.length === 0) return;

    const card = room.deck.shift();

    currentPlayer.hand.push(card);

    room.mustPassCard = true;

    room.players.forEach(player => {
      io.to(player.id).emit(
        "room-updated",
        buildPublicRoomState(
          room,
          player.id
        )
      );
    });
  });

  socket.on("pass-card", ({ cardIndex }) => {
    const room = Object.values(rooms).find(
      room =>
        room.players.some(
          player => player.id === socket.id
        )
    );

    if (!room) return;

    if (room.status !== "playing") return;

    const currentPlayer = room.players[room.turnIndex];

    if (currentPlayer.id !== socket.id) return;

    if (!room.mustPassCard) return;

    const card =
      currentPlayer.hand.splice(
        cardIndex,
        1
      )[0];

    if (!card) return;

    room.passingCards[
      room.turnIndex
    ] = card;

    room.mustPassCard = false;

    currentPlayer.score =
      calculateScore(
        currentPlayer.hand
      );

    console.log(
      `Current ${currentPlayer.name}'s score: ${currentPlayer.score}`
    );

    if (
      currentPlayer.score === 41
    ) {
      finishGame(
        room,
        [currentPlayer.id]
      );
      
      console.log(
        `${currentPlayer.name} wins the game`
      );
    };

    room.turnIndex =
      (room.turnIndex + 1) %
      room.players.length;

    room.players.forEach(player => {
      io.to(player.id).emit(
        "room-updated",
        buildPublicRoomState(
          room,
          player.id
        )
      );
    });
  });

  socket.on("accept-card", () => {
    const room = Object.values(rooms).find(
      room =>
        room.players.some(
          player => player.id === socket.id
        )
    );

    if (!room) return;

    if (room.status !== "playing") return;

    const currentPlayer =
      room.players[room.turnIndex];

    if (currentPlayer.id !== socket.id) return;

    const incomingCardIndex =
      (
        room.turnIndex - 1 +
        room.players.length
      ) %
      room.players.length;

    const incomingCard =
      room.passingCards[
        incomingCardIndex
      ];

    if (!incomingCard) return;

    currentPlayer.hand.push(
      incomingCard
    );

    room.passingCards[
      incomingCardIndex
    ] = null;

    room.mustPassCard = true;

    room.players.forEach(player => {
      io.to(player.id).emit(
        "room-updated",
        buildPublicRoomState(
          room,
          player.id
        )
      );
    });
  });

  socket.on("reject-card", () => {
    const room = Object.values(rooms).find(
      room =>
        room.players.some(
          player => player.id === socket.id
        )
    );

    if (!room) return;

    if (room.status !== "playing") return;

    const currentPlayer =
      room.players[room.turnIndex];

    if (currentPlayer.id !== socket.id) return;

    const incomingCardIndex =
      (
        room.turnIndex - 1 +
        room.players.length
      ) %
      room.players.length;

    const incomingCard =
      room.passingCards[
        incomingCardIndex
      ];

    if (!incomingCard) return;

    room.deadPiles[
      incomingCardIndex
    ].push(
      incomingCard
    );

    room.passingCards[
      incomingCardIndex
    ] = null;

    if (isGameOver(room)) {
      const highestScore =
        Math.max(
          ...room.players.map(
            player => player.score
          )
        );

      const winners =
        room.players.filter(
          player =>
            player.score === highestScore
        );

      finishGame(
        room,
        winners.map(
          player => player.id
        )
      );

      console.log(
        `${
          winners.map (
            player => player.name
          ).join(" and ")
        } wins the game`
      );
    }

    room.players.forEach(player => {
      io.to(player.id).emit(
        "room-updated",
        buildPublicRoomState(
          room,
          player.id
        )
      );
    });
  });

  socket.on("move-card", ({ cardIndex, direction }) => {
    const room = Object.values(rooms).find(
      room =>
        room.players.some(
          player => player.id === socket.id
        )
    );

    if (!room) return;

    if (room.status !== "playing") return;

    const player =
      room.players.find(
        player =>
          player.id === socket.id
      );

    if (!player) return;

    if (
      cardIndex < 0 ||
      cardIndex >=
        player.hand.length
    ) {
      return;
    }

    if (
      direction === "left" &&
      cardIndex > 0
    ) {
      [
        player.hand[cardIndex - 1],
        player.hand[cardIndex]
      ] = [
        player.hand[cardIndex],
        player.hand[cardIndex - 1]
      ];
    }

    if (
      direction === "right" &&
      cardIndex < player.hand.length - 1
    ) {
      [
        player.hand[cardIndex + 1],
        player.hand[cardIndex]
      ] = [
        player.hand[cardIndex],
        player.hand[cardIndex + 1]
      ];
    }

    room.players.forEach(player => {
      io.to(player.id).emit(
        "room-updated",
        buildPublicRoomState(
          room,
          player.id
        )
      );
    });
  });

  socket.on("toggle-card-raised", ({ cardIndex }) => {
    const room =
      Object.values(rooms).find(
        room =>
          room.players.some(
            player =>
              player.id ===
              socket.id
          )
      );

    if (!room) return;

    if (room.status !== "playing") return;

    const player =
      room.players.find(
        player =>
          player.id === socket.id
      );

    if (!player) return;

    if (
      cardIndex < 0 ||
      cardIndex >=
        player.hand.length
    ) {
      return;
    }

    player.hand[
      cardIndex
    ].raised =
      !player.hand[
        cardIndex
      ].raised;

    room.players.forEach(player => {
      io.to(player.id).emit(
        "room-updated",
        buildPublicRoomState(
          room,
          player.id
        )
      );
    });
  }
);

  socket.on("back-to-lobby", () => {
    const room =
      Object.values(rooms).find(
        room =>
          room.players.some(
            player =>
              player.id === socket.id
          )
      );

    if (!room) return;

    if (room.status !== "finished") return;


    const player =
      room.players.find(
        player =>
          player.id === socket.id
      );
      
    player.readyToPlay = true;

    const allReady =
      room.players.every(
        player =>
          player.readyToPlay
      );

    if (allReady) {
      room.status = "waiting";

      room.turnIndex = 0;

      room.deck = [];

      room.passingCards = [];

      room.deadPiles = [];

      room.winners = [];

      room.players.forEach(
        player => {
          player.hand = [];
          player.score = 0;
        }
      );
    }


    room.players.forEach(
      player => {
        io.to(player.id).emit(
          "room-updated",
          buildPublicRoomState(
            room,
            player.id
          )
        );
      }
    );
  });
}