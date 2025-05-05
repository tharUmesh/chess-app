import React, { useState, useRef, useEffect } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import "./Chessboard.css";

// Lichess worker import
import LichessWorker from "./lichessWorker.js?worker";

const ChessboardComponent = () => {
  const gameRef = useRef(new Chess());
  const [fen, setFen] = useState(gameRef.current.fen());
  const [moveHistory, setMoveHistory] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [playerSide, setPlayerSide] = useState(null);
  const [gameOverMessage, setGameOverMessage] = useState("");
  const [moveSquares, setMoveSquares] = useState({});
  const [isPlayerTurn, setIsPlayerTurn] = useState(true); // Track if it's player's turn

  const stockfishWorker = useRef(null);

  useEffect(() => {
    stockfishWorker.current = new LichessWorker();

    stockfishWorker.current.onmessage = (e) => {
      const { type, move, message } = e.data;

      if (type === "bestmove" && !isPlayerTurn) {
        const game = gameRef.current;
        const moveResult = game.move(`${move.from}${move.to}`);
        setFen(game.fen());
        setMoveHistory((prev) => [...prev, moveResult.san]);
        setMoveSquares({});
        playSound(moveResult.flags.includes("c") ? "capture" : "move");
        if (game.inCheck()) playSound("check");

        if (game.isGameOver()) {
          setTimeout(() => {
            if (game.isCheckmate()) {
              setGameOverMessage("Checkmate! You lost!");
              playSound("checkmate");
            } else if (game.isDraw()) {
              setGameOverMessage("Game drawn!");
              playSound("draw");
            } else {
              setGameOverMessage("Game over!");
            }
            setGameStarted(false);
          }, 300);
        } else {
          setIsPlayerTurn(true);
        }
      } else if (type === "error") {
        console.error("Lichess Worker Error:", message);
      }
    };

    return () => {
      stockfishWorker.current.terminate();
    };
  }, [isPlayerTurn])

  // Sounds
  const moveSound = new Audio("/sounds/Move.mp3");
  const captureSound = new Audio("/sounds/Capture.mp3");
  const checkSound = new Audio("/sounds/Check.mp3");
  const checkmateSound = new Audio("/sounds/Checkmate.mp3");
  const drawSound = new Audio("/sounds/Draw.mp3");
  const defeatSound = new Audio("/sounds/Defeat.mp3");
  const errorSound = new Audio("/sounds/Error.mp3");

  const playSound = (type) => {
    switch (type) {
      case "move":
        moveSound.play();
        break;
      case "capture":
        captureSound.play();
        break;
      case "check":
        checkSound.play();
        break;
      case "checkmate":
        checkmateSound.play();
        break;
      case "draw":
        drawSound.play();
        break;
      case "defeat":
        defeatSound.play();
        break;
      case "error":
        errorSound.play();
        break;
      default:
        break;
    }
  };

  const handleSideSelect = (side) => {
    if (side === "random") {
      const randomSide = Math.random() < 0.5 ? "white" : "black";
      setPlayerSide(randomSide);
    } else {
      setPlayerSide(side);
    }
  };

  const startGame = () => {
    if (!playerSide) {
      alert("Please select a side before starting!");
      playSound("error");
      return;
    }
    gameRef.current = new Chess();
    setFen(gameRef.current.fen());
    setMoveHistory([]);
    setGameStarted(true);
    setGameOverMessage("");
    setMoveSquares({});
    setIsPlayerTurn(playerSide === "white");
  };

  const resetGame = () => {
    gameRef.current = new Chess();
    setFen(gameRef.current.fen());
    setMoveHistory([]);
    setPlayerSide(null);
    setGameStarted(false);
    setGameOverMessage("");
    setMoveSquares({});
    setIsPlayerTurn(true); // Reset to player's turn
  };

  const onDrop = (sourceSquare, targetSquare) => {
    if (!gameStarted || !isPlayerTurn) return false;

    const game = gameRef.current;
    const move = game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });

    if (move === null) {
      playSound("error");
      return false;
    }

    setFen(game.fen());
    setMoveHistory((prev) => [...prev, move.san]);
    setMoveSquares({});

    playSound(move.flags.includes("c") ? "capture" : "move");
    if (game.inCheck()) playSound("check");

    if (game.isGameOver()) {
      setTimeout(() => {
        if (game.isCheckmate()) {
          setGameOverMessage("Checkmate! You won!");
          playSound("checkmate");
        } else if (game.isDraw()) {
          setGameOverMessage("Game drawn!");
          playSound("draw");
        } else {
          setGameOverMessage("Game over!");
        }
        setGameStarted(false); // don't reset instantly
      }, 300);
    } else {
      setIsPlayerTurn(false); // Switch to opponent's turn (Lichess)
    }

    return true;
  };

  const handleResign = () => {
    const confirmResign = window.confirm("Are you sure you want to resign?");
    if (confirmResign) {
      setGameOverMessage("You resigned.");
      playSound("defeat");
      setGameStarted(false);
    }
  };

  const handleDraw = () => {
    const confirmDraw = window.confirm("Do both players agree to a draw?");
    if (confirmDraw) {
      setGameOverMessage("Game drawn by agreement.");
      playSound("draw");
      setGameStarted(false);
    }
  };

  const handleUndo = () => {
    const game = gameRef.current;
    if (moveHistory.length === 0) return;

    game.undo();
    const newHistory = [...moveHistory];
    newHistory.pop();

    setMoveHistory(newHistory);
    setFen(game.fen());
  };

  const moveRows = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    moveRows.push({
      moveNumber: i / 2 + 1,
      white: moveHistory[i],
      black: moveHistory[i + 1] || "",
    });
  }

  const onPieceClick = (square) => {
    const game = gameRef.current;
    const moves = game.moves({ square, verbose: true });
    const squaresToHighlight = {};
    moves.forEach((move) => {
      squaresToHighlight[move.to] = {
        background: "radial-gradient(circle, #ff0 20%, transparent 20%)",
        borderRadius: "50%",
      };
    });
    setMoveSquares(squaresToHighlight);
  };

  useEffect(() => {
    stockfishWorker.current = new LichessWorker();

    stockfishWorker.current.onmessage = (e) => {
      const { type, move, message } = e.data;

      if (type === "bestmove" && !isPlayerTurn) {
        const game = gameRef.current;

        // Apply the move returned by the Lichess API
        const moveResult = game.move({
          from: move.from,
          to: move.to,
          promotion: "q", // Always promote to queen
        });

        if (moveResult) {
          setFen(game.fen());
          setMoveHistory((prev) => [...prev, moveResult.san]);
          setMoveSquares({});
          playSound(moveResult.flags.includes("c") ? "capture" : "move");
          if (game.inCheck()) playSound("check");

          if (game.isGameOver()) {
            setTimeout(() => {
              if (game.isCheckmate()) {
                setGameOverMessage("Checkmate! You lost!");
                playSound("checkmate");
              } else if (game.isDraw()) {
                setGameOverMessage("Game drawn!");
                playSound("draw");
              } else {
                setGameOverMessage("Game over!");
              }
              setGameStarted(false);
            }, 300);
          } else {
            setIsPlayerTurn(true);
          }
        } else {
          console.error("Invalid move received from Lichess API:", move);
        }
      } else if (type === "error") {
        console.error("Lichess Worker Error:", message);
        alert(`Error: ${message}`); // Notify the user of the error
      }
    };

    return () => {
      stockfishWorker.current.terminate();
    };
  }, [isPlayerTurn]);

  useEffect(() => {
    if (isPlayerTurn || !gameStarted || !stockfishWorker.current) return;

    // Send the current board position to Lichess
    stockfishWorker.current.postMessage({
      type: "position",
      data: { fen: gameRef.current.fen() },
    });
  }, [isPlayerTurn, gameStarted]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          padding: "20px",
          gap: "30px",
        }}
      >
        {/* LEFT HALF: Chessboard + Players */}
        <div style={{ flex: 1, maxWidth: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: "10px" }}>
            <img
              src="https://via.placeholder.com/40"
              alt="Player Icon"
              style={{ borderRadius: "50%" }}
            />
            <div>{playerSide === "white" ? "You" : "Opponent"}</div>
          </div>

          <Chessboard
            position={fen}
            onPieceDrop={onDrop}
            onSquareClick={onPieceClick}
            boardWidth={500}
            arePiecesDraggable={gameStarted}
            boardOrientation={playerSide || "white"}
            customSquareStyles={moveSquares}
          />

          <div style={{ textAlign: "center", marginTop: "10px" }}>
            <img
              src="https://via.placeholder.com/40"
              alt="Player Icon"
              style={{ borderRadius: "50%" }}
            />
            <div>{playerSide === "black" ? "You" : "Opponent"}</div>
          </div>
        </div>

        {/* RIGHT HALF: Play controls + Move history */}
        <div style={{ flex: 1, maxWidth: "100%" }}>
          {/* Play and move history */}
          {!gameStarted ? (
            <div style={{ marginBottom: "30px" }}>
              <button
                onClick={startGame}
                style={{
                  width: "100%",
                  padding: "15px",
                  fontSize: "24px",
                  backgroundColor: "green",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  marginBottom: "15px",
                }}
              >
                Play
              </button>

              <strong>Select your side:</strong>
              <div style={{ marginTop: "10px" }}>
                <button
                  onClick={() => handleSideSelect("white")}
                  style={{ marginRight: "10px" }}
                >
                  White
                </button>
                <button
                  onClick={() => handleSideSelect("black")}
                  style={{ marginRight: "10px" }}
                >
                  Black
                </button>
                <button onClick={() => handleSideSelect("random")}>
                  Random
                </button>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: "30px" }}>
              <button onClick={handleUndo}>Undo</button>
              <button onClick={handleDraw}>Draw</button>
              <button onClick={handleResign}>Resign</button>
            </div>
          )}

          <div>
            <h3>Move History</h3>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>White</th>
                  <th>Black</th>
                </tr>
              </thead>
              <tbody>
                {moveRows.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.moveNumber}.</td>
                    <td>{row.white}</td>
                    <td>{row.black}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {gameOverMessage && (
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <h2>{gameOverMessage}</h2>
        </div>
      )}
    </div>
  );
};

export default ChessboardComponent;
