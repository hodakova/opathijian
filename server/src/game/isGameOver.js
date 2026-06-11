export function isGameOver(room) {
  const deckEmpty =
    room.deck.length === 0;

  const noPassingCards =
    room.passingCards.every(
      card => card === null
    );

  return (
    deckEmpty &&
    noPassingCards
  );
}