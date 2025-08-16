import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { FaBan } from 'react-icons/fa';
import axios from 'axios';

const AddBanRecord = ({ athleteId, onBanAdded, show, handleClose }) => {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    authority: '',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { startDate, endDate, reason, authority, notes } = formData;
  
  const onChange = e => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const onSubmit = async e => {
    e.preventDefault();
    
    if (!startDate || !reason || !authority) {
      setError('Please fill in all required fields.');
      return;
    }
    
    try {
      setLoading(true);
      
      await axios.post(`/api/athletes/${athleteId}/ban`, formData);
      
      setLoading(false);
      setFormData({
        startDate: '',
        endDate: '',
        reason: '',
        authority: '',
        notes: ''
      });
      setError(null);
      
      // Notify parent component that a ban was added
      onBanAdded();
      handleClose();
    } catch (err) {
      setError('Failed to add ban record. Please try again.');
      setLoading(false);
      console.error('Error adding ban record:', err);
    }
  };
  
  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>
          <FaBan className="text-danger me-2" />
          Add Ban Record
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Form onSubmit={onSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Start Date <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="date"
              name="startDate"
              value={startDate}
              onChange={onChange}
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>End Date</Form.Label>
            <Form.Control
              type="date"
              name="endDate"
              value={endDate}
              onChange={onChange}
            />
            <Form.Text className="text-muted">
              Leave blank for lifetime bans or if end date is unknown
            </Form.Text>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Reason <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g., Doping violation, Competition rule breach"
              name="reason"
              value={reason}
              onChange={onChange}
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Authority <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g., WADA, IAAF, National Federation"
              name="authority"
              value={authority}
              onChange={onChange}
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Additional Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Any additional details about the ban"
              name="notes"
              value={notes}
              onChange={onChange}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button 
          variant="danger" 
          onClick={onSubmit}
          disabled={loading}
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
            <>Add Ban Record</>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddBanRecord;
