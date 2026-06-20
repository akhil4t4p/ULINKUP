import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Navbar() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const location = useLocation();
  const [uluCoins, setUluCoins] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'CUSTOMER') {
      import('../utils/api').then(({ default: api }) => {
        api.get('/api/coin-wallets/')
          .then(res => {
            const data = res.data.results || res.data;
            if (data.length > 0) setUluCoins(data[0].coins);
          })
          .catch(() => {});
      });
    }
  }, [isAuthenticated, user, location.pathname]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="sidebar d-none d-lg-flex flex-column py-4 px-3 mx-3 my-3 neo-clay" style={{ width: '280px', height: 'calc(100vh - 2rem)', position: 'sticky', top: '1rem', borderRadius: '30px' }}>
        <Link className="navbar-brand d-flex align-items-center mb-5 px-2" to="/">
          <span className="fw-extrabold fs-3 letter-spacing-tight text-primary">
            <i className="bi bi-link-45deg"></i>U<span style={{ fontWeight: '300' }}>LINKUP</span>
          </span>
        </Link>
        
        <ul className="nav flex-column gap-3 mb-auto">
          <li className="nav-item">
            <Link className={`nav-link px-3 py-3 rounded-4 fw-bold ${isActive('/') ? 'neo-inset text-primary' : 'text-dark hover-inset'}`} to="/">
              <i className="bi bi-house-door fs-5 me-3"></i> Home
            </Link>
          </li>
          <li className="nav-item">
            <Link className={`nav-link px-3 py-3 rounded-4 fw-bold ${isActive('/public') ? 'neo-inset text-primary' : 'text-dark hover-inset'}`} to="/public">
              <i className="bi bi-globe-americas fs-5 me-3"></i> Community Board
            </Link>
          </li>
          <li className="nav-item">
            <Link className={`nav-link px-3 py-3 rounded-4 fw-bold ${isActive('/search') ? 'neo-inset text-primary' : 'text-dark hover-inset'}`} to="/search">
              <i className="bi bi-search fs-5 me-3"></i> Search Providers
            </Link>
          </li>
          {isAuthenticated && user.role === 'BUSINESS' && (
            <li className="nav-item">
              <Link className={`nav-link px-3 py-3 rounded-4 fw-bold ${isActive('/subscriptions') ? 'neo-inset text-primary' : 'text-dark hover-inset'}`} to="/subscriptions">
                <i className="bi bi-card-checklist fs-5 me-3"></i> Plans
              </Link>
            </li>
          )}
          {isAuthenticated && user.role === 'CUSTOMER' && (
            <li className="nav-item">
              <Link className={`nav-link px-3 py-3 rounded-4 fw-bold ${isActive('/customer/dashboard') ? 'neo-inset text-primary' : 'text-dark hover-inset'}`} to="/customer/dashboard">
                <i className="bi bi-person-circle fs-5 me-3"></i> Profile
              </Link>
            </li>
          )}
          {isAuthenticated && user.role === 'BUSINESS' && (
            <li className="nav-item">
              <Link className={`nav-link px-3 py-3 rounded-4 fw-bold ${isActive('/business/dashboard') ? 'neo-inset text-primary' : 'text-dark hover-inset'}`} to="/business/dashboard">
                <i className="bi bi-briefcase-fill fs-5 me-3"></i> Profile
              </Link>
            </li>
          )}
        </ul>
        
        <div className="mt-4 pt-3 border-top d-flex flex-column gap-3">
          <button 
            onClick={toggleTheme} 
            className="neo-btn p-2 d-flex align-items-center justify-content-center mx-auto rounded-circle"
            title="Toggle Light/Dark Theme"
            style={{ width: '45px', height: '45px' }}
          >
            {theme === 'light' ? <i className="bi bi-moon-stars-fill"></i> : <i className="bi bi-sun-fill text-warning"></i>}
          </button>
          
          {isAuthenticated ? (
            <div className="neo-flat p-3 text-center rounded-4 mt-2">
              {/* User Avatar */}
              <div className="mx-auto mb-2" style={{ width: '50px', height: '50px' }}>
                {(() => {
                  const src = user.avatar_preset 
                    ? `/avatars/${user.avatar_preset}.png` 
                    : user.avatar || user.google_avatar || null;
                  return src ? (
                    <img 
                      src={src} 
                      alt="Avatar" 
                      className="rounded-circle w-100 h-100" 
                      style={{ objectFit: 'cover' }} 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="rounded-circle w-100 h-100 bg-light d-flex align-items-center justify-content-center">
                      <i className="bi bi-person-fill text-secondary"></i>
                    </div>
                  );
                })()}
              </div>
              <div className="fw-bold small text-primary text-truncate">{user.email}</div>
              <span className="neo-badge py-0 px-2 my-2 d-inline-block" style={{ fontSize: '0.7rem' }}>{user.role}</span>
              
              {user.role === 'CUSTOMER' && (
                <div className="d-flex align-items-center justify-content-center gap-2 my-3 px-3 py-2 bg-warning bg-opacity-10 rounded-pill">
                  <i className="bi bi-coin text-warning fs-5"></i>
                  <span className="fw-bold text-dark">{uluCoins} Coins</span>
                </div>
              )}

              <button onClick={logout} className="neo-btn w-100 py-2 mt-2 font-weight-bold text-danger">
                <i className="bi bi-box-arrow-right me-2"></i>Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="neo-btn-accent text-center text-decoration-none w-100 py-3 rounded-4 mt-2">
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="d-flex d-lg-none fixed-bottom justify-content-around align-items-center bg-white shadow-lg p-2 z-3" style={{ borderTopLeftRadius: '20px', borderTopRightRadius: '20px', backgroundColor: 'var(--bg-color)' }}>
        <Link className={`nav-link text-center p-2 rounded-4 ${isActive('/') ? 'text-primary neo-inset' : 'text-secondary'}`} to="/">
          <i className="bi bi-house-door fs-4 d-block"></i>
        </Link>
        <Link className={`nav-link text-center p-2 rounded-4 ${isActive('/public') ? 'text-primary neo-inset' : 'text-secondary'}`} to="/public">
          <i className="bi bi-globe-americas fs-4 d-block"></i>
        </Link>
        <Link className={`nav-link text-center p-2 rounded-4 ${isActive('/search') ? 'text-primary neo-inset' : 'text-secondary'}`} to="/search">
          <i className="bi bi-search fs-4 d-block"></i>
        </Link>
        {isAuthenticated ? (
          <Link className={`nav-link text-center p-2 rounded-4 ${isActive(user.role === 'CUSTOMER' ? '/customer/dashboard' : '/business/dashboard') ? 'text-primary neo-inset' : 'text-secondary'}`} to={user.role === 'CUSTOMER' ? '/customer/dashboard' : '/business/dashboard'}>
            <i className={`bi fs-4 d-block ${user.role === 'CUSTOMER' ? 'bi-person-circle' : 'bi-briefcase-fill'}`}></i>
          </Link>
        ) : (
          <Link className="nav-link text-center p-2 rounded-4 text-secondary" to="/login">
            <i className="bi bi-box-arrow-in-right fs-4 d-block"></i>
          </Link>
        )}
      </nav>
      {/* Mobile Top Header */}
      <div className="d-flex d-lg-none justify-content-between align-items-center p-3 mb-3 bg-white shadow-sm" style={{ backgroundColor: 'var(--bg-color)' }}>
        <Link className="navbar-brand d-flex align-items-center text-decoration-none" to="/">
          <span className="fw-extrabold fs-4 letter-spacing-tight text-primary">
            <i className="bi bi-link-45deg"></i>U<span style={{ fontWeight: '300' }}>LINKUP</span>
          </span>
        </Link>
        <button onClick={toggleTheme} className="btn btn-light rounded-circle p-2">
          {theme === 'light' ? <i className="bi bi-moon-stars-fill"></i> : <i className="bi bi-sun-fill text-warning"></i>}
        </button>
      </div>
    </>
  );
}
