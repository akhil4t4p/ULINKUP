import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NeomorphicCard from '../components/NeomorphicCard';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer'); // Default to customer
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Simulate successful authentication and redirect
    if (role === 'customer') {
      navigate('/customer/dashboard');
    } else {
      navigate('/business/dashboard');
    }
  };

  const handleGoogleOAuth = () => {
    // Simulate OAuth redirect/success
    navigate('/select-account');
  };

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <div className="w-100" style={{ maxWidth: '480px' }}>
        <NeomorphicCard className="p-5" elevation="convex">
          <div className="text-center mb-5">
            <span className="fw-black fs-2 text-primary">
              <i className="bi bi-link-45deg"></i>U<span style={{ fontWeight: '300' }}>LINKUP</span>
            </span>
            <h4 className="mt-3">Welcome Back</h4>
            <p className="text-muted small">Sign in to connect with your local network</p>
          </div>
          
          <form onSubmit={handleLogin}>
            {/* Account Type Selection inside Login */}
            <div className="mb-4">
              <label className="form-label fw-bold text-secondary">Sign In As</label>
              <div className="d-flex gap-2">
                <button 
                  type="button"
                  className={`neo-btn flex-fill py-2 ${role === 'customer' ? 'active font-weight-bold border-dark' : ''}`}
                  onClick={() => setRole('customer')}
                >
                  <i className="bi bi-person-fill me-1"></i> Customer
                </button>
                <button 
                  type="button"
                  className={`neo-btn flex-fill py-2 ${role === 'business' ? 'active font-weight-bold border-dark' : ''}`}
                  onClick={() => setRole('business')}
                >
                  <i className="bi bi-briefcase-fill me-1"></i> Business
                </button>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold text-secondary">Email Address</label>
              <input 
                type="email" 
                className="form-control neo-input" 
                placeholder="developer@ulinkup.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            
            <div className="mb-4">
              <label className="form-label fw-bold text-secondary">Password</label>
              <input 
                type="password" 
                className="form-control neo-input" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            
            <button type="submit" className="w-100 neo-btn-accent py-3 mb-4">
              Sign In Securely
            </button>
          </form>
          
          <div className="text-center position-relative mb-4">
            <hr className="bg-secondary opacity-25" />
            <span className="position-absolute top-50 start-50 translate-middle bg-body px-3 text-muted small">OR CONTINUE WITH</span>
          </div>
          
          <button 
            type="button" 
            onClick={handleGoogleOAuth}
            className="w-100 neo-btn py-3 d-flex align-items-center justify-content-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="bi bi-google text-primary" viewBox="0 0 16 16">
              <path d="M15.545 6.558a9.4 9.4 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0c2.198 0 4.086.786 5.544 2.146l-2.26 2.26C10.22 3.393 9.244 3 8 3c-2.79 0-5.051 2.26-5.051 5s2.261 5 5.051 5c3.07 0 5.056-2.094 5.056-5.19 0-.315-.028-.621-.082-.9H8V6.57h7.545z"/>
            </svg>
            Google Account
          </button>
        </NeomorphicCard>
      </div>
    </div>
  );
}
