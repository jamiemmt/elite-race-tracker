import React from 'react';
import { Table, Container, Card, Row, Col } from 'react-bootstrap';
import { formatTime } from '../../utils/timeFormatter';

/**
 * Base component for displaying race results
 * Used by both clean and marked results views
 */
const RaceResultsBase = ({ 
  race, 
  results, 
  showBanned = true,
  showCorrectedPositions = false,
  loading = false,
  onBanClick = null // Add handler for ban clicks
}) => {
  if (loading) {
    return <div className="text-center my-5">Loading race results...</div>;
  }
  
  if (!race || !results || results.length === 0) {
    return <div className="text-center my-5">No results available</div>;
  }
  
  // Format date
  const raceDate = new Date(race.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Format distance
  const formatDistance = (meters) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`;
    }
    return `${meters}m`;
  };
  
  // Group results by gender
  const groupedResults = {
    Male: results.filter(result => result.athlete.gender === 'Male'),
    Female: results.filter(result => result.athlete.gender === 'Female'),
    Nonbinary: results.filter(result => result.athlete.gender !== 'Male' && result.athlete.gender !== 'Female')
  };

  // Render results table for a specific gender
  const renderResultsTable = (genderResults, genderLabel) => {
    if (!genderResults || genderResults.length === 0) return null;
    
    return (
      <div className="mb-4">
        <h3>{genderLabel} Results</h3>
        <Table striped responsive>
          <thead>
            <tr>
              <th>Place</th>
              {showCorrectedPositions && <th>Corrected Place</th>}
              <th>Athlete</th>
              <th>Country</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {genderResults.map((result) => (
              <tr key={result._id || result.id} className={result.banned ? 'text-muted' : ''}>
                <td>{result.position || result.originalPosition}</td>
                {showCorrectedPositions && (
                  <td>{result.correctedPosition || '-'}</td>
                )}
                <td>
                  {result.banned && showBanned ? (
                    <span className="text-decoration-line-through">
                      {result.athlete.name}
                    </span>
                  ) : (
                    result.athlete.name
                  )}
                </td>
                <td>{result.athlete.country}</td>
                <td>{formatTime(result.finishTime || result.time)}</td>
                {result.banned && showBanned && (
                  <td>
                    {onBanClick ? (
                      <span 
                        className="text-danger cursor-pointer"
                        onClick={() => onBanClick(result.athlete)}
                        style={{ cursor: 'pointer' }}
                        title="View ban details"
                      >
                        ⚠️ Banned
                      </span>
                    ) : (
                      <a href={`/athletes/${result.athlete._id}/bans`} 
                         title="View ban details">
                        ⚠️ Banned
                      </a>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  return (
    <Container className="my-4">
      <Card className="mb-4 shadow-sm">
        <Card.Header>
          <h2>{race.name}</h2>
          <p className="mb-0 text-muted">{raceDate} | {formatDistance(race.distance)} | {race.location}</p>
        </Card.Header>
        <Card.Body>
          {renderResultsTable(groupedResults.Male, 'Male')}
          {renderResultsTable(groupedResults.Female, 'Female')}
          {renderResultsTable(groupedResults.Nonbinary, 'Nonbinary')}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default RaceResultsBase;
