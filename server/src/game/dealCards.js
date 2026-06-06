export function dealCards(
  players,
  deck
) {
  const remainingDeck = [...deck];

  for (const player of players) {
    player.hand = [];

    for (let i = 0; i < 4; i++) {
      player.hand.push(
        remainingDeck.shift()
      );
    }
  }

  return remainingDeck;
}