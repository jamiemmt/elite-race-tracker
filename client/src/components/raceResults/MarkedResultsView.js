import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RaceResultsBase from './RaceResultsBase';
import { Alert, Modal, Button, ListGroup } from 'react-bootstrap';

/**
 * View component for "marked" race results - shows banned athletes struck out with ban details
 */
const MarkedResultsView = ({ raceId }) => {
  const [race, setRace] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBan, setSelectedBan] = useState(null);
  
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        
        // Fetch race details
        const raceResponse = await axios.get(`/api/races/${raceId}`);
        
        // Fetch marked results that include banned athletes but with flags
        const resultsResponse = await axios.get(`/api/race-results/races/${raceId}/results/marked`);
        
        setRace(raceResponse.data);
        setResults(resultsResponse.data);
      } catch (err) {
        console.error('Error fetching marked race results:', err);
        setError('Failed to load race results. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (raceId) {
      fetchResults();
    }
  }, [raceId]);
  
  // Handler for clicking on a banned athlete link
  const handleBanClick = (athlete) => {
    setSelectedBan(athlete);
  };
  
  // Format ban dates
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Calculate ban duration
  const calculateDuration = (startDate, endDate) => {
    if (!startDate) return 'Unknown';
    
    const start = new Date(startDate);
    let end;
    
    if (!endDate) {
      return 'Lifetime';
    } else {
      end = new Date(endDate);
      
      // Calculate the time difference in milliseconds
      const diffTime = Math.abs(end - start);
      
      // Convert to days
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Format as years and months if longer than 60 days
      if (diffDays > 60) {
        const years = Math.floor(diffDays / 365);
        const months = Math.floor((diffDays % 365) / 30);
        
        if (years > 0) {
          return `${years} year${years !== 1 ? 's' : ''}${months > 0 ? `, ${months} month${months !== 1 ? 's' : ''}` : ''}`;
        } else {
          return `${months} month${months !== 1 ? 's' : ''}`;
        }
      } else {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
      }
    }
  };
  
  // Check if athlete is currently banned
  const isCurrentlyBanned = (startDate, endDate) => {
    if (!startDate) return false;
    
    const start = new Date(startDate);
    const now = new Date();
    
    // If no end date, it's a lifetime ban
    if (!endDate) return true;
    
    const end = new Date(endDate);
    
    // Banned if current date is between start and end dates
    return now >= start && now <= end;
  };
  
  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }
  
  // Create custom render function for displaying results
  const renderResults = () => {
    if (loading) return <div className="text-center my-5">Loading race results...</div>;
    if (!race || !results || results.length === 0) {
      return <div className="text-center my-5">No results available</div>;
    }
    
    return (
      <RaceResultsBase 
        race={race} 
        results={results} 
        showBanned={true}
        showCorrectedPositions={true}
        onBanClick={handleBanClick}
      />
    );
  };
  
  return (
    <div>
      <div className="mb-3">
        <h3>Marked Results View</h3>
        <p className="text-muted">
          This view includes all athletes but marks banned athletes with strikethrough text.
          Both original and corrected placements are shown.
          Click on the "Banned" icon to view ban details.
        </p>
      </div>
      
      {renderResults()}
      
      {/* Ban Details Modal */}
      <Modal show={!!selectedBan} onHide={() => setSelectedBan(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Ban Details: {selectedBan?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedBan?.banDetails?.map((ban, index) => (
            <div key={index} className="mb-3">
              <h5>Ban #{index + 1}</h5>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>Start Date:</strong> {formatDate(ban.startDate || ban.banStartDate)}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>End Date:</strong> {ban.endDate || ban.banEndDate ? formatDate(ban.endDate || ban.banEndDate) : 'Lifetime Ban'}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Duration:</strong> {calculateDuration(ban.startDate || ban.banStartDate, ban.endDate || ban.banEndDate)}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Status:</strong> {isCurrentlyBanned(ban.startDate || ban.banStartDate, ban.endDate || ban.banEndDate) ? 
                    <span className="text-danger font-weight-bold">Currently Banned</span> : 
                    <span className="text-success">Ban Completed</span>}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Reason:</strong> {ban.reason || ban.banReason || 'Not specified'}
                </ListGroup.Item>
                {ban.substance && (
                  <ListGroup.Item>
                    <strong>Substance:</strong> {ban.substance}
                  </ListGroup.Item>
                )}
                {ban.decision && (
                  <ListGroup.Item>
                    <strong>Decision:</strong> {ban.decision}
                  </ListGroup.Item>
                )}
              </ListGroup>
            </div>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSelectedBan(null)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MarkedResultsView;
