import React, { useState } from 'react';
import { Container, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import axios from 'axios';

const AddAthlete = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    gender: '',
    dateOfBirth: '',
    isBanned: false
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { name, country, gender, dateOfBirth, isBanned } = formData;
  
  const onChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const onSubmit = async e => {
    e.preventDefault();
    
    if (!name || !country || !gender) {
      setError('Please fill in all required fields.');
      return;
    }
    
    try {
      setLoading(true);
      
      await axios.post('/api/athletes', formData);
      
      setLoading(false);
      navigate('/athletes');
    } catch (err) {
      setError('Failed to add athlete. Please try again.');
      setLoading(false);
      console.error('Error adding athlete:', err);
    }
  };
  
  return (
    <Container>
      <div className="mb-4">
        <Link to="/athletes">
          <Button variant="outline-primary">
            <FaArrowLeft className="me-2" /> Back to Athletes
          </Button>
        </Link>
      </div>
      
      <h1 className="page-header">Add New Athlete</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card className="form-container">
        <Card.Body>
          <Form onSubmit={onSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter athlete's full name"
                name="name"
                value={name}
                onChange={onChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Country <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter country"
                name="country"
                value={country}
                onChange={onChange}
                required
              />
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
                <option value="Other">Other</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Date of Birth</Form.Label>
              <Form.Control
                type="date"
                name="dateOfBirth"
                value={dateOfBirth}
                onChange={onChange}
              />
            </Form.Group>
            
            <Form.Group className="mb-4">
              <Form.Check
                type="checkbox"
                label="Athlete is currently banned"
                name="isBanned"
                checked={isBanned}
                onChange={onChange}
              />
              {isBanned && (
                <Form.Text className="text-muted">
                  You can add detailed ban records after creating the athlete.
                </Form.Text>
              )}
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
                    <FaSave className="me-2" /> Save Athlete
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

export default AddAthlete;
