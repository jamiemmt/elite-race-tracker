import React from 'react';
import { Container } from 'react-bootstrap';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-dark text-light py-4 mt-5">
      <Container className="text-center">
        <p className="mb-0">
          &copy; {currentYear} Elite Race Tracker | Track elite race times and banned athletes
        </p>
      </Container>
    </footer>
  );
};

export default Footer;
