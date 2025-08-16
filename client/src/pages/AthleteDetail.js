import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaTrash, FaBan, FaUserCheck } from 'react-icons/fa';
import axios from 'axios';

const AthleteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [athlete, setAthlete] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Ban modal state
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [banStartDate, setBanStartDate] = useState('');
  const [banEndDate, setBanEndDate] = useState('');
  const [banLoading, setBanLoading] = useState(false);
  
  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchAthleteData = async () => {
      try {
        setLoading(true);
        
        // Fetch athlete details
        const athleteRes = await axios.get(`/api/athletes/${id}`);
        setAthlete(athleteRes.data);
        
        // Fetch athlete's results
        const resultsRes = await axios.get(`/api/results/athlete/${id}`);
        setResults(resultsRes.data);
        
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch athlete details. Please try again later.');
        setLoading(false);
        console.error('Error fetching athlete details:', err);
      }
    };

    fetchAthleteData();
  }, [id]);

  const handleToggleBan = async () => {
    try {
      const res = await axios.patch(`/api/athletes/${id}/toggle-ban`, {
        reason: athlete.isBanned ? '' : 'Manually banned through admin interface'
      });
      setAthlete(res.data);
    } catch (err) {
      setError('Failed to update athlete ban status. Please try again.');
      console.error('Error toggling ban status:', err);
    }
  };

  const handleAddBan = async (e) => {
    e.preventDefault();
    
    if (!banReason || !banStartDate) {
      setError('Ban reason and start date are required.');
      return;
    }
    
    try {
      setBanLoading(true);
      
      const res = await axios.post(`/api/athletes/${id}/ban`, {
        startDate: banStartDate,
        endDate: banEndDate || null,
        reason: banReason
      });
      
      setAthlete(res.data);
      setShowBanModal(false);
      setBanReason('');
      setBanStartDate('');
      setBanEndDate('');
      
      setBanLoading(false);
    } catch (err) {
      setError('Failed to add ban record. Please try again.');
      setBanLoading(false);
      console.error('Error adding ban record:', err);
    }
  };

  const handleDeleteAthlete = async () => {
    try {
      await axios.delete(`/api/athletes/${id}`);
      navigate('/athletes');
    } catch (err) {
      setError('Failed to delete athlete. Please try again.');
      console.error('Error deleting athlete:', err);
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="text-center my-5">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading athlete details...</p>
        </div>
      </Container>
    );
  }

  if (!athlete) {
    return (
      <Container>
        <Alert variant="danger">
          Athlete not found or has been removed.
        </Alert>
        <Link to="/athletes">
          <Button variant="primary">
            <FaArrowLeft className="me-2" /> Back to Athletes
          </Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-4">
        <Link to="/athletes">
          <Button variant="outline-primary">
            <FaArrowLeft className="me-2" /> Back to Athletes
          </Button>
        </Link>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row>
        <Col lg={4} className="mb-4">
          <Card className={athlete.isBanned ? 'border-danger' : ''}>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Athlete Profile</h5>
              {athlete.isBanned && (
                <Badge bg="danger">Banned</Badge>
              )}
            </Card.Header>
            <Card.Body>
              <h2 className={athlete.isBanned ? 'banned' : ''}>{athlete.name}</h2>
              <p><strong>Country:</strong> {athlete.country}</p>
              <p><strong>Gender:</strong> {athlete.gender}</p>
              {athlete.dateOfBirth && (
                <p>
                  <strong>Date of Birth:</strong> {new Date(athlete.dateOfBirth).toLocaleDateString()}
                </p>
              )}
              <div className="d-flex gap-2 mt-4">
                <Button 
                  variant={athlete.isBanned ? "success" : "danger"}
                  onClick={handleToggleBan}
                >
                  {athlete.isBanned ? (
                    <>
                      <FaUserCheck className="me-1" /> Remove Ban
                    </>
                  ) : (
                    <>
                      <FaBan className="me-1" /> Ban Athlete
                    </>
                  )}
                </Button>
                <Button 
                  variant="primary"
                  onClick={() => setShowBanModal(true)}
                >
                  Add Ban Record
                </Button>
              </div>
              <div className="d-flex gap-2 mt-2">
                <Button 
                  variant="outline-secondary"
                  as={Link}
                  to={`/athletes/edit/${id}`}
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
          <Card>
            <Card.Header>
              <h5 className="mb-0">Ban History</h5>
            </Card.Header>
            <Card.Body>
              {athlete.banHistory && athlete.banHistory.length > 0 ? (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {athlete.banHistory.map((ban, index) => (
                      <tr key={index}>
                        <td>{new Date(ban.startDate).toLocaleDateString()}</td>
                        <td>
                          {ban.endDate 
                            ? new Date(ban.endDate).toLocaleDateString() 
                            : 'Ongoing'}
                        </td>
                        <td>{ban.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p>No ban history records found.</p>
              )}
            </Card.Body>
          </Card>

          <Card className="mt-4">
            <Card.Header>
              <h5 className="mb-0">Race Results</h5>
            </Card.Header>
            <Card.Body>
              {results.length > 0 ? (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Race</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(result => (
                      <tr key={result._id} className={athlete.isBanned ? 'banned-row' : ''}>
                        <td>
                          <Link to={`/races/${result.race._id}`}>
                            {result.race.name}
                          </Link>
                        </td>
                        <td>{new Date(result.race.date).toLocaleDateString()}</td>
                        <td className={athlete.isBanned ? 'banned' : ''}>
                          {result.formattedTime}
                        </td>
                        <td>{result.position || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p>No race results found for this athlete.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Ban Modal */}
      <Modal show={showBanModal} onHide={() => setShowBanModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Ban Record</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddBan}>
            <Form.Group className="mb-3">
              <Form.Label>Ban Reason <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter reason for ban"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Start Date <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="date"
                value={banStartDate}
                onChange={(e) => setBanStartDate(e.target.value)}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>End Date (leave blank for ongoing ban)</Form.Label>
              <Form.Control
                type="date"
                value={banEndDate}
                onChange={(e) => setBanEndDate(e.target.value)}
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowBanModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={banLoading}>
                {banLoading ? 'Saving...' : 'Save Ban Record'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete {athlete.name}? This action cannot be undone.</p>
          <p>All race results associated with this athlete will also be deleted.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteAthlete}>
            Delete Athlete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AthleteDetail;
