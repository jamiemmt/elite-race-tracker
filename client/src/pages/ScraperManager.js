import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ScraperManager = () => {
  const navigate = useNavigate();
  
  const [scrapers, setScrapers] = useState([]);
  const [selectedScraper, setSelectedScraper] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingScrapers, setFetchingScrapers] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [options, setOptions] = useState({});
  const [summary, setSummary] = useState(null);
  const [recentRaces, setRecentRaces] = useState([]);
  const [loadingRaces, setLoadingRaces] = useState(false);
  
  // Fetch available scrapers on mount
  useEffect(() => {
    const fetchScrapers = async () => {
      try {
        setFetchingScrapers(true);
        const res = await axios.get('/api/scrapers');
        setScrapers(res.data.scrapers);
        if (res.data.scrapers.length > 0) {
          setSelectedScraper(res.data.scrapers[0]);
        }
      } catch (err) {
        console.error('Error fetching scrapers:', err);
        setError('Failed to fetch available scrapers. Please try again.');
      } finally {
        setFetchingScrapers(false);
      }
    };
    
    fetchScrapers();
    fetchRecentRaces();
  }, []);
  
  // Fetch recent races to display results
  const fetchRecentRaces = async () => {
    try {
      setLoadingRaces(true);
      const res = await axios.get('/api/races?limit=10&sort=date&order=desc');
      setRecentRaces(res.data);
    } catch (err) {
      console.error('Error fetching recent races:', err);
    } finally {
      setLoadingRaces(false);
    }
  };
  
  const handleOptionChange = (key, value) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };
  
  const renderOptionsForm = () => {
    if (selectedScraper === 'bostonmarathon') {
      return (
        <Form.Group className="mb-3">
          <Form.Label>Year</Form.Label>
          <Form.Control 
            type="number" 
            placeholder="e.g. 2023" 
            value={options.year || ''} 
            onChange={(e) => handleOptionChange('year', e.target.value)}
          />
        </Form.Group>
      );
    } else if (selectedScraper === 'worldathletics') {
      return (
        <>
          <Form.Group className="mb-3">
            <Form.Label>Competition URL</Form.Label>
            <Form.Control 
              type="text" 
              placeholder="e.g. https://worldathletics.org/competition/..." 
              value={options.competitionUrl || ''} 
              onChange={(e) => handleOptionChange('competitionUrl', e.target.value)}
            />
            <Form.Text className="text-muted">
              URL to a specific World Athletics competition
            </Form.Text>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Event Name</Form.Label>
            <Form.Control 
              type="text" 
              placeholder="e.g. Men's 100m" 
              value={options.event || ''} 
              onChange={(e) => handleOptionChange('event', e.target.value)}
            />
          </Form.Group>
        </>
      );
    }
    
    return null;
  };
  
  const handleRunScraper = async () => {
    try {
      setLoading(true);
      setSuccess(null);
      setError(null);
      setSummary(null);
      
      const res = await axios.post('/api/scrapers/run', {
        source: selectedScraper,
        options
      });
      
      setSummary(res.data.summary);
      setSuccess(`Scraper ran successfully! Processed ${res.data.summary.processedResults} results.`);
      
      // Refresh the races list to show new results
      fetchRecentRaces();
    } catch (err) {
      console.error('Error running scraper:', err);
      setError(`Failed to run scraper: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateBannedAthletes = async () => {
    try {
      setLoading(true);
      setSuccess(null);
      setError(null);
      setSummary(null);
      
      const res = await axios.post('/api/scrapers/banned-athletes/update');
      
      setSummary(res.data.summary);
      setSuccess(`Banned athletes list updated! Processed ${res.data.summary.processedResults} athletes.`);
    } catch (err) {
      console.error('Error updating banned athletes:', err);
      setError(`Failed to update banned athletes: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <h1>Scraper Manager</h1>
      <p className="lead">Run scrapers to fetch live data from various sources and view the results</p>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header><h5 className="mb-0">Run Scrapers</h5></Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Select Scraper</Form.Label>
                  {fetchingScrapers ? (
                    <div className="text-center my-3">
                      <Spinner animation="border" size="sm" /> Loading scrapers...
                    </div>
                  ) : (
                    <Form.Select 
                      value={selectedScraper} 
                      onChange={(e) => setSelectedScraper(e.target.value)}
                    >
                      {scrapers.map(scraper => (
                        <option key={scraper} value={scraper}>
                          {scraper}
                        </option>
                      ))}
                    </Form.Select>
                  )}
                </Form.Group>
                
                {renderOptionsForm()}
                
                <div className="d-grid gap-2">
                  <Button 
                    variant="primary" 
                    onClick={handleRunScraper}
                    disabled={loading || !selectedScraper}
                  >
                    {loading && <Spinner animation="border" size="sm" className="me-2" />}
                    Run Scraper
                  </Button>
                  
                  <Button 
                    variant="secondary"
                    onClick={handleUpdateBannedAthletes}
                    disabled={loading}
                  >
                    Update Banned Athletes List
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
          
          {summary && (
            <Card className="mb-4">
              <Card.Header><h5 className="mb-0">Scraper Summary</h5></Card.Header>
              <Card.Body>
                <Table striped bordered hover>
                  <tbody>
                    <tr>
                      <td>Total Results</td>
                      <td>{summary.totalResults}</td>
                    </tr>
                    <tr>
                      <td>Processed Results</td>
                      <td>{summary.processedResults}</td>
                    </tr>
                    <tr>
                      <td>New Athletes</td>
                      <td>{summary.newAthletes}</td>
                    </tr>
                    <tr>
                      <td>New Races</td>
                      <td>{summary.newRaces}</td>
                    </tr>
                    <tr>
                      <td>New Results</td>
                      <td>{summary.newResults}</td>
                    </tr>
                    {summary.updatedBanStatus !== undefined && (
                      <tr>
                        <td>Updated Ban Status</td>
                        <td>{summary.updatedBanStatus}</td>
                      </tr>
                    )}
                    {summary.errors?.length > 0 && (
                      <tr>
                        <td>Errors</td>
                        <td>{summary.errors.length}</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
                
                {summary.errors?.length > 0 && (
                  <div className="mt-3">
                    <h6>Errors:</h6>
                    <ul>
                      {summary.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>
        
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Recent Races</h5>
                <Button size="sm" onClick={fetchRecentRaces} disabled={loadingRaces}>
                  {loadingRaces ? <Spinner animation="border" size="sm" /> : 'Refresh'}
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {loadingRaces ? (
                <div className="text-center my-5">
                  <Spinner animation="border" />
                  <p className="mt-2">Loading races...</p>
                </div>
              ) : recentRaces.length > 0 ? (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Date</th>
                      <th>Location</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRaces.map(race => (
                      <tr key={race._id}>
                        <td>{race.name}</td>
                        <td>{new Date(race.date).toLocaleDateString()}</td>
                        <td>{race.location}</td>
                        <td>
                          <Button 
                            size="sm" 
                            variant="info"
                            onClick={() => navigate(`/races/${race._id}`)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <Alert variant="info">
                  No races found. Run a scraper to fetch race data.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ScraperManager;
