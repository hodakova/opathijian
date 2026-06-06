export function buildPublicRoomState(
  room,
  socketId
) {
  return {
    roomCode: room.roomCode,
    status: room.status,
    hostId: room.hostId,
    turnIndex: room.turnIndex,
    currentTurnPlayerId:
      room.players[
        room.turnIndex
      ]?.id,

    deckCount: room.deck.length,

    players: room.players.map(
      player => ({
        id: player.id,
        name: player.name,
        score: player.score,

        handCount:
          player.hand.length,
      })
    ),

    yourHand:
      room.players.find(
        player =>
          player.id === socketId
      )?.hand || [],

    deadPiles: room.deadPiles,

    passingCards:
      room.passingCards,
  };
}