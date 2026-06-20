import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NeomorphicCard from '../components/NeomorphicCard';
import api from '../utils/api';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [role, setRole] = useState('customer'); // customer or business
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');

  const { register, googleLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Detect referral code from URL query (?ref=AKHIL12345)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref') || params.get('referral_code');
    if (ref) {
      setReferralCode(ref);
    }
  }, [location.search]);

  // Load Google Client ID for Google Sign-In
  useEffect(() => {
    const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (envClientId) {
      setGoogleClientId(envClientId);
      return;
    }
    api.get('/api/config/')
      .then(res => {
        if (res.data.VITE_GOOGLE_CLIENT_ID) {
          setGoogleClientId(res.data.VITE_GOOGLE_CLIENT_ID);
        }
      })
      .catch(err => console.warn("Failed to load config from backend", err));
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register(username, email, password, role, referralCode);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        const targetPath = result.user.role === 'CUSTOMER' ? '/customer/dashboard' : '/business/dashboard';
        navigate(targetPath);
      }, 1500);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleGoogleCredentialResponse = useCallback(async (response) => {
    setError('');
    setLoading(true);
    const result = await googleLogin(response.credential, role.toUpperCase(), referralCode);
    if (result.success) {
      navigate(result.user.role === 'CUSTOMER' ? '/customer/dashboard' : '/business/dashboard');
    } else if (result.code === 'GOOGLE_NOT_CONFIGURED') {
      setError('Google Sign-In is not configured on this server.');
    } else {
      setError(result.error || 'Google Authentication failed.');
    }
    setLoading(false);
  }, [googleLogin, navigate, role, referralCode]);

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
    if (googleClientId && window.google) {
      window.google.accounts.id.prompt();
    } else {
      setError('Google Sign-In is not available. Please use email registration.');
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
            <h4 className="mt-3">Create an Account</h4>
            <p className="text-muted small">Join the hyperlocal network platform</p>
          </div>

          {error && (
            <div className="alert alert-danger neo-inset border-0 text-danger small py-3 mb-4" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success neo-inset border-0 text-success small py-3 mb-4" role="alert">
              <i className="bi bi-check-circle-fill me-2"></i> Registration successful! Redirecting...
            </div>
          )}

          <form onSubmit={handleSignup}>
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
              <label className="form-label fw-bold text-secondary">Username</label>
              <input 
                type="text" 
                className="form-control neo-input" 
                placeholder="e.g. akhil" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                required 
              />
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
            
            <div className="mb-3">
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

            <div className="mb-4">
              <label className="form-label fw-bold text-secondary">Referral Code (Optional)</label>
              <input 
                type="text" 
                className="form-control neo-input" 
                placeholder="e.g. AKHIL12345" 
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                disabled={loading}
              />
              {referralCode && (
                <div className="form-text text-success small mt-1">
                  <i className="bi bi-gift-fill me-1"></i> You will receive 500 ULU Coins upon successful registration!
                </div>
              )}
            </div>
            
            <button 
              type="submit" 
              className="w-100 neo-btn-accent py-3 mb-4"
              disabled={loading || success}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              ) : 'Register Account'}
            </button>
          </form>
          
          <div className="text-center position-relative mb-4">
            <hr className="bg-secondary opacity-25" />
            <span className="position-absolute top-50 start-50 translate-middle bg-body px-3 text-muted small">OR CONTINUE WITH</span>
          </div>
          
          {/* Google Sign-In Button */}
          {googleClientId && window.google ? (
            <div id="googleBtnContainer" className="w-100"></div>
          ) : (
            <button 
              type="button" 
              onClick={handleGoogleOAuth}
              className="google-signin-btn w-100 py-3 d-flex align-items-center justify-content-center gap-3"
              disabled={loading || success}
              id="google-signin-button"
            >
              <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              <span className="fw-semibold">Continue with Google</span>
            </button>
          )}

          <div className="text-center mt-4">
            <span className="text-secondary small">Already have an account? </span>
            <Link to="/login" className="small text-primary fw-bold text-decoration-none">Sign In</Link>
          </div>

          {/* Inline Styles for Google Button */}
          <style>{`
            .google-signin-btn {
              position: relative;
              background: #ffffff;
              border: 1.5px solid #dadce0;
              border-radius: 12px;
              cursor: pointer;
              font-size: 15px;
              color: #3c4043;
              letter-spacing: 0.25px;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              overflow: hidden;
              box-shadow: 0 1px 3px rgba(0,0,0,0.08);
            }
            .google-signin-btn::before {
              content: '';
              position: absolute;
              inset: 0;
              background: linear-gradient(135deg, rgba(66,133,244,0.06), rgba(234,67,53,0.06), rgba(251,188,5,0.06), rgba(52,168,83,0.06));
              opacity: 0;
              transition: opacity 0.3s ease;
            }
            .google-signin-btn:hover {
              border-color: #4285F4;
              box-shadow: 0 4px 15px rgba(66,133,244,0.2), 0 2px 6px rgba(0,0,0,0.08);
              transform: translateY(-2px);
            }
            .google-signin-btn:hover::before {
              opacity: 1;
            }
            .google-signin-btn:active {
              transform: translateY(0) scale(0.98);
              box-shadow: 0 1px 4px rgba(66,133,244,0.15);
            }
            .google-signin-btn:disabled {
              opacity: 0.6;
              cursor: not-allowed;
              transform: none;
            }
            [data-theme="dark"] .google-signin-btn {
              background: #2d2d2d;
              border-color: #444;
              color: #e8eaed;
            }
            [data-theme="dark"] .google-signin-btn:hover {
              border-color: #4285F4;
              box-shadow: 0 4px 15px rgba(66,133,244,0.3), 0 2px 6px rgba(0,0,0,0.3);
            }
          `}</style>
        </NeomorphicCard>
      </div>
    </div>
  );
}
