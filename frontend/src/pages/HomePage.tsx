import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="app">
      <header className="header">
        <h1>Storytelling Primer</h1>
        <p>Choose how you want to craft your story</p>
      </header>

      <main className="main">
        <div className="home-container">
          <div className="home-card">
            <div className="home-card-content">
              <h2 className="home-card-title">Random Card Draw</h2>
              <p className="home-card-description">
                Draw random cards from each category and challenge yourself to tell a 5-minute story based on them.
              </p>
              <button
                className="button green"
                onClick={() => navigate('/card-draw')}
              >
                Start Drawing Cards
              </button>
            </div>
          </div>

          <div className="home-card">
            <div className="home-card-content">
              <h2 className="home-card-title">Story Structure Generator</h2>
              <p className="home-card-description">
                Get AI-powered story structure suggestions tailored to your talk, audience, and key messages.
              </p>
              <button
                className="button blue"
                onClick={() => navigate('/story-structure')}
              >
                Generate Story Structure
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
