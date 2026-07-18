import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">📚 Library MS</Link>
      </div>
      <div className="navbar-links">
        <Link to="/books">Books</Link>
        {user && <Link to="/my-loans">My Loans</Link>}
        {user && (user.role === 'admin' || user.role === 'librarian') && (
          <Link to="/admin">Admin</Link>
        )}
        {user ? (
          <>
            <span className="navbar-user">Hi, {user.name}</span>
            <button className="btn btn-outline" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
