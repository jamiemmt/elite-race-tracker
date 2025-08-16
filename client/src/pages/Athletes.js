import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaSearch, FaUserPlus, FaUserTimes, FaUserCheck } from 'react-icons/fa';
import axios from 'axios';

const Athletes = () => {
  const [athletes, setAthletes] = useState([]);
  const [filteredAthletes, setFilteredAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBanned, setShowBanned] = useState(false); // Default to exclude banned athletes
  const [showClean, setShowClean] = useState(true);
  const [countryFilter, setCountryFilter] = useState('');
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    const fetchAthletes = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/athletes');
        setAthletes(res.data);
        setFilteredAthletes(res.data);
        
        // Extract unique countries for filter
        const uniqueCountries = [...new Set(res.data.map(athlete => athlete.country))].sort();
        setCountries(uniqueCountries);
        
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch athletes. Please try again later.');
        setLoading(false);
        console.error('Error fetching athletes:', err);
      }
    };

    fetchAthletes();
  }, []);

  useEffect(() => {
    // Apply filters
    let result = athletes;
    
    // Apply search term filter
    if (searchTerm) {
      result = result.filter(athlete => 
        athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        athlete.country.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply banned/clean filter
    if (!showBanned) {
      result = result.filter(athlete => !athlete.isBanned);
    }
    
    if (!showClean) {
      result = result.filter(athlete => athlete.isBanned);
    }
    
    // Apply country filter
    if (countryFilter) {
      result = result.filter(athlete => athlete.country === countryFilter);
    }
    
    setFilteredAthletes(result);
  }, [searchTerm, showBanned, showClean, countryFilter, athletes]);

  const handleToggleBan = async (id, currentStatus) => {
    try {
      await axios.patch(`/api/athletes/${id}/toggle-ban`, {
        reason: currentStatus ? '' : 'Manually banned through admin interface'
      });
      
      // Update local state
      setAthletes(athletes.map(athlete => 
        athlete._id === id 
          ? { ...athlete, isBanned: !athlete.isBanned } 
          : athlete
      ));
    } catch (err) {
      setError('Failed to update athlete ban status. Please try again.');
      console.error('Error toggling ban status:', err);
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="text-center my-5">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading athletes...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-header">Athletes</h1>
        <Link to="/athletes/add">
          <Button variant="success">
            <FaUserPlus className="me-2" /> Add New Athlete
          </Button>
        </Link>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="filter-section mb-4">
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Search Athletes</Form.Label>
              <div className="input-group">
                <span className="input-group-text">
                  <FaSearch />
                </span>
                <Form.Control
                  type="text"
                  placeholder="Search by name or country"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group className="mb-3">
              <Form.Label>Filter by Country</Form.Label>
              <Form.Select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
              >
                <option value="">All Countries</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={5}>
            <Form.Label>Show/Hide Athletes</Form.Label>
            <div className="d-flex gap-3">
              <Form.Check 
                type="checkbox" 
                label="Show Banned Athletes" 
                checked={showBanned}
                onChange={() => setShowBanned(!showBanned)}
                id="show-banned"
              />
              <Form.Check 
                type="checkbox" 
                label="Show Clean Athletes" 
                checked={showClean}
                onChange={() => setShowClean(!showClean)}
                id="show-clean"
              />
            </div>
          </Col>
        </Row>
      </div>

      {filteredAthletes.length === 0 ? (
        <Alert variant="info">
          No athletes found matching your criteria. Try adjusting your filters or add a new athlete.
        </Alert>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {filteredAthletes.map(athlete => (
            <Col key={athlete._id}>
              <Card className={`athlete-card h-100 ${athlete.isBanned ? 'banned' : ''}`}>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div>
                    {athlete.isBanned && (
                      <Badge bg="danger" className="me-2">Banned</Badge>
                    )}
                    <span className="fw-bold">{athlete.country}</span>
                  </div>
                  <Button
                    variant={athlete.isBanned ? "outline-success" : "outline-danger"}
                    size="sm"
                    onClick={() => handleToggleBan(athlete._id, athlete.isBanned)}
                  >
                    {athlete.isBanned ? (
                      <>
                        <FaUserCheck className="me-1" /> Unban
                      </>
                    ) : (
                      <>
                        <FaUserTimes className="me-1" /> Ban
                      </>
                    )}
                  </Button>
                </Card.Header>
                <Card.Body>
                  <Card.Title className={athlete.isBanned ? 'banned' : ''}>
                    {athlete.name}
                  </Card.Title>
                  {athlete.dateOfBirth && (
                    <Card.Text>
                      Born: {new Date(athlete.dateOfBirth).toLocaleDateString()}
                    </Card.Text>
                  )}
                  <Card.Text>
                    Gender: {athlete.gender}
                  </Card.Text>
                  {athlete.banHistory && athlete.banHistory.length > 0 && (
                    <Card.Text>
                      Ban History: {athlete.banHistory.length} record(s)
                    </Card.Text>
                  )}
                </Card.Body>
                <Card.Footer>
                  <Link to={`/athletes/${athlete._id}`}>
                    <Button variant="primary" size="sm">View Details</Button>
                  </Link>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default Athletes;
