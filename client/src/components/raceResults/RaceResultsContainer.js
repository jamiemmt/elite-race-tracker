import React, { useState, useEffect } from 'react';
import { Container, ButtonGroup, ToggleButton, Card, Alert } from 'react-bootstrap';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import CleanResultsView from './CleanResultsView';
import MarkedResultsView from './MarkedResultsView';

/**
 * Container component that lets users switch between the two race result views
 */
const RaceResultsContainer = () => {
  const { raceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Parse view type from URL query params or default to 'clean'
  const queryParams = new URLSearchParams(location.search);
  const defaultView = queryParams.get('view') || 'clean';
  
  const [viewType, setViewType] = useState(defaultView);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchRace = async () => {
      try {
        setLoading(true);
        await axios.get(`/api/races/${raceId}`);
      } catch (err) {
        console.error('Error fetching race:', err);
        setError('Failed to load race details');
      } finally {
        setLoading(false);
      }
    };
    
    if (raceId) {
      fetchRace();
    }
  }, [raceId]);
  
  // Update URL when view type changes
  useEffect(() => {
    const newQueryParams = new URLSearchParams(location.search);
    newQueryParams.set('view', viewType);
    navigate(`${location.pathname}?${newQueryParams.toString()}`);
  }, [viewType, navigate, location.pathname, location.search]);
  
  const handleViewChange = (e) => {
    setViewType(e.currentTarget.value);
  };
  
  if (loading) {
    return (
      <Container className="my-5">
        <div className="text-center">
          <p>Loading race details...</p>
        </div>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }
  
  return (
    <Container className="my-5">
      <Card className="mb-4 shadow">
        <Card.Header className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="mb-0">Race Results</h2>
            <ButtonGroup>
              <ToggleButton
                id="view-clean"
                type="radio"
                variant="outline-light"
                name="view-type"
                value="clean"
                checked={viewType === 'clean'}
                onChange={handleViewChange}
              >
                Clean View
              </ToggleButton>
              <ToggleButton
                id="view-marked"
                type="radio"
                variant="outline-light"
                name="view-type"
                value="marked"
                checked={viewType === 'marked'}
                onChange={handleViewChange}
              >
                Marked View
              </ToggleButton>
            </ButtonGroup>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="mb-4">
            {viewType === 'clean' && (
              <Alert variant="info">
                <strong>Clean View:</strong> Shows results with all banned athletes completely removed.
                Positions are recalculated as if banned athletes never participated.
              </Alert>
            )}
            {viewType === 'marked' && (
              <Alert variant="info">
                <strong>Marked View:</strong> Shows all athletes with banned athletes struck out.
                Displays both original and corrected positions.
              </Alert>
            )}
          </div>
          
          {viewType === 'clean' ? (
            <CleanResultsView raceId={raceId} />
          ) : (
            <MarkedResultsView raceId={raceId} />
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default RaceResultsContainer;
