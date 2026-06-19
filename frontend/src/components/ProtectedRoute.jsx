import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NeomorphicCard from './NeomorphicCard';

/**
 * ProtectedRoute - Route guard to protect views from unauthenticated users
 * or check for specific user role permissions.
 * 
 * @param {React.ReactNode} children - Component to render if guard passes.
 * @param {string[]} allowedRoles - List of user roles permitted to access.
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div className="container py-5 text-center d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <div className="neo-btn rounded-circle p-4 mb-3" style={{ width: '80px', height: '80px', pointerEvents: 'none' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
        <p className="text-secondary fw-bold">Authenticating session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page and remember current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user role is not permitted — redirect to their correct dashboard
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role.toUpperCase())) {
    const fallback = user.role === 'BUSINESS' ? '/business/dashboard' : '/customer/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return children;
}
