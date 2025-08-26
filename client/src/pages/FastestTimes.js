import React, { useState, useEffect } from 'react';
import { Container, Table, Form, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaFilter, FaRunning, FaDownload } from 'react-icons/fa';
import axios from 'axios';

const FastestTimes = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [selectedDistance, setSelectedDistance] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [showBanned, setShowBanned] = useState(true);
  const [availableDistances, setAvailableDistances] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  
  // Common race distances
  const commonDistances = {
    m: [100, 200, 400, 800, 1500, 3000, 5000, 10000],
    km: [5, 10, 15, 21.1, 42.2, 50, 100],
    miles: [1, 3.1, 6.2, 13.1, 26.2, 31, 50, 62, 100]
  };

  useEffect(() => {
    const fetchRaces = async () => {
      try {
        const res = await axios.get('/api/races');
        
        // Extract unique distance combinations
        const uniqueDistances = new Set();
        res.data.forEach(race => {
          uniqueDistances.add(`${race.distance} ${race.distanceUnit}`);
        });
        
        // Convert to array and sort by distance value
        const availableDistancesArray = [...uniqueDistances].sort((a, b) => {
          const aValue = parseFloat(a.split(' ')[0]);
          const bValue = parseFloat(b.split(' ')[0]);
          return aValue - bValue;
        });
        
        setAvailableDistances(availableDistancesArray);
        
        // Extract unique years
        const uniqueYears = [...new Set(res.data.map(race => new Date(race.date).getFullYear()))]
          .sort((a, b) => b - a); // Sort descending (newest first)
        setAvailableYears(uniqueYears);
        
        // Set default year to current year if available, otherwise most recent
        const currentYear = new Date().getFullYear();
        if (uniqueYears.includes(currentYear)) {
          setYear(currentYear);
        } else if (uniqueYears.length > 0) {
          setYear(uniqueYears[0]);
        }
        
        // Set default distance if available
        if (availableDistancesArray.length > 0) {
          setSelectedDistance(availableDistancesArray[0]);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch race data. Please try again later.');
        setLoading(false);
        console.error('Error fetching races:', err);
      }
    };

    fetchRaces();
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (!selectedDistance) return;
      
      try {
        setLoading(true);
        
        // Parse distance and unit from selectedDistance
        const [distance, unit] = selectedDistance.split(' ');
        
        // Fetch results based on filter
        const endpoint = showBanned 
          ? `/api/results/fastest/${distance}/${unit}`
          : `/api/results/fastest-clean/${distance}/${unit}`;
        
        const res = await axios.get(endpoint, {
          params: { year: year }
        });
        setResults(res.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch results. Please try again later.');
        setLoading(false);
        console.error('Error fetching results:', err);
      }
    };

    fetchResults();
  }, [selectedDistance, year, showBanned]);


  const exportToCsv = () => {
    // Create CSV content
    const headers = ['Rank', 'Athlete', 'Country', 'Race', 'Date', 'Time', 'Status'];
    const csvContent = [
      headers.join(','),
      ...results.map((result, index) => {
        return [
          index + 1,
          result.athlete.name,
          result.athlete.country,
          result.race.name,
          new Date(result.race.date).toLocaleDateString(),
          result.formattedTime,
          result.athlete.isBanned ? 'BANNED' : 'Clean'
        ].join(',');
      })
    ].join('\\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `fastest-times-${selectedDistance.replace(' ', '')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Container>
      <h1 className="page-header">Fastest Times</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">
            <FaFilter className="me-2" /> Filter Results
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Year</Form.Label>
                <Form.Select 
                  value={year} 
                  onChange={(e) => setYear(parseInt(e.target.value))}
                >
                  {availableYears.map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                  {availableYears.length === 0 && (
                    <option value="">No years available</option>
                  )}
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Distance</Form.Label>
                <Form.Select 
                  value={selectedDistance} 
                  onChange={(e) => setSelectedDistance(e.target.value)}
                  disabled={availableDistances.length === 0}
                >
                  {availableDistances.map(dist => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                  {availableDistances.length === 0 && (
                    <option value="">No races available</option>
                  )}
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Athlete Status</Form.Label>
                <div>
                  <Form.Check 
                    type="switch"
                    id="show-banned-switch"
                    label="Show Banned Athletes"
                    checked={showBanned}
                    onChange={() => setShowBanned(!showBanned)}
                  />
                </div>
              </Form.Group>
            </Col>
          </Row>
          
          {results.length > 0 && (
            <div className="text-end">
              <Button variant="outline-secondary" onClick={exportToCsv}>
                <FaDownload className="me-1" /> Export to CSV
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading fastest times...</p>
        </div>
      ) : results.length > 0 ? (
        <Card>
          <Card.Header>
            <h5 className="mb-0">
              <FaRunning className="me-2" /> 
              Fastest Times: {selectedDistance} ({year})
              {!showBanned && ' (Clean Athletes Only)'}
            </h5>
          </Card.Header>
          <Card.Body className="p-0">
            <Table striped bordered hover responsive className="mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Athlete</th>
                  <th>Country</th>
                  <th>Race</th>
                  <th>Date</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr 
                    key={result._id}
                    className={result.athlete.isBanned ? 'banned-row' : ''}
                  >
                    <td>{index + 1}</td>
                    <td>
                      <Link to={`/athletes/${result.athlete._id}`}>
                        <span className={result.athlete.isBanned ? 'banned' : ''}>
                          {result.athlete.name}
                          {result.athlete.isBanned && ' (BANNED)'}
                        </span>
                      </Link>
                    </td>
                    <td>{result.athlete.country}</td>
                    <td>
                      <Link to={`/races/${result.race._id}`}>
                        {result.race.name}
                      </Link>
                    </td>
                    <td>{new Date(result.race.date).toLocaleDateString()}</td>
                    <td className={result.athlete.isBanned ? 'banned' : ''}>
                      {result.formattedTime}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      ) : (
        <Alert variant="info">
          No results found for {selectedDistance}. Try selecting a different distance or adding race results.
        </Alert>
      )}
    </Container>
  );
};

export default FastestTimes;
