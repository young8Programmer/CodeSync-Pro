import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import './HomePage.css';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateRoom = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.createRoom('javascript', '');
      navigate(`/room/${response.data.roomId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create room');
      setLoading(false);
    }
  };

  const handleJoinRoom = () => {
    if (!roomId.trim()) {
      setError('Please enter a room ID');
      return;
    }
    navigate(`/room/${roomId.trim()}`);
  };

  return (
    <div className="home-page">
      <div className="home-container">
        <div className="home-header">
          <h1 className="home-title">CodeLive</h1>
          <p className="home-subtitle">Real-time Collaborative Code Editor</p>
        </div>

        <div className="home-actions">
          <button
            className="btn btn-primary"
            onClick={handleCreateRoom}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create New Room'}
          </button>

          <div className="divider">
            <span>OR</span>
          </div>

          <div className="join-section">
            <input
              type="text"
              className="input"
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
            />
            <button
              className="btn btn-secondary"
              onClick={handleJoinRoom}
            >
              Join Room
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}
        </div>

        <div className="home-features">
          <div className="feature">
            <span className="feature-icon">🔄</span>
            <h3>Real-time Sync</h3>
            <p>Code changes sync instantly across all users</p>
          </div>
          <div className="feature">
            <span className="feature-icon">🚀</span>
            <h3>Run Code</h3>
            <p>Execute code in multiple programming languages</p>
          </div>
          <div className="feature">
            <span className="feature-icon">👥</span>
            <h3>Collaborate</h3>
            <p>Work together with your team in real-time</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
