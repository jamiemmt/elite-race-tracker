import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Spinner, Alert, ButtonGroup, Form } from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaTrash, FaPlus, FaFilter } from 'react-icons/fa';
import axios from 'axios';

const RaceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [race, setRace] = useState(null);
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBanned, setShowBanned] = useState(false); // Default to exclude banned athletes

  useEffect(() => {
    const fetchRaceData = async () => {
      try {
        setLoading(true);
        
        // Fetch race details
        const raceRes = await axios.get(`/api/races/${id}`);
        setRace(raceRes.data);
        
        // Fetch race results
        const resultsRes = await axios.get(`/api/results/race/${id}`);
        setResults(resultsRes.data);
        
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch race details. Please try again later.');
        setLoading(false);
        console.error('Error fetching race details:', err);
      }
    };

    fetchRaceData();
  }, [id]);
  
  // Filter results based on showBanned setting
  useEffect(() => {
    if (results.length > 0) {
      if (showBanned) {
        // Show all results
        setFilteredResults(results);
      } else {
        // Filter out banned athletes
        const filtered = results.filter(result => !result.athlete.isBanned);
        setFilteredResults(filtered);
      }
    }
  }, [results, showBanned]);

  const handleDeleteRace = async () => {
    try {
      await axios.delete(`/api/races/${id}`);
      navigate('/races');
    } catch (err) {
      setError('Failed to delete race. Please try again.');
      console.error('Error deleting race:', err);
    }
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
          <p className="mt-2">Loading race details...</p>
        </div>
      </Container>
    );
  }

  if (!race) {
    return (
      <Container>
        <Alert variant="danger">
          Race not found or has been removed.
        </Alert>
        <Link to="/races">
          <Button variant="primary">
            <FaArrowLeft className="me-2" /> Back to Races
          </Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-4">
        <Link to="/races">
          <Button variant="outline-primary">
            <FaArrowLeft className="me-2" /> Back to Races
          </Button>
        </Link>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row>
        <Col lg={4} className="mb-4">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Race Details</h5>
              <Badge bg="primary">{race.category}</Badge>
            </Card.Header>
            <Card.Body>
              <h2>{race.name}</h2>
              <p><strong>Date:</strong> {formatDate(race.date)}</p>
              <p><strong>Location:</strong> {race.location}</p>
              <p><strong>Distance:</strong> {race.distance} {race.distanceUnit}</p>
              <p><strong>Gender:</strong> {race.gender}</p>
              <p><strong>Type:</strong> {race.isElite ? 'Elite' : 'Standard'}</p>
              <div className="d-flex gap-2 mt-4">
                <Button 
                  variant="outline-secondary"
                  as={Link}
                  to={`/races/edit/${id}`}
                >
                  <FaEdit className="me-1" /> Edit
                </Button>
                <Button 
                  variant="outline-danger"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <FaTrash className="me-1" /> Delete
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Results</h5>
              <div className="d-flex align-items-center">
                <Form.Check 
                  type="switch"
                  id="show-banned-switch"
                  label="Show Banned Athletes"
                  checked={showBanned}
                  onChange={() => setShowBanned(!showBanned)}
                  className="me-3"
                />
                <ButtonGroup>
                  <Link to={`/races/${id}/results?view=clean`}>
                    <Button variant="primary" size="sm" className="me-2">
                      <FaFilter className="me-1" /> View in Results Page
                    </Button>
                  </Link>
                  <Link to="/results/add" state={{ preSelectedRace: id }}>
                    <Button variant="success" size="sm">
                      <FaPlus className="me-1" /> Add Result
                    </Button>
                  </Link>
                </ButtonGroup>
              </div>
            </Card.Header>
            <Card.Body>
              {filteredResults.length > 0 ? (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Position</th>
                      <th>Athlete</th>
                      <th>Country</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((result, index) => (
                      <tr 
                        key={result._id}
                        className={result.athlete.isBanned ? 'banned-row' : ''}
                      >
                        <td>{result.position || index + 1}</td>
                        <td>
                          <Link to={`/athletes/${result.athlete._id}`}>
                            <span className={result.athlete.isBanned ? 'banned' : ''}>
                              {result.athlete.name}
                            </span>
                          </Link>
                        </td>
                        <td>{result.athlete.country}</td>
                        <td className={result.athlete.isBanned ? 'banned' : ''}>
                          {result.formattedTime}
                        </td>
                        <td>
                          {result.athlete.isBanned ? (
                            <Badge bg="danger">Banned</Badge>
                          ) : (
                            <Badge bg="success">Clean</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-4">
                  <p>No results have been recorded for this race yet.</p>
                  <Link to="/results/add" state={{ preSelectedRace: id }}>
                    <Button variant="primary">
                      <FaPlus className="me-1" /> Add First Result
                    </Button>
                  </Link>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

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
                <p>Are you sure you want to delete {race.name}? This action cannot be undone.</p>
                <p>All race results associated with this race will also be deleted.</p>
              </div>
              <div className="modal-footer">
                <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleDeleteRace}>
                  Delete Race
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

export default RaceDetail;
