import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar navbar-expand-lg py-3 px-4 mx-3 my-3 neo-convex" style={{ borderRadius: '15px' }}>
      <div className="container-fluid">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <span className="fw-extrabold fs-3 letter-spacing-tight me-2 text-primary">
            <i className="bi bi-link-45deg"></i>U<span style={{ fontWeight: '300' }}>LINKUP</span>
          </span>
        </Link>
        
        <button className="navbar-toggler border-0 neo-btn p-2" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <i className="bi bi-list fs-4"></i>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 gap-2">
            <li className="nav-item">
              <Link className={`nav-link px-3 py-2 neo-btn ${isActive('/') ? 'active' : ''}`} to="/">
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link px-3 py-2 neo-btn ${isActive('/search') ? 'active' : ''}`} to="/search">
                Search Providers
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link px-3 py-2 neo-btn ${isActive('/subscriptions') ? 'active' : ''}`} to="/subscriptions">
                Plans
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link px-3 py-2 neo-btn ${isActive('/customer/dashboard') ? 'active' : ''}`} to="/customer/dashboard">
                Customer Port
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link px-3 py-2 neo-btn ${isActive('/business/dashboard') ? 'active' : ''}`} to="/business/dashboard">
                Business Port
              </Link>
            </li>
          </ul>
          
          <div className="d-flex align-items-center gap-3">
            <button 
              onClick={toggleTheme} 
              className="neo-btn p-2 d-flex align-items-center justify-content-center"
              title="Toggle Light/Dark Theme"
              style={{ width: '42px', height: '42px' }}
            >
              {theme === 'light' ? <i className="bi bi-moon-stars-fill"></i> : <i className="bi bi-sun-fill text-warning"></i>}
            </button>
            
            <Link to="/login" className="neo-btn-accent text-decoration-none">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
