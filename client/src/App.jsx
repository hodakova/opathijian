import { useEffect, useState } from "react";
import { socket } from "./socket/socket";
import "./App.css";

function App() {
  const [playerName, setPlayerName] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [room, setRoom] = useState(null);

  const isHost =
    room?.hostId === socket.id;

  const currentPlayer =
    room?.players.find(
      player => player.id === socket.id
    );

  const isMyTurn =
    room?.currentTurnPlayerId ===
    socket.id;

  const currentTurnPlayer =
    room?.players.find(
      player =>
        player.id ===
        room.currentTurnPlayerId
    );

  const activePassingCard =
    room?.passingCards.find(
      card => card !== null
    );

  const winner =
    room?.players.find(
      player =>
        player.id === room.winner
    );

  const winners =
    room?.players.filter(
      player =>
        room.winners?.includes(
          player.id
        )
    ) || [];

  const isWinner =
    room?.winners?.includes(
      socket.id
    );

  const finalRanking =
    room?.players
      ? [...room.players].sort(
          (a, b) =>
            b.score - a.score
        )
      : [];

  const inLobby =
    currentPlayer?.readyToPlay;

  const badges = {
    star: {
      icon: "⭐",
      title: "Winner",
    },
    
    sharedStar: {
      icon: "⯪",
      title: "Shared Winner",
      className: "shared-star"
    },

    cry: {
      icon: "😭",
      title: "Lowest Score",
    },
    
    sharedCry: {
      icon: "😢",
      title: "Shared Lowest Score",
    },
    
    host: {
      icon: "🏠",
      title: "Host",
    },
    
    waiting: {
      icon: "⏳",
      title: "Waiting",
    },
    
    disconnected: {
      icon: "🔴",
      title: "Disconnected",
    },
    
    reconnecting: {
      icon: "🟡",
      title: "Reconnecting",
    },
    
    online: {
      icon: "🟢",
      title: "Online",
    },
    
    left: {
      icon: "⚫",
      title: "Left",
    }
  }
  
  const renderBadges = (player) => (
    <>
      {room.hostId === player.id && (
        <span
          className="badge"
          title={badges.host.title}
        >
          {badges.host.icon}
        </span>
      )}

      {room.badges?.[player.id]?.map(
        (badge, index) => (
          <span
            key={index}
            className={`badge ${badges[badge].className || ""}`}
            title={badges[badge].title}
          >
            {badges[badge].icon}
          </span>
        )
      )}
    </>
  );

  const boldIf = (
    condition,
    content
  ) =>
    condition
      ? (
        <strong>
          {content}
        </strong>
      )
      : (
        content
      );

  useEffect(() => {
    socket.connect();

    socket.on("room-created", (data) => {
      setRoom(data.room);
    });

    socket.on("room-updated", (roomData) => {
      setRoom(roomData);
    });

    socket.on("game-started", (roomData) => {
      setRoom(roomData);
    });

    socket.on("error-message", (data) => {
      alert(data.message);
    });

    return () => {
      socket.off("room-created");
      socket.off("room-updated");
      socket.off("error-message");
    };
  }, []);

  const createRoom = () => {
    if (!playerName.trim()) return;

    socket.emit("create-room", {playerName});
  };

  const joinRoom = () => {
    if (!playerName.trim()) return;
    if (!roomCodeInput.trim()) return;

    socket.emit("join-room", {roomCode: roomCodeInput, playerName});
  };

  const leaveRoom = () => {
    socket.emit("leave-room");

    setRoom(null);

    setRoomCodeInput("");
  };

  const movePlayer = (playerId, direction) => {
    socket.emit("move-player", {playerId, direction});
  };

  const drawCard = () => {
    socket.emit("draw-card");
  };

  const passCard = (cardIndex) => {
    socket.emit("pass-card", {cardIndex});
  };

  const acceptCard = () => {
    socket.emit("accept-card");
  };

  const rejectCard = () => {
    socket.emit("reject-card");
  };

  const moveCard = (cardIndex, direction) => {
    socket.emit("move-card", {cardIndex, direction});
  };

  const toggleCardRaised = (cardIndex) => {
    socket.emit("toggle-card-raised", {cardIndex});
  };
    

  return (
    <div>
      <h1>Opathijian</h1>

      <hr />

      {room ? (
        <>
          <h2>
            Room: {room.roomCode}
          </h2>
          
          <p>
            Playing as: <strong>
              {playerName}
              {
                currentPlayer &&
                renderBadges(
                  currentPlayer
                )
              }
            </strong>
          </p>

          <p>Status: {
              room.status === "finished" && inLobby 
                ? "waiting" 
                : room.status
            }
          </p>

          <button onClick={leaveRoom}>
            Leave Room
          </button>

          {isHost && (room.status === "waiting" || inLobby) && (
            <button
              onClick={() =>
                socket.emit("start-game")
              }
            >
              Start Game
            </button>
          )}
          
          {room.status === "finished" && !inLobby && (
            <button
              onClick={() =>
                socket.emit(
                  "back-to-lobby"
                )
              }
            >
              Back to Lobby
            </button>
          )}

          {room.status === "playing" && (
            <>
              <p>
                Turn: {
                  boldIf(
                    currentTurnPlayer?.id === socket.id,
                    <>
                      {currentTurnPlayer?.name}
                      {renderBadges(currentTurnPlayer)}
                    </>
                  )
                }
              </p>
              <p>Deck Remaining: {room.deckCount}</p>
              <p>Must Pass Card: {room.mustPassCard ? "Yes" : "No"}</p>
              <p>Passing Card: {
                  activePassingCard
                    ? `${activePassingCard.rank} ${activePassingCard.suit}`
                    : "-"
                }
              </p>
            </>
          )}

          {(room.status !== "finished" || inLobby) && (
            <>
              <h3>Players</h3>

              <ul>
                {room.players.map((player, index) => (
                  <li key={player.id}>
                    {
                      boldIf(
                        player.id === socket.id, 
                        <>
                          {index + 1}{". "}
                          {player.name}
                          {renderBadges(player)}
                          {room.status === "finished" && !player.readyToPlay && (
                            <span
                              className="badge"
                              title={badges.waiting.title}
                            >
                              {badges.waiting.icon}
                            </span>
                          )}
                        </>
                      )
                    }

                    {isHost && room.status === "waiting" && (
                      <>
                        {" "}
                        <button
                          onClick={() =>
                            movePlayer(
                              player.id,
                              "up"
                            )
                          }
                          disabled={index === 0}
                        >
                          ↑
                        </button>

                        <button
                          onClick={() =>
                            movePlayer(
                              player.id,
                              "down"
                            )
                          }
                          disabled={
                            index ===
                            room.players.length - 1
                          }
                        >
                          ↓
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
          
          {room.status === "playing" && (
            <>
              <h3>Dead Piles</h3>

              <ul>
                {room.deadPiles.map(
                  (pile, index) => (
                    <li key={index}>
                      Pile {index + 1}:{" "}
                      {
                        pile.length === 0
                          ? "-"
                          : pile
                              .map(
                                card =>
                                  `${card.rank} ${card.suit}`
                              )
                              .join(", ")
                      }
                    </li>
                  )
                )}
              </ul>
              
              
              <h3>Your Cards</h3>

              <ul>
                {room.yourHand.map(
                  (card, index) => (
                    <li key={index}>
                      <button
                        onClick={() =>
                          moveCard(
                            index,
                            "left"
                          )
                        }
                        disabled={index === 0}
                      >
                        ←
                      </button>

                      {card.rank}
                      {" "}
                      {card.suit}

                      <button
                        onClick={() =>
                          moveCard(
                            index,
                            "right"
                          )
                        }
                        disabled={
                          index ===
                          room.yourHand.length - 1
                        }
                      >
                        →
                      </button>
                      {isMyTurn &&
                        room.mustPassCard && (
                          <button
                            onClick={() =>
                              passCard(index)
                            }
                          >
                            Pass
                          </button>
                        )
                      }
                    </li>
                  )
                )}
              </ul>

              <h3>
                {isMyTurn
                  ? "🟢 Your Turn"
                  : "⏳ Waiting for other player..."}
              </h3>

              {isMyTurn && !room.mustPassCard && (
                <>
                  {room.incomingCard 
                    ? (
                      <>
                        <p>Incoming: {room.incomingCard.rank}{" "}
                          {room.incomingCard.suit}
                        </p>

                        <button
                          onClick={acceptCard}
                        >
                          Accept
                        </button>

                        <button
                          onClick={rejectCard}
                        >
                          Reject
                        </button>
                      </>
                    ) 
                    : (
                      <>
                        {room.deckCount > 0 && (
                            <button onClick={drawCard}>
                              Draw Card
                            </button>
                          )
                        }
                      </>
                    )
                  }
                </>
              )}
            </>
          )}

          {room.status === "finished" && !inLobby && (
            <>
              {isWinner
                ? (
                  <h2>
                    🏆 VICTORY 🏆
                  </h2>
                )
                : (
                  <h2>
                    😂 DEFEAT 😂
                  </h2>
                )
              }

              <p>
                {winners.length === 1
                  ? "Winner: "
                  : "Winners: "
                }
                {winners.map(
                  (player, index) => (
                    <span key={player.id}>
                      {
                        boldIf(
                          player.id === socket.id,
                          player.name
                        )
                      }

                      {
                        index <
                        winners.length - 1
                          ? ", "
                          : ""
                      }
                    </span>
                  )
                )}
              </p>

              <h3>Final Scores</h3>

              <ol>
                {finalRanking.map(
                  (player, index) => (
                    <li key={player.id}>
                      {
                        boldIf(
                          player.id === socket.id,
                          <>
                            {index === 0 && "🥇 "}
                            {index === 1 && "🥈 "}
                            {index === 2 && "🥉 "}
                            {index > 2 && `${index + 1}th `}
                            {player.name}
                            {renderBadges(player)}
                            {room.badges?.[player.id] && " "}
                            {": "}
                            {player.score}
                            {" points"}
                          </>
                        )
                      }
                    </li>
                  )
                )}
              </ol>
            </>
          )}
        </>
      )
      : (
        <>
          <input
            type="text"
            placeholder="Player Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />

          <br />
          <br />

          <button onClick={createRoom}>
            Create Room
          </button>

          <br />
          <br />

          <input
            type="text"
            placeholder="Room Code"
            value={roomCodeInput}
            onChange={(e) =>
              setRoomCodeInput(e.target.value)
            }
          />

          <button onClick={joinRoom}>
            Join Room
          </button>
        </>
      )}
    </div>
  );
}

export default App;