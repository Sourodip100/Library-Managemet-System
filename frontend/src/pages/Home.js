import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="home-hero">
      <h1>📚 Library Management System</h1>
      <p>
        Search the catalog, borrow books, and track due dates — all in one
        place. Built with the MERN stack and deployed on Kubernetes (AWS EKS).
      </p>
      <div className="home-actions">
        <Link to="/books" className="btn btn-primary">
          Browse Books
        </Link>
        <Link to="/register" className="btn btn-outline">
          Get Started
        </Link>
      </div>
    </div>
  );
};

export default Home;
