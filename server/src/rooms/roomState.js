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
        score: 0,
        readyToPlay: true,
      }
    ],

    turnIndex: 0,

    deck: [],

    passingCards: [],

    deadPiles: [],

    winners: [],

    badges: {},

    createdAt: Date.now()
  };
}