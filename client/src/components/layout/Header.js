import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link, NavLink } from 'react-router-dom';
import { FaStopwatch, FaUsers, FaTrophy, FaPlus, FaSpider, FaBan, FaDumbbell } from 'react-icons/fa';

const Header = () => {
  return (
    <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold">
          Clean So Far
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={NavLink} to="/" end>
              Home
            </Nav.Link>
            <Nav.Link as={NavLink} to="/athletes">
              <FaUsers className="me-1" /> Athletes
            </Nav.Link>
            <Nav.Link as={NavLink} to="/races">
              <FaStopwatch className="me-1" /> Races
            </Nav.Link>
            <Nav.Link as={NavLink} to="/results">
              <FaTrophy className="me-1" /> Results
            </Nav.Link>
            <Nav.Link as={NavLink} to="/fastest-times">
              <FaTrophy className="me-1" /> Fastest Times
            </Nav.Link>
            <Nav.Link as={NavLink} to="/banned-athletes">
              <FaBan className="me-1" /> Banned Athletes
            </Nav.Link>
            <Nav.Link as={NavLink} to="/scrapers">
              <FaSpider className="me-1" /> Scraper Manager
            </Nav.Link>
            <Nav.Link as={NavLink} to="/garmin-workout">
              <FaDumbbell className="me-1" /> Workout Creator
            </Nav.Link>
          </Nav>
          <Nav>
            <Nav.Link as={NavLink} to="/athletes/add">
              <FaPlus className="me-1" /> Add Athlete
            </Nav.Link>
            <Nav.Link as={NavLink} to="/races/add">
              <FaPlus className="me-1" /> Add Race
            </Nav.Link>
            <Nav.Link as={NavLink} to="/results/add">
              <FaPlus className="me-1" /> Add Result
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
