import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Form, Badge, Spinner, Alert, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaSearch, FaPlus } from 'react-icons/fa';
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
  const [groupBy, setGroupBy] = useState('meeting'); // 'meeting' | 'date'
  const [disciplineAsc, setDisciplineAsc] = useState(true);

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

  const formatDateShort = (dateString) => {
    const d = new Date(dateString);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const extractMeetingName = (race) => {
    // If race.name contains " - ", treat the first segment as meeting name
    if (race?.name && race.name.includes(' - ')) {
      return race.name.split(' - ')[0];
    }
    // Fallback: use location + year
    const year = new Date(race.date).getFullYear();
    return `${race.location || 'Unknown'} ${year}`;
  };

  const extractDiscipline = (race) => {
    if (race?.name && race.name.includes(' - ')) {
      return race.name.split(' - ').slice(1).join(' - ');
    }
    // Fallback to distance/gender
    return `${race.gender || ''} ${race.distance || ''}${race.distanceUnit || ''}`.trim();
  };

  const groupedAndSorted = React.useMemo(() => {
    // Group races by meeting or date
    const groups = {};
    const makeKey = (race) => groupBy === 'meeting' ? extractMeetingName(race) : formatDateShort(race.date);
    filteredRaces.forEach(r => {
      const key = makeKey(r);
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });

    // Sort groups by date ascending
    const groupEntries = Object.entries(groups).sort((a, b) => {
      const aMin = Math.min(...a[1].map(r => new Date(r.date).getTime()));
      const bMin = Math.min(...b[1].map(r => new Date(r.date).getTime()));
      return aMin - bMin;
    });

    // Sort items within each group by discipline
    const sortedGroups = groupEntries.map(([key, items]) => {
      const sortedItems = [...items].sort((ra, rb) => {
        const da = extractDiscipline(ra).toLowerCase();
        const db = extractDiscipline(rb).toLowerCase();
        if (da < db) return disciplineAsc ? -1 : 1;
        if (da > db) return disciplineAsc ? 1 : -1;
        return 0;
      });
      return [key, sortedItems];
    });

    return sortedGroups;
  }, [filteredRaces, groupBy, disciplineAsc]);

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
        <Row>
          <Col md={3}>
            <Form.Group className="mb-3">
              <Form.Label>Group By</Form.Label>
              <Form.Select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                <option value="meeting">Meeting</option>
                <option value="date">Date</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={9} className="d-flex align-items-end justify-content-end">
            <small className="text-muted me-2">Click the Discipline header to sort {disciplineAsc ? '▲' : '▼'}</small>
          </Col>
        </Row>
      </div>

      {filteredRaces.length === 0 ? (
        <Alert variant="info">
          No races found matching your criteria. Try adjusting your filters or add a new race.
        </Alert>
      ) : (
        <div className="race-table-wrapper">
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th style={{ width: '18%' }}>Date</th>
                <th style={{ width: '26%' }}>Meeting</th>
                <th style={{ width: '24%', cursor: 'pointer' }} onClick={() => setDisciplineAsc(!disciplineAsc)}>
                  Discipline {disciplineAsc ? '▲' : '▼'}
                </th>
                <th style={{ width: '10%' }}>Distance</th>
                <th style={{ width: '8%' }}>Gender</th>
                <th>Location</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {groupedAndSorted.map(([groupKey, items]) => (
                <React.Fragment key={groupKey}>
                  <tr className="table-secondary">
                    <td colSpan={7}>
                      <strong>{groupBy === 'meeting' ? groupKey : formatDate(groupKey)}</strong>
                    </td>
                  </tr>
                  {items.map(race => (
                    <tr key={race._id}>
                      <td>{formatDate(race.date)}</td>
                      <td>{extractMeetingName(race)}</td>
                      <td>
                        <Link to={`/races/${race._id}`}>{extractDiscipline(race)}</Link>
                      </td>
                      <td>{race.distance} {race.distanceUnit}</td>
                      <td>{race.gender}</td>
                      <td>{race.location}</td>
                      <td><Badge bg="primary">{race.category}</Badge></td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </Container>
  );
};

export default Races;
