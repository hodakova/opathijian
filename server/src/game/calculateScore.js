export function calculateScore(hand) {
  const suitTotals = {
    hate: 0,
    tempe: 0,
    iting: 0,
    padung: 0,
  };

  for (const card of hand) {
    suitTotals[card.suit] += card.value;
  };

  const values = Object.values(
    suitTotals
  );

  const highestSuit =
    Math.max(...values);

  const otherSuits =
    values.reduce(
      (sum, value) => sum + value,
      0
    ) - highestSuit;

  return highestSuit - otherSuits;
}