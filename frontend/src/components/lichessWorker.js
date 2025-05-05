// lichessWorker.js
const LICHESS_API_URL = "https://lichess.org/api/cloud-eval";
const API_TOKEN = "lip_QeNyaPwz1A2USZtepxd9";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

onmessage = async function (e) {
  const { type, data } = e.data;

  if (type === "position") {
    const fen = data.fen;

    try {
      await delay(1000); // Delay to avoid rate limiting

      const response = await fetch(
        `${LICHESS_API_URL}?fen=${encodeURIComponent(fen)}`,
        {
          headers: {
            Authorization: `Bearer ${API_TOKEN}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lichess API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const bestMove = result.pvs[0]?.moves.split(" ")[0];

      if (bestMove) {
        const from = bestMove.slice(0, 2);
        const to = bestMove.slice(2, 4);
        postMessage({ type: "bestmove", move: { from, to } });
      } else {
        postMessage({ type: "error", message: "No best move found" });
      }
    } catch (error) {
      postMessage({ type: "error", message: error.message });
    }
  }
};
