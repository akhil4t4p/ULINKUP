import React, { useContext } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import NeomorphicCard from '../../components/NeomorphicCard';

export default function AdminLayout() {
  const { user, isAuthenticated, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) return <div className="text-center py-5">Loading...</div>;

  if (!isAuthenticated || (user?.role !== 'ADMIN' && !user?.is_superuser)) {
    return <Navigate to="/" replace />;
  }

  const menuItems = [
    { path: '/admin', icon: 'bi-speedometer2', label: 'Dashboard' },
    { path: '/admin/users', icon: 'bi-people', label: 'Users' },
    { path: '/admin/businesses', icon: 'bi-building', label: 'Business Accounts' },
    { path: '/admin/payments', icon: 'bi-credit-card', label: 'Payments' },
    { path: '/admin/database', icon: 'bi-database', label: 'Database' },
    { path: '/admin/api-keys', icon: 'bi-key', label: 'API Keys' },
    { path: '/admin/cms', icon: 'bi-file-earmark-text', label: 'CMS' },
    { path: '/admin/logs', icon: 'bi-journal-text', label: 'Logs' },
    { path: '/admin/settings', icon: 'bi-gear', label: 'Settings' },
  ];

  return (
    <div className="container-fluid bg-light min-vh-100 p-0">
      <div className="row g-0">
        {/* Sidebar */}
        <div className="col-auto col-md-3 col-xl-2 px-sm-2 px-0 bg-dark text-white min-vh-100 shadow">
          <div className="d-flex flex-column align-items-center align-items-sm-start px-3 pt-4 text-white">
            <Link to="/admin" className="d-flex align-items-center pb-3 mb-md-0 me-md-auto text-white text-decoration-none border-bottom w-100">
              <span className="fs-5 d-none d-sm-inline fw-black"><i className="bi bi-shield-lock-fill text-warning me-2"></i> SUPER ADMIN</span>
            </Link>
            <ul className="nav nav-pills flex-column mb-sm-auto mb-0 align-items-center align-items-sm-start w-100 mt-4" id="menu">
              {menuItems.map((item, idx) => {
                const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
                return (
                  <li className="nav-item w-100 mb-2" key={idx}>
                    <Link to={item.path} className={`nav-link align-middle px-3 py-2 text-white ${isActive ? 'bg-primary shadow' : ''}`} style={{ borderRadius: '10px' }}>
                      <i className={`bi ${item.icon} fs-5`}></i> <span className="ms-2 d-none d-sm-inline">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <hr className="w-100" />
            <div className="pb-4 w-100">
              <Link to="/" className="nav-link align-middle px-3 py-2 text-white-50">
                <i className="bi bi-box-arrow-left fs-5"></i> <span className="ms-2 d-none d-sm-inline">Back to App</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col py-4 px-4 bg-light" style={{ maxHeight: '100vh', overflowY: 'auto' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
