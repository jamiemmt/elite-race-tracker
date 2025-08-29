import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Alert, Spinner, Badge, Button, Row, Col } from 'react-bootstrap';
import { FaBan, FaExclamationTriangle, FaGavel, FaDownload } from 'react-icons/fa';
import axios from 'axios';

const BannedAthletes = () => {
  const [bannedAthletes, setBannedAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchBannedAthletes();
    fetchBanStats();
  }, []);

  const fetchBannedAthletes = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/banned-athletes/database');
      setBannedAthletes(response.data);
    } catch (err) {
      console.error('Error fetching banned athletes:', err);
      setError('Failed to load banned athletes');
    } finally {
      setLoading(false);
    }
  };

  const fetchBanStats = async () => {
    try {
      const response = await axios.get('/api/banned-athletes/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching ban stats:', err);
    }
  };

  const updateBannedAthletes = async () => {
    try {
      setLoading(true);
      await axios.post('/api/banned-athletes/update');
      await fetchBannedAthletes();
      await fetchBanStats();
    } catch (err) {
      console.error('Error updating banned athletes:', err);
      setError('Failed to update banned athletes');
    } finally {
      setLoading(false);
    }
  };

  const getBanStatusBadge = (athlete) => {
    if (athlete.isProvisionallyBanned) {
      return <Badge bg="warning" className="me-2"><FaExclamationTriangle className="me-1" />Provisional</Badge>;
    }
    if (athlete.banStatus === 'first_instance') {
      return <Badge bg="info" className="me-2"><FaGavel className="me-1" />First Instance</Badge>;
    }
    if (athlete.isBanned) {
      return <Badge bg="danger" className="me-2"><FaBan className="me-1" />Banned</Badge>;
    }
    return null;
  };

  const exportToCsv = () => {
    const headers = ['Name', 'Country', 'Ban Status', 'Ban Agency', 'Ban Type', 'Ban Source', 'Date Detected'];
    const csvContent = [
      headers.join(','),
      ...bannedAthletes.map(athlete => [
        athlete.name,
        athlete.country || 'Unknown',
        athlete.banStatus || (athlete.isBanned ? 'banned' : 'unknown'),
        athlete.banAgency || 'Unknown',
        athlete.banType || 'Unknown',
        athlete.banSource || 'Unknown',
        athlete.banDateDetected ? new Date(athlete.banDateDetected).toLocaleDateString() : 'Unknown'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `banned-athletes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading banned athletes...</p>
      </Container>
    );
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-header">
          <FaBan className="me-2 text-danger" />
          Banned Athletes
        </h1>
        <div>
          <Button variant="outline-primary" onClick={updateBannedAthletes} className="me-2">
            Update List
          </Button>
          {bannedAthletes.length > 0 && (
            <Button variant="outline-secondary" onClick={exportToCsv}>
              <FaDownload className="me-1" /> Export CSV
            </Button>
          )}
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Statistics Cards */}
      {stats && Object.keys(stats).length > 0 && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-danger">{stats.totalBanned || 0}</h3>
                <p className="mb-0">Total Banned</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-warning">{stats.provisionalSuspensions || 0}</h3>
                <p className="mb-0">Provisional</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-info">{stats.firstInstanceDecisions || 0}</h3>
                <p className="mb-0">First Instance</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-primary">{stats.byAgency?.AIU || 0}</h3>
                <p className="mb-0">AIU Cases</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {bannedAthletes.length > 0 ? (
        <Card>
          <Card.Header>
            <h5 className="mb-0">
              Banned Athletes ({bannedAthletes.length})
            </h5>
          </Card.Header>
          <Card.Body className="p-0">
            <Table responsive striped hover>
              <thead className="table-dark">
                <tr>
                  <th>Name</th>
                  <th>Country</th>
                  <th>Status</th>
                  <th>Agency/Source</th>
                  <th>Ban Details</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {bannedAthletes.map((athlete, index) => (
                  <tr key={athlete._id || index} className="banned-row">
                    <td>
                      <span className="banned fw-bold">
                        {athlete.name}
                      </span>
                    </td>
                    <td>{athlete.country || 'Unknown'}</td>
                    <td>
                      {getBanStatusBadge(athlete)}
                    </td>
                    <td>
                      <div>
                        <strong>{athlete.banAgency || 'Unknown'}</strong>
                        {athlete.banSource && athlete.banSource !== athlete.banAgency && (
                          <div className="small text-muted">
                            Source: {athlete.banSource}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div>
                        {athlete.banType && athlete.banType !== 'Various violations' && (
                          <div><strong>Substance:</strong> {athlete.banType}</div>
                        )}
                        {athlete.banStatus && (
                          <div className="small text-muted">
                            Status: {athlete.banStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                        )}
                        {athlete.banDateDetected && (
                          <div className="small text-muted">
                            Detected: {athlete.banDateDetected}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="small">
                        {athlete.banReason || athlete.reason || 'Not specified'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      ) : (
        <Alert variant="info">
          <FaBan className="me-2" />
          No banned athletes found in the database. Click "Update List" to fetch the latest data from anti-doping agencies.
        </Alert>
      )}
    </Container>
  );
};

export default BannedAthletes;
