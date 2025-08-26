import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Home from '../pages/Home';

// Mock axios
jest.mock('axios');

describe('App Component Tests', () => {
  test('renders App component without crashing', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
  });

  test('renders Header component', () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );
    const headerElement = screen.getByText(/Clean So Far/i);
    expect(headerElement).toBeInTheDocument();
  });

  test('renders Footer component', () => {
    render(<Footer />);
    const footerElement = screen.getByText(/Clean So Far/i);
    expect(footerElement).toBeInTheDocument();
  });

  test('renders Clean So Far link', () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );
    const linkElement = screen.getByText(/Clean So Far/i);
    expect(linkElement).toBeInTheDocument();
  });

  test('renders Home page with features', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    const headingElement = screen.getByText(/Clean So Far/i);
    const featuresElement = screen.getByText(/Features/i);
    const athleteElement = screen.getByText(/Athlete Management/i);
    const raceElement = screen.getByText(/Race Tracking/i);
    
    expect(headingElement).toBeInTheDocument();
    expect(featuresElement).toBeInTheDocument();
    expect(athleteElement).toBeInTheDocument();
    expect(raceElement).toBeInTheDocument();
  });
});
