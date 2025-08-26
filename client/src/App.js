import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/App.css';

// Components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Pages
import Home from './pages/Home';
import Athletes from './pages/Athletes';
import AthleteDetail from './pages/AthleteDetail';
import Races from './pages/Races';
import RaceDetail from './pages/RaceDetail';
import Results from './pages/Results';
import FastestTimes from './pages/FastestTimes';
import BannedAthletes from './pages/BannedAthletes';
import AddAthlete from './pages/AddAthlete';
import AddRace from './pages/AddRace';
import AddResult from './pages/AddResult';
import ScraperManager from './pages/ScraperManager';
import NotFound from './pages/NotFound';

// Race Results Components
import RaceResultsContainer from './components/raceResults/RaceResultsContainer';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Header />
        <main className="container py-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/athletes" element={<Athletes />} />
            <Route path="/athletes/:id" element={<AthleteDetail />} />
            <Route path="/athletes/add" element={<AddAthlete />} />
            <Route path="/races" element={<Races />} />
            <Route path="/races/:id" element={<RaceDetail />} />
            <Route path="/races/:raceId/results" element={<RaceResultsContainer />} />
            <Route path="/races/add" element={<AddRace />} />
            <Route path="/results" element={<Results />} />
            <Route path="/results/add" element={<AddResult />} />
            <Route path="/fastest-times" element={<FastestTimes />} />
            <Route path="/banned-athletes" element={<BannedAthletes />} />
            <Route path="/scrapers" element={<ScraperManager />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
