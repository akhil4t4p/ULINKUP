import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import NeomorphicCard from '../components/NeomorphicCard';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';

export default function ProfileOptimization() {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    phone_number: user?.phone_number || '',
    whatsapp_number: user?.whatsapp_number || '',
    business_email: user?.business_email || '',
    instagram_url: user?.instagram_url || '',
    youtube_url: user?.youtube_url || '',
    facebook_url: user?.facebook_url || '',
    telegram_url: user?.telegram_url || '',
    tiktok_url: user?.tiktok_url || ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear specific error on type
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.phone_number) newErrors.phone_number = "Phone Number is required.";
    if (!formData.whatsapp_number) newErrors.whatsapp_number = "WhatsApp Number is required.";
    if (!formData.business_email) newErrors.business_email = "Business Email is required.";
    else if (!/\S+@\S+\.\S+/.test(formData.business_email)) newErrors.business_email = "Email is invalid.";

    // Instagram Validation
    if (formData.instagram_url) {
      if (!formData.instagram_url.toLowerCase().includes('instagram.com')) {
        newErrors.instagram_url = "Must be a valid Instagram URL (e.g., https://instagram.com/username)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await api.patch('/api/auth/optimize-profile/', formData);
      if (res.status === 200 && res.data.success) {
        // Update user context
        const updatedUser = res.data.user;
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Redirect to appropriate dashboard
        navigate(updatedUser.role === 'CUSTOMER' ? '/customer/dashboard' : '/business/dashboard');
      }
    } catch (err) {
      alert(err.response?.data?.error || "Failed to save profile details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center min-vh-100">
      <div style={{ maxWidth: '800px', width: '100%' }}>
        <div className="text-center mb-5">
          <h1 className="fw-black text-primary display-4 mb-3">Optimize Your Profile</h1>
          <p className="lead text-muted">Please fill in a few more details so people can connect with you better.</p>
        </div>

        <NeomorphicCard className="p-4 p-md-5" elevation="convex">
          <form onSubmit={handleSubmit}>
            
            <h4 className="fw-bold mb-4 text-secondary border-bottom pb-2">
              <i className="bi bi-person-lines-fill me-2"></i> Mandatory Details
            </h4>
            
            <div className="row g-4 mb-5">
              <div className="col-md-6">
                <label className="form-label fw-bold text-secondary">Phone Number <span className="text-danger">*</span></label>
                <input 
                  type="text" 
                  name="phone_number"
                  className={`form-control neo-input ${errors.phone_number ? 'is-invalid border-danger text-danger' : ''}`}
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                />
                {errors.phone_number && <div className="invalid-feedback text-danger fw-bold">{errors.phone_number}</div>}
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold text-secondary">WhatsApp Number <span className="text-danger">*</span></label>
                <input 
                  type="text" 
                  name="whatsapp_number"
                  className={`form-control neo-input ${errors.whatsapp_number ? 'is-invalid border-danger text-danger' : ''}`}
                  value={formData.whatsapp_number}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                />
                {errors.whatsapp_number && <div className="invalid-feedback text-danger fw-bold">{errors.whatsapp_number}</div>}
              </div>

              <div className="col-12">
                <label className="form-label fw-bold text-secondary">Business/Contact Email <span className="text-danger">*</span></label>
                <input 
                  type="email" 
                  name="business_email"
                  className={`form-control neo-input ${errors.business_email ? 'is-invalid border-danger text-danger' : ''}`}
                  value={formData.business_email}
                  onChange={handleChange}
                  placeholder="contact@yourbusiness.com"
                />
                {errors.business_email && <div className="invalid-feedback text-danger fw-bold">{errors.business_email}</div>}
              </div>
            </div>

            <h4 className="fw-bold mb-4 text-secondary border-bottom pb-2">
              <i className="bi bi-link-45deg me-2"></i> Social Links <span className="fs-6 text-muted fw-normal">(Optional)</span>
            </h4>

            <div className="row g-4 mb-5">
              <div className="col-12">
                <label className="form-label fw-bold text-secondary">
                  <i className="bi bi-instagram text-danger me-2"></i>Instagram URL
                </label>
                <input 
                  type="url" 
                  name="instagram_url"
                  className={`form-control neo-input ${errors.instagram_url ? 'is-invalid border-danger text-danger' : ''}`}
                  value={formData.instagram_url}
                  onChange={handleChange}
                  placeholder="https://instagram.com/yourprofile"
                />
                {errors.instagram_url && <div className="invalid-feedback text-danger fw-bold">{errors.instagram_url}</div>}
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold text-secondary">
                  <i className="bi bi-youtube text-danger me-2"></i>YouTube Channel URL
                </label>
                <input 
                  type="url" 
                  name="youtube_url"
                  className="form-control neo-input"
                  value={formData.youtube_url}
                  onChange={handleChange}
                  placeholder="https://youtube.com/@yourchannel"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold text-secondary">
                  <i className="bi bi-facebook text-primary me-2"></i>Facebook Profile/Page URL
                </label>
                <input 
                  type="url" 
                  name="facebook_url"
                  className="form-control neo-input"
                  value={formData.facebook_url}
                  onChange={handleChange}
                  placeholder="https://facebook.com/yourpage"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold text-secondary">
                  <i className="bi bi-telegram text-info me-2"></i>Telegram Link
                </label>
                <input 
                  type="url" 
                  name="telegram_url"
                  className="form-control neo-input"
                  value={formData.telegram_url}
                  onChange={handleChange}
                  placeholder="https://t.me/yourusername"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold text-secondary">
                  <i className="bi bi-tiktok text-dark me-2"></i>TikTok Profile URL
                </label>
                <input 
                  type="url" 
                  name="tiktok_url"
                  className="form-control neo-input"
                  value={formData.tiktok_url}
                  onChange={handleChange}
                  placeholder="https://tiktok.com/@yourprofile"
                />
              </div>
            </div>

            <div className="d-flex justify-content-end">
              <button 
                type="submit" 
                className="neo-btn-accent px-5 py-3 fs-5 fw-bold w-100"
                disabled={loading}
              >
                {loading ? (
                  <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Saving...</>
                ) : (
                  <>Complete Profile <i className="bi bi-arrow-right ms-2"></i></>
                )}
              </button>
            </div>
          </form>
        </NeomorphicCard>
      </div>
    </div>
  );
}
