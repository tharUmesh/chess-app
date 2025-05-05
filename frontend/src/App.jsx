import React from "react";
import ChessboardComponent from "./components/Chessboard";
import "./App.css"; // Ensure this is imported for additional styles

function App() {
  return (
    <div className="app-container">
      <h1>Chess App</h1>
      <ChessboardComponent />
    </div>
  );
}

export default App;
