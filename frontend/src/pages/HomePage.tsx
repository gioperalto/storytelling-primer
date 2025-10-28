import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="app home-page">
      <div className="home-background-overlay" />

      <header className="header home-header">
        <div className="home-header-badge">✨ Storytelling Tools</div>
        <h1 className="home-title">Storytelling Primer</h1>
        <p className="home-subtitle">Choose how you want to craft your story</p>
      </header>

      <main className="main">
        <div className="home-container">
          <div className="home-card home-card-animated">
            <div className="home-card-icon-wrapper green-gradient">
              <span className="home-card-icon">🎴</span>
            </div>
            <div className="home-card-content">
              <h2 className="home-card-title">Random Card Draw</h2>
              <p className="home-card-description">
                Draw random cards from each category and challenge yourself to tell a 5-minute story based on them.
              </p>
              <div className="home-card-features">
                <span className="feature-tag">🎲 Random</span>
                <span className="feature-tag">⚡ Quick</span>
                <span className="feature-tag">🎯 Focused</span>
              </div>
              <button
                className="button green home-card-button"
                onClick={() => navigate('/card-draw')}
              >
                <span>Start Drawing Cards</span>
                <span className="button-arrow">→</span>
              </button>
            </div>
          </div>

          <div className="home-card home-card-animated">
            <div className="home-card-icon-wrapper blue-gradient">
              <span className="home-card-icon">🤖</span>
            </div>
            <div className="home-card-content">
              <h2 className="home-card-title">Story Structure Generator</h2>
              <p className="home-card-description">
                Get AI-powered story structure suggestions tailored to your talk, audience, and key messages.
              </p>
              <div className="home-card-features">
                <span className="feature-tag">🧠 AI-Powered</span>
                <span className="feature-tag">📝 Custom</span>
                <span className="feature-tag">💡 Smart</span>
              </div>
              <button
                className="button blue home-card-button"
                onClick={() => navigate('/story-structure')}
              >
                <span>Generate Story Structure</span>
                <span className="button-arrow">→</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
