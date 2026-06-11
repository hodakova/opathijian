const suits = [
  "hate",
  "tempe",
  "iting",
  "padung",
];

const ranks = [
  "A",
  // "2",
  // "3",
  // "4",
  // "5",
  // "6",
  // "7",
  // "8",
  // "9",
  "10",
  "J",
  "Q",
  "K",
];

function getCardValue(rank) {
  if (rank === "A") return 11;

  if (
    rank === "J" ||
    rank === "Q" ||
    rank === "K"
  ) {
    return 10;
  }

  return Number(rank);
}

export function createDeck() {
  const deck = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({
        suit,
        rank,
        value: getCardValue(rank),
        raised: false,
      });
    }
  }

  return deck;
}