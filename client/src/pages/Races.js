import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaSearch, FaPlus, FaCalendarAlt, FaMapMarkerAlt, FaRunning } from 'react-icons/fa';
import axios from 'axios';

const Races = () => {
  const [races, setRaces] = useState([]);
  const [filteredRaces, setFilteredRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [distanceFilter, setDistanceFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  
  // Unique filters
  const [categories, setCategories] = useState([]);
  const [distances, setDistances] = useState({});

  useEffect(() => {
    const fetchRaces = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/races');
        setRaces(res.data);
        setFilteredRaces(res.data);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(res.data.map(race => race.category))].sort();
        setCategories(uniqueCategories);
        
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
        const distancesObj = {};
        Object.keys(uniqueDistances).forEach(unit => {
          distancesObj[unit] = [...uniqueDistances[unit]].sort((a, b) => a - b);
        });
        
        setDistances(distancesObj);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch races. Please try again later.');
        setLoading(false);
        console.error('Error fetching races:', err);
      }
    };

    fetchRaces();
  }, []);

  useEffect(() => {
    // Apply filters
    let result = races;
    
    // Apply search term filter
    if (searchTerm) {
      result = result.filter(race => 
        race.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        race.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (categoryFilter) {
      result = result.filter(race => race.category === categoryFilter);
    }
    
    // Apply distance and unit filter
    if (distanceFilter && unitFilter) {
      result = result.filter(race => 
        race.distance.toString() === distanceFilter && race.distanceUnit === unitFilter
      );
    }
    
    setFilteredRaces(result);
  }, [searchTerm, categoryFilter, distanceFilter, unitFilter, races]);

  const handleUnitChange = (e) => {
    const newUnit = e.target.value;
    setUnitFilter(newUnit);
    setDistanceFilter('');
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <Container>
        <div className="text-center my-5">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading races...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-header">Races</h1>
        <Link to="/races/add">
          <Button variant="success">
            <FaPlus className="me-2" /> Add New Race
          </Button>
        </Link>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="filter-section mb-4">
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Search Races</Form.Label>
              <div className="input-group">
                <span className="input-group-text">
                  <FaSearch />
                </span>
                <Form.Control
                  type="text"
                  placeholder="Search by name or location"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group className="mb-3">
              <Form.Label>Filter by Category</Form.Label>
              <Form.Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={5}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Distance Unit</Form.Label>
                  <Form.Select
                    value={unitFilter}
                    onChange={handleUnitChange}
                  >
                    <option value="">All Units</option>
                    <option value="m">Meters (m)</option>
                    <option value="km">Kilometers (km)</option>
                    <option value="miles">Miles</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Distance</Form.Label>
                  <Form.Select
                    value={distanceFilter}
                    onChange={(e) => setDistanceFilter(e.target.value)}
                    disabled={!unitFilter || !distances[unitFilter] || distances[unitFilter].length === 0}
                  >
                    <option value="">All Distances</option>
                    {unitFilter && distances[unitFilter] && distances[unitFilter].map(dist => (
                      <option key={dist} value={dist.toString()}>{dist} {unitFilter}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>

      {filteredRaces.length === 0 ? (
        <Alert variant="info">
          No races found matching your criteria. Try adjusting your filters or add a new race.
        </Alert>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {filteredRaces.map(race => (
            <Col key={race._id}>
              <Card className="race-card h-100">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <Badge bg="primary">{race.category}</Badge>
                  <Badge bg="secondary">
                    {race.distance} {race.distanceUnit}
                  </Badge>
                </Card.Header>
                <Card.Body>
                  <Card.Title>{race.name}</Card.Title>
                  <Card.Text>
                    <FaCalendarAlt className="me-2" />
                    {formatDate(race.date)}
                  </Card.Text>
                  <Card.Text>
                    <FaMapMarkerAlt className="me-2" />
                    {race.location}
                  </Card.Text>
                  <Card.Text>
                    <FaRunning className="me-2" />
                    {race.gender} Event
                  </Card.Text>
                </Card.Body>
                <Card.Footer>
                  <Link to={`/races/${race._id}`}>
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

export default Races;
