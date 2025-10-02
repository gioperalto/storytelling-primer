import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

interface StoryElement {
  label: string;
  value: string;
  title: string;
  subtitle: string;
  category: string;
  description: string;
  hint: string;
}

const App: React.FC = () => {
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fullSample, setFullSample] = useState(true);
  const [storyElements, setStoryElements] = useState([] as StoryElement[]);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const colorMap: { [key: string]: string } = {
    "Concept": "red",
    "Explore": "orange",
    "Character": "yellow",
    "Function": "green",
    "Structure": "blue",
    "Style": "pink",
    "Organize": "purple"
  };

  const fetchSample = async () => {
    setLoading(true);
    const response = await axios.get(`${API_BASE_URL}/api/sample?full=${fullSample}`);
    setStoryElements(response.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSample();
  }, []);

  useEffect(() => {
    fetchSample();
  }, [fullSample]);

  const handleLabelClick = (label: string) => {
    setActivePopup(activePopup === label ? null : label);
  };

  const closePopup = () => {
    setActivePopup(null);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Story Telling Primer</h1>
        <p>A random card from each category has been picked for you.</p>
        <p>Can you tell a 5-minute story based on them?</p>
        <div>
          <label className="inline-flex items-center cursor-pointer">
            <input type="checkbox" value="" className="sr-only peer" 
              checked={fullSample}
              onChange={() => setFullSample(!fullSample)}
            />
            <div className="toggle-button"></div>
            <span className="toggle-text">{ fullSample ? 'All Categories' : 'Minimist' }</span>
          </label>
        </div>
        <button
          className="button green"
          onClick={() => fetchSample()}
        >
          Reroll
        </button>
      </header>
      {loading ? (
        <div className="w-full flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) :
      <main className="main">
        <div className="elements-grid">
          {storyElements.map((element) => (
            <div key={element.title} className="element-card">
              <button
                className={`label-button ${colorMap[element.category]}`}
                onClick={() => handleLabelClick(element.title)}
              >
                {element.category}
              </button>
              <div className="value">
                {element.title}
              </div>
              
              {activePopup === element.title && (
                <div className="popup-overlay" onClick={closePopup}>
                  <div className="popup" onClick={(e) => e.stopPropagation()}>
                    <div className={`popup-header ${colorMap[element.category]}`}>
                      <div className="popup-header-content">
                        <span className="popup-category">{element.category}</span>
                        <h3 className="popup-title">{element.title}</h3>
                        {element.subtitle && <p className="popup-subtitle">{element.subtitle}</p>}
                      </div>
                      <button className="close-button" onClick={closePopup}>
                        ×
                      </button>
                    </div>
                    <div className="popup-content">
                      <div className="popup-description">
                        <p>{element.description}</p>
                      </div>
                      {element.hint && (
                        <div className="popup-hint">
                          <h4>Hint</h4>
                          <p>{element.hint}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
      }
    </div>
  );
};

export default App;