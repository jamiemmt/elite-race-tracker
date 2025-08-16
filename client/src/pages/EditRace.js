import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import axios from 'axios';

const EditRace = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    date: '',
    distance: '',
    distanceUnit: 'm',
    category: '',
    gender: '',
    isElite: true
  });
  
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState(null);
  
  const { name, location, date, distance, distanceUnit, category, gender, isElite } = formData;
  
  useEffect(() => {
    const fetchRace = async () => {
      try {
        setFetchingData(true);
        
        const res = await axios.get(`/api/races/${id}`);
        const race = res.data;
        
        // Format date to YYYY-MM-DD for the date input
        const formattedDate = new Date(race.date).toISOString().split('T')[0];
        
        setFormData({
          name: race.name,
          location: race.location,
          date: formattedDate,
          distance: race.distance.toString(),
          distanceUnit: race.distanceUnit,
          category: race.category,
          gender: race.gender,
          isElite: race.isElite
        });
        
        setFetchingData(false);
      } catch (err) {
        setError('Failed to fetch race data. Please try again later.');
        setFetchingData(false);
        console.error('Error fetching race:', err);
      }
    };

    fetchRace();
  }, [id]);
  
  const onChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const onSubmit = async e => {
    e.preventDefault();
    
    if (!name || !location || !date || !distance || !category || !gender) {
      setError('Please fill in all required fields.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Convert distance to number
      const raceData = {
        ...formData,
        distance: parseFloat(distance)
      };
      
      await axios.put(`/api/races/${id}`, raceData);
      
      setLoading(false);
      navigate(`/races/${id}`);
    } catch (err) {
      setError('Failed to update race. Please try again.');
      setLoading(false);
      console.error('Error updating race:', err);
    }
  };
  
  if (fetchingData) {
    return (
      <Container>
        <div className="text-center my-5">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading race data...</p>
        </div>
      </Container>
    );
  }
  
  return (
    <Container>
      <div className="mb-4">
        <Link to={`/races/${id}`}>
          <Button variant="outline-primary">
            <FaArrowLeft className="me-2" /> Back to Race Details
          </Button>
        </Link>
      </div>
      
      <h1 className="page-header">Edit Race</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card className="form-container">
        <Card.Body>
          <Form onSubmit={onSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Race Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter race name"
                name="name"
                value={name}
                onChange={onChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Location <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter race location"
                name="location"
                value={location}
                onChange={onChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Date <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="date"
                name="date"
                value={date}
                onChange={onChange}
                required
              />
            </Form.Group>
            
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Distance <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter race distance"
                    name="distance"
                    value={distance}
                    onChange={onChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Unit <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="distanceUnit"
                    value={distanceUnit}
                    onChange={onChange}
                    required
                  >
                    <option value="m">Meters (m)</option>
                    <option value="km">Kilometers (km)</option>
                    <option value="miles">Miles</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Category <span className="text-danger">*</span></Form.Label>
              <Form.Select
                name="category"
                value={category}
                onChange={onChange}
                required
              >
                <option value="">Select category</option>
                <option value="Track">Track</option>
                <option value="Road">Road</option>
                <option value="Cross Country">Cross Country</option>
                <option value="Trail">Trail</option>
                <option value="Ultra">Ultra</option>
                <option value="Other">Other</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Gender <span className="text-danger">*</span></Form.Label>
              <Form.Select
                name="gender"
                value={gender}
                onChange={onChange}
                required
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Mixed">Mixed</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-4">
              <Form.Check
                type="checkbox"
                label="This is an elite race"
                name="isElite"
                checked={isElite}
                onChange={onChange}
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end">
              <Button 
                variant="primary" 
                type="submit" 
                disabled={loading}
                className="d-flex align-items-center"
              >
                {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="me-2" /> Update Race
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default EditRace;
