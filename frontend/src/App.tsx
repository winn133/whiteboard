import React from 'react';
import './App.css';
import Whiteboard from './components/Whiteboard';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Collaborative Whiteboard</h1>
      </header>
      <main style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
        <Whiteboard />
      </main>
    </div>
  );
}

export default App;
