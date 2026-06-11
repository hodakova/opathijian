export function finishGame(
  room,
  winnerIds
) {
  room.status = "finished";
  room.winners = winnerIds;

  
  const ranking = [...room.players]
    .sort(
      (a, b) =>
        b.score - a.score
    );

  
  const highestScore =
    ranking[0].score;

  const runnerUpScore =
    ranking[1].score;

  const lowestScore =
    ranking.at(-1).score;


  const champions =
    room.players.filter(
      player =>
        player.score === highestScore
    );

  const runnerUps =
    room.players.filter(
      player =>
        player.score === runnerUpScore
    );

  const lowestPlayers =
    room.players.filter(
      player =>
        player.score === lowestScore
    );

  
  const champion =
    champions[0];

  const championIndex =
    room.players.findIndex(
      player =>
        player.id === champion.id
    );


  if (winnerIds.length === 1) {
    room.badges[winnerIds[0]] ??= [];

    room.badges[winnerIds[0]].push(
      "star"
    );
  }
  else {
    for (const winnerId of winnerIds) {
      room.badges[winnerId] ??= [];

      room.badges[winnerId].push(
        "sharedStar"
      );
    }
  }
  
  const winnerIdSet =
    new Set(winnerIds);
  
  const loserPlayers =
    lowestPlayers.filter(
      player =>
        !winnerIdSet.has(
          player.id
        )
    );

  if (loserPlayers.length === 1) {
      room.badges[loserPlayers[0].id] ??= [];
      room.badges[loserPlayers[0].id].push(
        "cry"
      );
  }
  else if (loserPlayers.length > 1) {
    for (const loser of loserPlayers) {
      room.badges[loser.id] ??= [];
      room.badges[loser.id].push(
        "sharedCry"
      );
    }
  }


  if (highestScore === lowestScore) {
    return;
  }

  const direction =
    getDirection(
      championIndex,
      runnerUps,
      lowestPlayers,
      room.players
    );


  const reorderedPlayers = [];

  let currentIndex = 
    championIndex;

  for (
    let i = 0;
    i < room.players.length;
    i++
  ) {
    reorderedPlayers.push(
      room.players[currentIndex]
    );

    currentIndex =
      (
        currentIndex +
        direction +
        room.players.length
      ) %
      room.players.length;
  }

  room.players =
    reorderedPlayers;
}

function distance(
  from,
  to,
  direction,
  total
) {
  if (direction === 1) {
    return (
      to - from + total
    ) % total;
  }

  return (
    from - to + total
  ) % total;
}

function randomDirection() {
  return (
    Math.random() < 0.5
      ? -1
      : 1
  );
}

function getDirection(
  championIndex,
  runnerUps,
  lowestPlayers,
  players
) {
  const totalPlayers =
    players.length


  const clockwiseLowest =
    Math.min(
      ...lowestPlayers.map(
        player =>
          distance(
            championIndex,
            players.findIndex(
              p =>
                p.id === player.id
            ),
            1,
            totalPlayers
          )
      )
    );

  const counterLowest =
    Math.min(
      ...lowestPlayers.map(
        player =>
          distance(
            championIndex,
            players.findIndex(
              p =>
                p.id === player.id
            ),
            -1,
            totalPlayers
          )
      )
    );

    
  if (clockwiseLowest > counterLowest) {
    return 1;
  }

  if (counterLowest > clockwiseLowest) {
    return -1;
  }


  const clockwiseRunnerUp =
    Math.min(
      ...runnerUps.map(
        player =>
          distance(
            championIndex,
            players.findIndex(
              p =>
                p.id === player.id
            ),
            1,
            totalPlayers
          )
      )
    );

  const counterRunnerUp =
    Math.min(
      ...runnerUps.map(
        player =>
          distance(
            championIndex,
            players.findIndex(
              p =>
                p.id === player.id
            ),
            -1,
            totalPlayers
          )
      )
    );

  if (clockwiseRunnerUp < counterRunnerUp) {
    return 1;
  }

  if (counterRunnerUp < clockwiseRunnerUp) {
    return -1;
  }

  return randomDirection();
}

function passesPlayer(
  start,
  target,
  direction,
  playerIndex,
  totalPlayers
) {
  let current = start;

  while (true) {
    current =
      (
        current +
        direction +
        totalPlayers
      ) % totalPlayers;

    if (current === target) {
      return false;
    }

    if (current === playerIndex) {
      return true;
    }
  }
}