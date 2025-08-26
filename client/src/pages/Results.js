import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Form, Row, Col, Card, Badge, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaSearch, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import axios from 'axios';

const Results = () => {
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [athleteFilter, setAthleteFilter] = useState('');
  const [raceFilter, setRaceFilter] = useState('');
  const [showBanned, setShowBanned] = useState(false); // Default to exclude banned athletes
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [resultToDelete, setResultToDelete] = useState(null);
  
  // Reference data
  const [athletes, setAthletes] = useState([]);
  const [races, setRaces] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch results, athletes, and races in parallel
        const [resultsRes, athletesRes, racesRes] = await Promise.all([
          axios.get('/api/results'),
          axios.get('/api/athletes'),
          axios.get('/api/races')
        ]);
        
        setResults(resultsRes.data);
        setFilteredResults(resultsRes.data);
        setAthletes(athletesRes.data);
        setRaces(racesRes.data);
        
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch results. Please try again later.');
        setLoading(false);
        console.error('Error fetching results:', err);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = results;
    
    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(result => 
        result.athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.race.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply athlete filter
    if (athleteFilter) {
      filtered = filtered.filter(result => result.athlete._id === athleteFilter);
    }
    
    // Apply race filter
    if (raceFilter) {
      filtered = filtered.filter(result => result.race._id === raceFilter);
    }
    
    // Apply banned filter
    if (!showBanned) {
      filtered = filtered.filter(result => !result.athlete.isBanned);
    }
    
    setFilteredResults(filtered);
  }, [searchTerm, athleteFilter, raceFilter, showBanned, results]);

  const handleDeleteClick = (result) => {
    setResultToDelete(result);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!resultToDelete) return;
    
    try {
      await axios.delete(`/api/results/${resultToDelete._id}`);
      
      // Update local state
      setResults(results.filter(r => r._id !== resultToDelete._id));
      setShowDeleteModal(false);
      setResultToDelete(null);
    } catch (err) {
      setError('Failed to delete result. Please try again.');
      console.error('Error deleting result:', err);
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="text-center my-5">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading results...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-header">Race Results</h1>
        <Link to="/results/add">
          <Button variant="success">
            <FaPlus className="me-2" /> Add New Result
          </Button>
        </Link>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="filter-section mb-4">
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Search</Form.Label>
              <div className="input-group">
                <span className="input-group-text">
                  <FaSearch />
                </span>
                <Form.Control
                  type="text"
                  placeholder="Search by athlete or race name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group className="mb-3">
              <Form.Label>Filter by Athlete</Form.Label>
              <Form.Select
                value={athleteFilter}
                onChange={(e) => setAthleteFilter(e.target.value)}
              >
                <option value="">All Athletes</option>
                {athletes.map(athlete => (
                  <option key={athlete._id} value={athlete._id}>
                    {athlete.name} {athlete.isBanned ? '(BANNED)' : ''}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group className="mb-3">
              <Form.Label>Filter by Race</Form.Label>
              <Form.Select
                value={raceFilter}
                onChange={(e) => setRaceFilter(e.target.value)}
              >
                <option value="">All Races</option>
                {races.map(race => (
                  <option key={race._id} value={race._id}>
                    {race.name} ({race.distance} {race.distanceUnit})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={2}>
            <Form.Group className="mb-3">
              <Form.Label>Show Banned</Form.Label>
              <div>
                <Form.Check 
                  type="switch"
                  id="show-banned-switch"
                  label="Include Banned"
                  checked={showBanned}
                  onChange={() => setShowBanned(!showBanned)}
                />
              </div>
            </Form.Group>
          </Col>
        </Row>
      </div>

      {filteredResults.length === 0 ? (
        <Alert variant="info">
          No results found matching your criteria. Try adjusting your filters or add a new result.
        </Alert>
      ) : (
        <Card>
          <Card.Body className="p-0">
            <Table striped bordered hover responsive className="mb-0">
              <thead>
                <tr>
                  <th>Athlete</th>
                  <th>Race</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Position</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map(result => (
                  <tr 
                    key={result._id}
                    className={result.athlete.isBanned ? 'banned-row' : ''}
                  >
                    <td>
                      <Link to={`/athletes/${result.athlete._id}`}>
                        <span className={result.athlete.isBanned ? 'banned' : ''}>
                          {result.athlete.name}
                        </span>
                      </Link>
                    </td>
                    <td>
                      <Link to={`/races/${result.race._id}`}>
                        {result.race.name}
                      </Link>
                    </td>
                    <td>{new Date(result.race.date).toLocaleDateString()}</td>
                    <td className={result.athlete.isBanned ? 'banned' : ''}>
                      {result.formattedTime}
                    </td>
                    <td>{result.position || '-'}</td>
                    <td>
                      {result.athlete.isBanned ? (
                        <Badge bg="danger">Banned</Badge>
                      ) : (
                        <Badge bg="success">Clean</Badge>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          as={Link}
                          to={`/results/edit/${result._id}`}
                        >
                          <FaEdit />
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleDeleteClick(result)}
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Deletion</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this result?</p>
                {resultToDelete && (
                  <div>
                    <p><strong>Athlete:</strong> {resultToDelete.athlete.name}</p>
                    <p><strong>Race:</strong> {resultToDelete.race.name}</p>
                    <p><strong>Time:</strong> {resultToDelete.formattedTime}</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleDeleteConfirm}>
                  Delete Result
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showDeleteModal && <div className="modal-backdrop show"></div>}
    </Container>
  );
};

export default Results;
