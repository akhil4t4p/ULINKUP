import React, { useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import NeomorphicCard from './NeomorphicCard';
import AvatarPicker from './AvatarPicker';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

// Membership banner mapping based on subscription plan
const MEMBERSHIP_BANNERS = {
  FREE: '/banners/bronze.jpeg',
  BRONZE: '/banners/bronze.jpeg',
  SILVER: '/banners/silver.jpeg',
  GOLD: '/banners/gold.jpeg',
};

export default function UserProfileHeader({ profile, subscription, handleToggleOnline }) {
  const { user, setUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState(user.nickname || '');
  const [username, setUsername] = useState(user.username || '');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  
  // Only business accounts can upload avatar photos
  const avatarInputRef = useRef(null);

  const isBusiness = user.role === 'BUSINESS';
  const isCustomer = user.role === 'CUSTOMER';

  // Determine which banner to show (business only)
  const subscriptionPlan = subscription?.plan_type || profile?.subscription_plan || 'FREE';
  const bannerSrc = MEMBERSHIP_BANNERS[subscriptionPlan] || MEMBERSHIP_BANNERS.FREE;

  // Resolve the avatar display URL: avatar_preset > uploaded avatar > google_avatar > fallback
  const getAvatarUrl = () => {
    if (user.avatar_preset) {
      return `/avatars/${user.avatar_preset}.png`;
    }
    if (user.avatar) {
      return user.avatar;
    }
    if (user.google_avatar) {
      return user.google_avatar;
    }
    return null;
  };
  const avatarUrl = getAvatarUrl();

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await api.patch('/api/auth/user/', formData, {
        headers: { 'Content-Type': undefined }
      });
      if (res.status === 200) {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      }
    } catch (err) {
      console.error('Upload avatar error:', err.response?.data || err);
      alert(`Failed to upload avatar. ${err.response?.data?.detail || ''}`);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const res = await api.patch('/api/auth/user/', {
        nickname,
        username
      });
      if (res.status === 200) {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
        setEditing(false);
      }
    } catch (err) {
      alert(err.response?.data?.username?.[0] || err.response?.data?.non_field_errors?.[0] || "Failed to update profile. Username might be taken.");
    }
  };

  const handleAvatarSelect = async (presetName) => {
    try {
      const res = await api.patch('/api/auth/user/', {
        avatar_preset: presetName
      });
      if (res.status === 200) {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
        setShowAvatarPicker(false);
      }
    } catch (err) {
      alert("Failed to save avatar selection.");
    }
  };

  return (
    <>
      <NeomorphicCard className="mb-5 overflow-hidden p-0 position-relative" elevation="convex">
        {/* Banner Section — Business accounts only */}
        {isBusiness && (
          <div className="position-relative" style={{ height: '250px', width: '100%' }}>
            <img 
              src={bannerSrc} 
              alt={`${subscriptionPlan} Membership`} 
              className="w-100 h-100" 
              style={{ objectFit: 'cover' }} 
            />
            <div className="position-absolute bottom-0 start-0 p-3">
              <span className="badge bg-dark bg-opacity-75 px-3 py-2 rounded-pill" style={{ backdropFilter: 'blur(8px)' }}>
                <i className="bi bi-shield-fill-check me-1"></i> 
                {subscriptionPlan === 'FREE' ? 'Bronze' : subscriptionPlan} Member
              </span>
            </div>
          </div>
        )}
        
        <div className={`px-4 pb-4 position-relative ${isBusiness ? '' : 'pt-4'}`} style={isBusiness ? { marginTop: '-60px' } : {}}>
          <div className="d-flex flex-column flex-md-row align-items-center align-items-md-end justify-content-between mb-4">
            
            {/* Avatar Section */}
            <div 
              className="text-center text-md-start mb-3 mb-md-0 position-relative z-1" 
              style={{ cursor: 'pointer' }} 
              onClick={() => {
                if (isCustomer) {
                  setShowAvatarPicker(true);
                } else if (isBusiness) {
                  avatarInputRef.current?.click();
                }
              }}
            >
              <div className="rounded-circle p-1 bg-white shadow-lg d-inline-block position-relative" style={{ width: '140px', height: '140px' }}>
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Avatar" 
                    className="rounded-circle w-100 h-100" 
                    style={{ objectFit: 'cover' }} 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="rounded-circle w-100 h-100 bg-light d-flex align-items-center justify-content-center">
                    <i className="bi bi-person-fill fs-1 text-secondary"></i>
                  </div>
                )}
                {/* Edit icon overlay */}
                <div className="position-absolute bottom-0 end-0 bg-dark rounded-circle p-2 shadow d-flex align-items-center justify-content-center" style={{ width: '35px', height: '35px', transform: 'translate(-10px, -10px)' }}>
                  {isCustomer ? (
                    <i className="bi bi-grid-fill text-white small"></i>
                  ) : (
                    <i className="bi bi-camera-fill text-white small"></i>
                  )}
                </div>
              </div>
              {/* Hidden file input — business only */}
              {isBusiness && (
                <input type="file" accept="image/*" className="d-none" ref={avatarInputRef} onChange={handleImageUpload} />
              )}
            </div>

            {/* Action buttons */}
            <div className="text-center text-md-end mt-4 mt-md-0 d-flex gap-2 justify-content-center justify-content-md-end align-items-center flex-wrap">
              {editing ? (
                <>
                  <button onClick={handleSaveProfile} className="neo-btn-accent px-4 py-2 rounded-pill shadow">Save</button>
                  <button onClick={() => setEditing(false)} className="neo-btn px-4 py-2 rounded-pill shadow">Cancel</button>
                </>
              ) : (
                <button onClick={() => setEditing(true)} className="neo-btn px-4 py-2 rounded-pill shadow">
                  <i className="bi bi-pencil-square me-2"></i> Edit Profile
                </button>
              )}
              <button
                onClick={async () => {
                  await logout();
                  navigate('/');
                }}
                className="neo-btn px-3 py-2 rounded-pill shadow text-danger"
                title="Logout"
              >
                <i className="bi bi-box-arrow-right me-1"></i> Logout
              </button>
            </div>
          </div>

          {/* User Info Section */}
          <div className="text-center text-md-start">
            {editing ? (
              <div className="row g-3 mb-3 max-w-500">
                <div className="col-12">
                  <input type="text" className="form-control neo-input fw-bold fs-4" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Nickname (Display Name)" />
                </div>
                <div className="col-12">
                  <div className="input-group">
                    <span className="input-group-text bg-transparent border-end-0 fw-bold">@</span>
                    <input type="text" className="form-control neo-input border-start-0 ps-0" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h2 className="fw-black mb-0">
                  {user.nickname || "Anonymous User"}
                </h2>
                <p className="text-secondary fw-semibold mb-3">
                  @{user.username || `user_${user.id}`}
                </p>
                
                {/* Business Stats Section */}
                {profile && (
                  <div className="d-flex flex-wrap gap-3 align-items-center mt-2">
                    <span className="neo-badge">{profile.category_name || 'No Category'}</span>
                    <span><i className="bi bi-star-fill text-warning me-1"></i> {profile.rating || '5.0'} Rating</span>
                    <label className="neo-switch">
                      <input 
                        type="checkbox" 
                        checked={profile.is_available || false} 
                        onChange={handleToggleOnline} 
                      />
                      <span className="neo-switch-slider"></span>
                      <span className="fw-bold small text-secondary">
                        {profile.is_available ? 'ONLINE & ACTIVE' : 'OFFLINE'}
                      </span>
                    </label>
                    <span className="text-muted small"><i className="bi bi-geo-alt-fill text-danger me-1"></i> {profile.location || 'Local'}</span>
                    {subscription && (
                      <div className="neo-badge text-primary px-3 py-1 fw-bold">
                        Subscription: {subscription.plan_type}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </NeomorphicCard>

      {/* Avatar Picker Modal — Customer accounts only */}
      {showAvatarPicker && isCustomer && (
        <AvatarPicker 
          currentAvatar={user.avatar_preset || ''} 
          onSelect={handleAvatarSelect} 
          onClose={() => setShowAvatarPicker(false)} 
        />
      )}
    </>
  );
}
