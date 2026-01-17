import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import EditorPage from './components/EditorPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/room/:roomId" element={<EditorPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
