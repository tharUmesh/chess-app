import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    fetch('http://localhost:5000/')
      .then((res) => res.text())
      .then((data) => setMessage(data))
      .catch(() => setMessage('❌ Failed to connect to backend'));
  }, []);

  return (
    <div className="app">
      <h1>♟️ Chess App</h1>
      <p>{message}</p>
    </div>
  );
}

export default App;
