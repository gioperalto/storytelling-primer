import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import CardDraw from './pages/CardDraw';
import StoryStructure from './pages/StoryStructure';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/card-draw" element={<CardDraw />} />
        <Route path="/story-structure" element={<StoryStructure />} />
      </Routes>
    </Router>
  );
};

export default App;