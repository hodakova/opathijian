export function createRoom(roomCode, hostId, hostName) {
  return {
    roomCode,

    status: "waiting", // waiting | playing | finished

    hostId,

    players: [
      {
        id: hostId,
        name: hostName,
        hand: [],
        score: 0
      }
    ],

    turnIndex: 0,

    deck: [],

    passingCards: [],

    deadPiles: [],

    winner: null,

    createdAt: Date.now()
  };
}