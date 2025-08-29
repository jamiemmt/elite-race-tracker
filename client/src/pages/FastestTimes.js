import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Table, Alert, Spinner, Button, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaFilter, FaRunning, FaDownload, FaTrophy } from 'react-icons/fa';
import axios from 'axios';

const FastestTimes = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [selectedEvent, setSelectedEvent] = useState('42195m');
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedGender, setSelectedGender] = useState('Male');
  const [showBannedOnly, setShowBannedOnly] = useState(false);
  const [availableEvents, setAvailableEvents] = useState([]);
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
        
        // Extract unique event combinations
        const uniqueEvents = new Set();
        res.data.forEach(race => {
          uniqueEvents.add(`${race.distance} ${race.distanceUnit}`);
        });
        
        // Convert to array and sort by distance value
        const availableEventsArray = [...uniqueEvents].sort((a, b) => {
          const aValue = parseFloat(a.split(' ')[0]);
          const bValue = parseFloat(b.split(' ')[0]);
          return aValue - bValue;
        });
        
        setAvailableEvents(availableEventsArray);
        
        // Extract unique years
        const uniqueYears = [...new Set(res.data.map(race => new Date(race.date).getFullYear()))]
          .sort((a, b) => b - a); // Sort descending (newest first)
        setAvailableYears(uniqueYears);
        
        // Set default year to current year if available, otherwise most recent
        const currentYear = new Date().getFullYear();
        if (uniqueYears.includes(currentYear)) {
          setSelectedYear(currentYear.toString());
        } else if (uniqueYears.length > 0) {
          setSelectedYear(uniqueYears[0].toString());
        }
        
        // Set default event if available
        if (availableEventsArray.length > 0) {
          setSelectedEvent(availableEventsArray[0]);
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

  const fetchResults = useCallback(async () => {
    if (!selectedEvent) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [distance, unit] = selectedEvent.match(/^(\d+(?:\.\d+)?)([a-z]+)$/).slice(1);
      const response = await axios.get(`/api/results/fastest/${distance}/${unit}`, {
        params: { year: selectedYear, gender: selectedGender }
      });
      
      let filteredResults = response.data;
      
      if (showBannedOnly) {
        filteredResults = filteredResults.filter(result => 
          result.athlete && (result.athlete.isBanned || result.athlete.isProvisionallyBanned)
        );
      }
      
      setResults(filteredResults);
    } catch (err) {
      console.error('Error fetching results:', err);
      setError('Failed to load fastest times');
    } finally {
      setLoading(false);
    }
  }, [selectedEvent, selectedYear, selectedGender, showBannedOnly]);

  useEffect(() => {
    fetchResults();
  }, [selectedEvent, selectedYear, selectedGender, showBannedOnly, fetchResults]);


  const exportToCsv = () => {
    // Create CSV content
    const headers = ['Rank', 'Athlete', 'Country', 'Race', 'Date', 'Time', 'Status'];
    const csvContent = [
      headers.join(','),
      ...results.map((result, index) => {
        return [
          index + 1,
          `"${result.athlete.name}"`,
          `"${result.athlete.country}"`,
          `"${result.race.name}"`,
          new Date(result.race.date).toLocaleDateString(),
          result.formattedTime,
          result.athlete.isBanned ? 'Banned' : 'Clean'
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fastest-times-${selectedEvent}-${selectedYear}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading fastest times...</p>
      </Container>
    );
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-header">
          <FaTrophy className="me-2 text-warning" />
          Fastest Times
        </h1>
        {results.length > 0 && (
          <Button variant="outline-secondary" onClick={exportToCsv}>
            <FaDownload className="me-1" /> Export CSV
          </Button>
        )}
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">
            <FaFilter className="me-2" /> Filter Results
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <div className="col-md-2">
              <label htmlFor="yearSelect" className="form-label">Year</label>
              <select 
                id="yearSelect"
                className="form-select" 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div className="col-md-2">
              <label htmlFor="genderSelect" className="form-label">Gender</label>
              <select 
                id="genderSelect"
                className="form-select" 
                value={selectedGender} 
                onChange={(e) => setSelectedGender(e.target.value)}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            
            <div className="col-md-4">
              <label htmlFor="eventSelect" className="form-label">Event</label>
              <select 
                id="eventSelect"
                className="form-select" 
                value={selectedEvent} 
                onChange={(e) => setSelectedEvent(e.target.value)}
                disabled={availableEvents.length === 0}
              >
                {availableEvents.map(event => (
                  <option key={event} value={event}>{event}</option>
                ))}
                {availableEvents.length === 0 && (
                  <option value="">No races available</option>
                )}
              </select>
            </div>
            
            <div className="col-md-4">
              <label className="form-label">Athlete Status</label>
              <div className="form-check form-switch">
                <input 
                  className="form-check-input"
                  type="checkbox"
                  id="show-banned-switch"
                  checked={showBannedOnly}
                  onChange={(e) => setShowBannedOnly(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="show-banned-switch">
                  Show Banned/Suspended Athletes Only
                </label>
              </div>
            </div>
          </Row>
        </Card.Body>
      </Card>

      {results.length > 0 ? (
        <Card>
          <Card.Header>
            <h5 className="mb-0">
              Fastest Times for {selectedEvent} ({results.length} results)
            </h5>
          </Card.Header>
          <Card.Body className="p-0">
            <Table responsive striped hover>
              <thead className="table-dark">
                <tr>
                  <th>Rank</th>
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
                    className={result.athlete.isBanned || result.athlete.isProvisionallyBanned ? 'banned-row' : ''}
                  >
                    <td>{index + 1}</td>
                    <td>
                      <Link to={`/athletes/${result.athlete._id}`}>
                        <span className={result.athlete.isBanned || result.athlete.isProvisionallyBanned ? 'banned' : ''}>
                          {result.athlete.name}
                          {(result.athlete.isBanned || result.athlete.isProvisionallyBanned) && (
                            <div className="banned-athlete-info mt-2">
                              <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                                {result.athlete.isBanned && (
                                  <Badge variant="danger">
                                    <FaExclamationTriangle className="me-1" />
                                    BANNED
                                  </Badge>
                                )}
                                {result.athlete.isProvisionallyBanned && (
                                  <Badge variant="warning">
                                    PROVISIONAL
                                  </Badge>
                                )}
                                {result.athlete.banAgency && (
                                  <Badge variant="secondary">
                                    {result.athlete.banAgency}
                                  </Badge>
                                )}
                              </div>
                              {(result.athlete.banReason || result.athlete.banType || result.athlete.banSource) && (
                                <div className="banned-details small text-muted">
                                  {result.athlete.banReason && (
                                    <div><strong>Reason:</strong> {result.athlete.banReason}</div>
                                  )}
                                  {result.athlete.banType && result.athlete.banType !== 'Various violations' && (
                                    <div><strong>Substance/Violation:</strong> {result.athlete.banType}</div>
                                  )}
                                  {result.athlete.banSource && (
                                    <div><strong>Source:</strong> {result.athlete.banSource}</div>
                                  )}
                                  {result.athlete.banStatus && (
                                    <div><strong>Status:</strong> {result.athlete.banStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
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
          No results found for {selectedEvent}. Try selecting a different event or adding race results.
        </Alert>
      )}
    </Container>
  );
};

export default FastestTimes;
