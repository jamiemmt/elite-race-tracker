import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaRunning, FaStopwatch, FaUsers, FaTrophy, FaChartLine } from 'react-icons/fa';

const Home = () => {
  return (
    <Container>
      <div className="jumbotron bg-light p-5 rounded mb-4">
        <h1 className="display-4">Elite Race Tracker</h1>
        <p className="lead">
          Track the fastest finish times in elite races and easily identify athletes who have served bans.
        </p>
        <hr className="my-4" />
        <p>
          Maintain accurate records of elite race performances while ensuring transparency about athletes' ban history.
        </p>
        <Link to="/fastest-times">
          <Button variant="primary" size="lg">
            View Fastest Times
          </Button>
        </Link>
      </div>

      <h2 className="text-center mb-4">Features</h2>
      
      <Row className="g-4">
        <Col md={4}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="d-flex flex-column">
              <div className="text-center mb-3">
                <FaUsers size={40} className="text-primary" />
              </div>
              <Card.Title className="text-center">Athlete Management</Card.Title>
              <Card.Text>
                Maintain a comprehensive database of elite athletes, including their personal records and ban history.
              </Card.Text>
              <div className="mt-auto text-center">
                <Link to="/athletes">
                  <Button variant="outline-primary">View Athletes</Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="d-flex flex-column">
              <div className="text-center mb-3">
                <FaStopwatch size={40} className="text-primary" />
              </div>
              <Card.Title className="text-center">Race Tracking</Card.Title>
              <Card.Text>
                Record and organize races by category, distance, and location. Keep all your elite race data in one place.
              </Card.Text>
              <div className="mt-auto text-center">
                <Link to="/races">
                  <Button variant="outline-primary">View Races</Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="d-flex flex-column">
              <div className="text-center mb-3">
                <FaTrophy size={40} className="text-primary" />
              </div>
              <Card.Title className="text-center">Result Management</Card.Title>
              <Card.Text>
                Record race results with precise finish times and automatically rank athletes based on their performance.
              </Card.Text>
              <div className="mt-auto text-center">
                <Link to="/results">
                  <Button variant="outline-primary">View Results</Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mt-2">
        <Col md={6}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="d-flex flex-column">
              <div className="text-center mb-3">
                <FaRunning size={40} className="text-primary" />
              </div>
              <Card.Title className="text-center">Fastest Times Tracking</Card.Title>
              <Card.Text>
                Easily view and filter the fastest times across different race categories and distances. 
                Identify clean athletes by filtering out those who have served bans.
              </Card.Text>
              <div className="mt-auto text-center">
                <Link to="/fastest-times">
                  <Button variant="outline-primary">View Fastest Times</Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="d-flex flex-column">
              <div className="text-center mb-3">
                <FaChartLine size={40} className="text-primary" />
              </div>
              <Card.Title className="text-center">Ban Transparency</Card.Title>
              <Card.Text>
                Maintain transparency in elite athletics by clearly marking athletes who have served bans. 
                Strike out banned athletes from results while maintaining historical records.
              </Card.Text>
              <div className="mt-auto text-center">
                <Link to="/athletes">
                  <Button variant="outline-primary">View Athletes</Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Home;
