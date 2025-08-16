import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RaceResultsBase from './RaceResultsBase';
import { Alert } from 'react-bootstrap';

/**
 * View component for "clean" race results - completely removes banned athletes
 */
const CleanResultsView = ({ raceId }) => {
  const [race, setRace] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        
        // Fetch race details
        const raceResponse = await axios.get(`/api/races/${raceId}`);
        
        // Fetch clean results that exclude banned athletes
        const resultsResponse = await axios.get(`/api/race-results/races/${raceId}/results/clean`);
        
        setRace(raceResponse.data);
        setResults(resultsResponse.data);
      } catch (err) {
        console.error('Error fetching clean race results:', err);
        setError('Failed to load race results. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (raceId) {
      fetchResults();
    }
  }, [raceId]);
  
  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }
  
  return (
    <div>
      <div className="mb-3">
        <h3>Clean Results View</h3>
        <p className="text-muted">
          This view excludes all athletes who have ever served a ban.
          Placements are calculated as if banned athletes never participated.
        </p>
      </div>
      
      <RaceResultsBase 
        race={race} 
        results={results} 
        showBanned={false} 
        loading={loading} 
      />
    </div>
  );
};

export default CleanResultsView;
