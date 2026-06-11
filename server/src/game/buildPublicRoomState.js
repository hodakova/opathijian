export function buildPublicRoomState(
  room,
  socketId
) {
  const currentPlayerIndex =
    room.players.findIndex(
      player =>
        player.id === socketId
    );

  const incomingCardIndex =
    (
      currentPlayerIndex - 1 +
      room.players.length
    ) %
    room.players.length;

  const incomingCard =
    room.passingCards[
      incomingCardIndex
    ];

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
    mustPassCard: room.mustPassCard,

    players: room.players.map(
      player => ({
        id: player.id,
        name: player.name,
        score: player.score,

        cards: player.hand.map(
          card => ({
            raised: card.raised,
          })
        ),

        readyToPlay: player.readyToPlay,
      })
    ),

    yourHand:
      room.players.find(
        player =>
          player.id === socketId
      )?.hand || [],

    incomingCard,

    deadPiles: room.deadPiles,

    passingCards:
      room.passingCards,

    winners: room.winners,
    
    badges: room.badges,
  };
}