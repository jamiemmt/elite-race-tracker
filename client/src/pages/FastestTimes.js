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
  const [distance, setDistance] = useState('');
  const [unit, setUnit] = useState('m');
  const [showBanned, setShowBanned] = useState(true);
  const [availableDistances, setAvailableDistances] = useState([]);
  
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
        
        // Extract unique distances with their units
        const uniqueDistances = {};
        res.data.forEach(race => {
          const key = race.distanceUnit;
          if (!uniqueDistances[key]) {
            uniqueDistances[key] = new Set();
          }
          uniqueDistances[key].add(race.distance);
        });
        
        // Convert to array and sort
        const availableDistancesObj = {};
        Object.keys(uniqueDistances).forEach(unit => {
          availableDistancesObj[unit] = [...uniqueDistances[unit]].sort((a, b) => a - b);
        });
        
        setAvailableDistances(availableDistancesObj);
        
        // Set default distance if available
        if (availableDistancesObj.m && availableDistancesObj.m.length > 0) {
          setDistance(availableDistancesObj.m[0].toString());
          setUnit('m');
        } else if (availableDistancesObj.km && availableDistancesObj.km.length > 0) {
          setDistance(availableDistancesObj.km[0].toString());
          setUnit('km');
        } else if (availableDistancesObj.miles && availableDistancesObj.miles.length > 0) {
          setDistance(availableDistancesObj.miles[0].toString());
          setUnit('miles');
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
      if (!distance) return;
      
      try {
        setLoading(true);
        
        // Fetch results based on filter
        const endpoint = showBanned 
          ? `/api/results/fastest/${distance}/${unit}`
          : `/api/results/fastest-clean/${distance}/${unit}`;
        
        const res = await axios.get(endpoint);
        setResults(res.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch results. Please try again later.');
        setLoading(false);
        console.error('Error fetching results:', err);
      }
    };

    fetchResults();
  }, [distance, unit, showBanned]);

  const handleUnitChange = (e) => {
    const newUnit = e.target.value;
    setUnit(newUnit);
    
    // Reset distance when unit changes
    if (availableDistances[newUnit] && availableDistances[newUnit].length > 0) {
      setDistance(availableDistances[newUnit][0].toString());
    } else {
      setDistance('');
    }
  };

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
    link.setAttribute('download', `fastest-times-${distance}${unit}.csv`);
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
                <Form.Label>Distance Unit</Form.Label>
                <Form.Select 
                  value={unit} 
                  onChange={handleUnitChange}
                >
                  <option value="m">Meters (m)</option>
                  <option value="km">Kilometers (km)</option>
                  <option value="miles">Miles</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Distance</Form.Label>
                <Form.Select 
                  value={distance} 
                  onChange={(e) => setDistance(e.target.value)}
                  disabled={!availableDistances[unit] || availableDistances[unit].length === 0}
                >
                  {availableDistances[unit] && availableDistances[unit].map(dist => (
                    <option key={dist} value={dist}>{dist} {unit}</option>
                  ))}
                  {(!availableDistances[unit] || availableDistances[unit].length === 0) && (
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
                    label="Show Banned Athletes (Hidden by Default)"
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
              Fastest Times: {distance} {unit}
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
          No results found for {distance} {unit}. Try selecting a different distance or adding race results.
        </Alert>
      )}
    </Container>
  );
};

export default FastestTimes;
