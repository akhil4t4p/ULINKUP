import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NeomorphicCard from '../components/NeomorphicCard';
import api from '../utils/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer'); // default UI choice
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMockGoogleModal, setShowMockGoogleModal] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');

  const { login, devLogin, googleLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to original page or fallback to dashboards
  const from = location.state?.from?.pathname || 
    (role === 'customer' ? '/customer/dashboard' : '/business/dashboard');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Try real JWT login first (works in production)
    let result = await login(email, password);

    // If real login fails (no account / wrong password), and we have an email,
    // fall back to developer mock login (only works locally when DEBUG=True)
    if (!result.success && result.error === 'Invalid email or password.') {
      const mockResult = await devLogin(email || 'developer@ulinkup.com', role.toUpperCase());
      if (mockResult.success) result = mockResult;
    }

    if (result.success) {
      const targetPath = result.user.role === 'CUSTOMER' ? '/customer/dashboard' : '/business/dashboard';
      navigate(targetPath);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleGoogleCredentialResponse = useCallback(async (response) => {
    setError('');
    setLoading(true);
    const result = await googleLogin(response.credential, role.toUpperCase());
    if (result.success) {
      navigate(result.user.role === 'CUSTOMER' ? '/customer/dashboard' : '/business/dashboard');
    } else if (result.code === 'GOOGLE_NOT_CONFIGURED') {
      // Backend not configured — fall back to mock selector
      setLoading(false);
      setShowMockGoogleModal(true);
    } else {
      setError(result.error || 'Google Authentication failed on backend.');
    }
    setLoading(false);
  }, [googleLogin, navigate, role]);

  useEffect(() => {
    // Use env var first (set at Vercel build time) — no backend call needed
    const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (envClientId) {
      setGoogleClientId(envClientId);
      return;
    }
    // Fallback: fetch from backend config API
    api.get('/api/config/').then(res => {
      const clientId = res.data.VITE_GOOGLE_CLIENT_ID;
      if (clientId) {
        setGoogleClientId(clientId);
      }
    }).catch(err => console.warn("Failed to load config from backend", err));
  }, []);

  useEffect(() => {
    if (googleClientId && window.google) {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredentialResponse
      });
      window.google.accounts.id.renderButton(
        document.getElementById("googleBtnContainer"),
        { theme: "outline", size: "large", width: "100%" }
      );
    }
  }, [role, handleGoogleCredentialResponse, googleClientId]);

  const handleGoogleOAuth = async () => {
    if (googleClientId) {
      if (window.google) {
        window.google.accounts.id.prompt();
      }
    } else {
      setShowMockGoogleModal(true);
    }
  };

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <div className="w-100" style={{ maxWidth: '480px' }}>
        <NeomorphicCard className="p-5" elevation="convex">
          <div className="text-center mb-4">
            <span className="fw-black fs-2 text-primary">
              <i className="bi bi-link-45deg"></i>U<span style={{ fontWeight: '300' }}>LINKUP</span>
            </span>
            <h4 className="mt-3">Welcome Back</h4>
            <p className="text-muted small">Sign in to connect with your local network</p>
          </div>

          {error && (
            <div className="alert alert-danger neo-inset border-0 text-danger small py-3 mb-4" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
            </div>
          )}
          
          <form onSubmit={handleLogin}>
            {/* Account Type Selection */}
            <div className="mb-4">
              <label className="form-label fw-bold text-secondary">Select Account Type</label>
              <div className="d-flex gap-2">
                <button 
                  type="button"
                  className={`neo-btn flex-fill py-2 ${role === 'customer' ? 'active font-weight-bold border-dark' : ''}`}
                  onClick={() => setRole('customer')}
                  disabled={loading}
                >
                  <i className="bi bi-person-fill me-1"></i> Customer
                </button>
                <button 
                  type="button"
                  className={`neo-btn flex-fill py-2 ${role === 'business' ? 'active font-weight-bold border-dark' : ''}`}
                  onClick={() => setRole('business')}
                  disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
                required 
              />
            </div>
            
            <button 
              type="submit" 
              className="w-100 neo-btn-accent py-3 mb-4"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              ) : 'Sign In Securely'}
            </button>
          </form>
          
          <div className="text-center position-relative mb-4">
            <hr className="bg-secondary opacity-25" />
            <span className="position-absolute top-50 start-50 translate-middle bg-body px-3 text-muted small">OR CONTINUE WITH</span>
          </div>
          
          {googleClientId ? (
            <div id="googleBtnContainer" className="w-100"></div>
          ) : (
            <button 
              type="button" 
              onClick={handleGoogleOAuth}
              className="w-100 neo-btn py-3 d-flex align-items-center justify-content-center gap-2"
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="bi bi-google text-primary" viewBox="0 0 16 16">
                <path d="M15.545 6.558a9.4 9.4 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0c2.198 0 4.086.786 5.544 2.146l-2.26 2.26C10.22 3.393 9.244 3 8 3c-2.79 0-5.051 2.26-5.051 5s2.261 5 5.051 5c3.07 0 5.056-2.094 5.056-5.19 0-.315-.028-.621-.082-.9H8V6.57h7.545z"/>
              </svg>
              Google Account
            </button>
          )}
        </NeomorphicCard>
      </div>

      {/* Neomorphic Mock Google Selector Modal */}
      {showMockGoogleModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1050 }}>
          <div className="w-100 px-3" style={{ maxWidth: '450px' }}>
            <NeomorphicCard className="p-4" elevation="convex">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold mb-0">Sign in with Google</h5>
                <button type="button" className="btn-close" onClick={() => setShowMockGoogleModal(false)} aria-label="Close"></button>
              </div>
              
              <p className="text-secondary small mb-3">Choose a simulated Google Account to continue to <strong>ULINKUP</strong>:</p>
              
              <div className="d-flex flex-column gap-3 mb-4">
                {[
                  { name: 'Alex Smith', email: 'alex.smith@gmail.com', role: 'CUSTOMER', avatar: 'AS' },
                  { name: 'Sarah Jones', email: 'sarah.jones@gmail.com', role: 'CUSTOMER', avatar: 'SJ' },
                  { name: 'John Doe (Plumber)', email: 'john.doe@gmail.com', role: 'BUSINESS', avatar: 'JD' },
                  { name: 'Jane Doe (Tutor)', email: 'jane.doe@gmail.com', role: 'BUSINESS', avatar: 'JD' }
                ].map(acct => (
                  <button 
                    key={acct.email}
                    type="button"
                    onClick={async () => {
                      setShowMockGoogleModal(false);
                      setLoading(true);
                      const result = await devLogin(acct.email, acct.role);
                      if (result.success) {
                        navigate(acct.role === 'CUSTOMER' ? '/customer/dashboard' : '/business/dashboard');
                      } else {
                        setError("Google mock login failed.");
                      }
                      setLoading(false);
                    }}
                    className="neo-btn p-3 d-flex align-items-center gap-3 text-start w-100"
                  >
                    <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px' }}>
                      {acct.avatar}
                    </div>
                    <div>
                      <div className="fw-bold text-dark">{acct.name}</div>
                      <div className="text-muted small">{acct.email} • {acct.role}</div>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="text-muted small text-center mt-3">
                To use real Google Sign-In, add a <strong>GOOGLE_CLIENT_ID</strong> in the Super Admin <strong>API Keys</strong> panel.
              </div>
            </NeomorphicCard>
          </div>
        </div>
      )}
    </div>
  );
}
