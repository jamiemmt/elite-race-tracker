import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import axios from 'axios';

const AddResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const preSelectedRace = location.state?.preSelectedRace || '';
  
  const [formData, setFormData] = useState({
    athlete: '',
    race: preSelectedRace,
    finishTime: '',
    formattedTime: '',
    position: '',
    notes: ''
  });
  
  const [athletes, setAthletes] = useState([]);
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState(null);
  
  const { athlete, race, finishTime, formattedTime, position, notes } = formData;
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchingData(true);
        
        // Fetch athletes and races in parallel
        const [athletesRes, racesRes] = await Promise.all([
          axios.get('/api/athletes'),
          axios.get('/api/races')
        ]);
        
        setAthletes(athletesRes.data);
        setRaces(racesRes.data);
        
        setFetchingData(false);
      } catch (err) {
        setError('Failed to fetch data. Please try again later.');
        setFetchingData(false);
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, []);
  
  const onChange = e => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // If changing finish time, automatically update formatted time
    if (name === 'finishTime') {
      const timeInSeconds = parseFloat(value);
      if (!isNaN(timeInSeconds)) {
        setFormData({
          ...formData,
          [name]: value,
          formattedTime: formatTimeFromSeconds(timeInSeconds)
        });
      } else {
        setFormData({
          ...formData,
          [name]: value,
          formattedTime: ''
        });
      }
    }
    
    // If changing formatted time, automatically update finish time in seconds
    if (name === 'formattedTime') {
      const timeInSeconds = parseTimeToSeconds(value);
      if (!isNaN(timeInSeconds)) {
        setFormData({
          ...formData,
          [name]: value,
          finishTime: timeInSeconds.toString()
        });
      } else {
        setFormData({
          ...formData,
          [name]: value,
          finishTime: ''
        });
      }
    }
  };
  
  // Convert time in seconds to formatted time (HH:MM:SS.ms)
  const formatTimeFromSeconds = (seconds) => {
    if (isNaN(seconds)) return '';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.round((seconds % 1) * 100);
    
    let formatted = '';
    
    if (hours > 0) {
      formatted += `${hours}:`;
      formatted += `${minutes.toString().padStart(2, '0')}:`;
    } else {
      formatted += `${minutes}:`;
    }
    
    formatted += `${secs.toString().padStart(2, '0')}`;
    
    if (ms > 0) {
      formatted += `.${ms.toString().padStart(2, '0')}`;
    }
    
    return formatted;
  };
  
  // Convert formatted time (HH:MM:SS.ms) to seconds
  const parseTimeToSeconds = (formattedTime) => {
    if (!formattedTime) return NaN;
    
    // Handle different formats
    let parts;
    let hours = 0;
    let minutes = 0;
    let seconds = 0;
    let milliseconds = 0;
    
    // Check if there's a decimal part for milliseconds
    const timeParts = formattedTime.split('.');
    if (timeParts.length > 1) {
      milliseconds = parseInt(timeParts[1].padEnd(2, '0')) / 100;
    }
    
    // Parse the main time part
    parts = timeParts[0].split(':');
    
    if (parts.length === 3) {
      // Format: HH:MM:SS
      hours = parseInt(parts[0]);
      minutes = parseInt(parts[1]);
      seconds = parseInt(parts[2]);
    } else if (parts.length === 2) {
      // Format: MM:SS
      minutes = parseInt(parts[0]);
      seconds = parseInt(parts[1]);
    } else if (parts.length === 1) {
      // Format: SS
      seconds = parseInt(parts[0]);
    } else {
      return NaN;
    }
    
    return hours * 3600 + minutes * 60 + seconds + milliseconds;
  };
  
  const onSubmit = async e => {
    e.preventDefault();
    
    if (!athlete || !race || (!finishTime && !formattedTime)) {
      setError('Please fill in all required fields.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Ensure we have both time formats
      let resultData = { ...formData };
      if (finishTime && !formattedTime) {
        resultData.formattedTime = formatTimeFromSeconds(parseFloat(finishTime));
      } else if (formattedTime && !finishTime) {
        resultData.finishTime = parseTimeToSeconds(formattedTime);
      }
      
      // Convert finishTime to number
      resultData.finishTime = parseFloat(resultData.finishTime);
      
      // Convert position to number if provided
      if (resultData.position) {
        resultData.position = parseInt(resultData.position);
      }
      
      await axios.post('/api/results', resultData);
      
      setLoading(false);
      navigate('/results');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to add result. Please try again.');
      setLoading(false);
      console.error('Error adding result:', err);
    }
  };
  
  if (fetchingData) {
    return (
      <Container>
        <div className="text-center my-5">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading data...</p>
        </div>
      </Container>
    );
  }
  
  return (
    <Container>
      <div className="mb-4">
        <Link to="/results">
          <Button variant="outline-primary">
            <FaArrowLeft className="me-2" /> Back to Results
          </Button>
        </Link>
      </div>
      
      <h1 className="page-header">Add New Result</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card className="form-container">
        <Card.Body>
          <Form onSubmit={onSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Athlete <span className="text-danger">*</span></Form.Label>
              <Form.Select
                name="athlete"
                value={athlete}
                onChange={onChange}
                required
              >
                <option value="">Select athlete</option>
                {athletes.map(a => (
                  <option key={a._id} value={a._id}>
                    {a.name} ({a.country}) {a.isBanned ? '- BANNED' : ''}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Race <span className="text-danger">*</span></Form.Label>
              <Form.Select
                name="race"
                value={race}
                onChange={onChange}
                required
              >
                <option value="">Select race</option>
                {races.map(r => (
                  <option key={r._id} value={r._id}>
                    {r.name} - {r.distance}{r.distanceUnit} ({new Date(r.date).toLocaleDateString()})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Time (seconds) <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter time in seconds"
                    name="finishTime"
                    value={finishTime}
                    onChange={onChange}
                  />
                  <Form.Text className="text-muted">
                    Enter the finish time in seconds (e.g., 3661.5 for 1h 1m 1.5s)
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Formatted Time <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="HH:MM:SS.ms"
                    name="formattedTime"
                    value={formattedTime}
                    onChange={onChange}
                  />
                  <Form.Text className="text-muted">
                    Format: MM:SS or HH:MM:SS (e.g., 1:01:01.5)
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Position</Form.Label>
              <Form.Control
                type="number"
                min="1"
                placeholder="Enter finishing position (optional)"
                name="position"
                value={position}
                onChange={onChange}
              />
            </Form.Group>
            
            <Form.Group className="mb-4">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Add any additional notes about this result"
                name="notes"
                value={notes}
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
                    <FaSave className="me-2" /> Save Result
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

export default AddResult;
