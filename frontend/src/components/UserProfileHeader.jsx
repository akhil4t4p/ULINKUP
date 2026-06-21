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
  const [phoneNumber, setPhoneNumber] = useState(user.phone_number || '');
  const [whatsappNumber, setWhatsappNumber] = useState(user.whatsapp_number || '');
  const [businessEmail, setBusinessEmail] = useState(user.business_email || '');
  const [instagramUrl, setInstagramUrl] = useState(user.instagram_url || '');
  const [youtubeUrl, setYoutubeUrl] = useState(user.youtube_url || '');
  const [facebookUrl, setFacebookUrl] = useState(user.facebook_url || '');
  const [telegramUrl, setTelegramUrl] = useState(user.telegram_url || '');
  const [tiktokUrl, setTiktokUrl] = useState(user.tiktok_url || '');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  
  // Only business accounts can upload avatar photos
  const avatarInputRef = useRef(null);

  const isBusiness = user.role === 'BUSINESS';
  const isCustomer = user.role === 'CUSTOMER';

  // Determine which banner to show (business only)
  const subscriptionPlan = subscription?.plan_type || profile?.subscription_plan || 'FREE';
  const bannerSrc = MEMBERSHIP_BANNERS[subscriptionPlan] || MEMBERSHIP_BANNERS.FREE;

  // Resolve the avatar display URL: Google profile picture only for business; presets > uploaded > google for customer
  const getAvatarUrl = () => {
    if (isBusiness) {
      return user.google_avatar || null;
    }
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

  const handleSaveProfile = async () => {
    try {
      const res = await api.patch('/api/auth/user/', {
        nickname,
        username,
        phone_number: phoneNumber,
        whatsapp_number: whatsappNumber,
        business_email: businessEmail,
        instagram_url: instagramUrl,
        youtube_url: youtubeUrl,
        facebook_url: facebookUrl,
        telegram_url: telegramUrl,
        tiktok_url: tiktokUrl
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
              style={{ cursor: isCustomer ? 'pointer' : 'default' }} 
              onClick={() => {
                if (isCustomer) {
                  setShowAvatarPicker(true);
                }
              }}
            >
              <div className="p-1 bg-white shadow-lg d-inline-block position-relative" style={{ width: '140px', height: '140px', borderRadius: '24px', border: '3px solid #D4AF37' }}>
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Avatar" 
                    className="w-100 h-100" 
                    style={{ objectFit: 'cover', borderRadius: '20px' }} 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-100 h-100 bg-light d-flex align-items-center justify-content-center" style={{ borderRadius: '20px' }}>
                    <i className="bi bi-person-fill fs-1 text-secondary"></i>
                  </div>
                )}
                {/* Edit icon overlay — Customer only */}
                {isCustomer && (
                  <div className="position-absolute bottom-0 end-0 bg-dark rounded-circle p-2 shadow d-flex align-items-center justify-content-center" style={{ width: '35px', height: '35px', transform: 'translate(5px, 5px)' }}>
                    <i className="bi bi-grid-fill text-white small"></i>
                  </div>
                )}
              </div>
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
              <div className="row g-3 mb-3 max-w-500 text-start">
                <div className="col-12">
                  <label className="small fw-bold text-secondary">Nickname</label>
                  <input type="text" className="form-control neo-input fw-bold" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Nickname (Display Name)" />
                </div>
                <div className="col-12">
                  <label className="small fw-bold text-secondary">Username (limit: 1 change / 6 months)</label>
                  <div className="input-group">
                    <span className="input-group-text bg-transparent border-end-0 fw-bold">@</span>
                    <input type="text" className="form-control neo-input border-start-0 ps-0" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
                  </div>
                </div>
                
                <h6 className="mt-4 mb-2 fw-bold text-secondary border-bottom pb-2">Contact Details</h6>
                <div className="col-md-6">
                  <label className="small fw-bold text-secondary">Phone Number</label>
                  <input type="text" className="form-control neo-input" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+91 9876543210" />
                </div>
                <div className="col-md-6">
                  <label className="small fw-bold text-secondary">WhatsApp</label>
                  <input type="text" className="form-control neo-input" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="+91 9876543210" />
                </div>
                <div className="col-12">
                  <label className="small fw-bold text-secondary">Business Email</label>
                  <input type="email" className="form-control neo-input" value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} placeholder="contact@domain.com" />
                </div>

                <h6 className="mt-4 mb-2 fw-bold text-secondary border-bottom pb-2">Social Links</h6>
                <div className="col-12">
                  <label className="small fw-bold text-secondary"><i className="bi bi-instagram text-danger me-1"></i> Instagram</label>
                  <input type="url" className="form-control neo-input" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/username" />
                </div>
                <div className="col-12">
                  <label className="small fw-bold text-secondary"><i className="bi bi-youtube text-danger me-1"></i> YouTube</label>
                  <input type="url" className="form-control neo-input" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} />
                </div>
                <div className="col-12">
                  <label className="small fw-bold text-secondary"><i className="bi bi-facebook text-primary me-1"></i> Facebook</label>
                  <input type="url" className="form-control neo-input" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} />
                </div>
                <div className="col-12">
                  <label className="small fw-bold text-secondary"><i className="bi bi-telegram text-info me-1"></i> Telegram</label>
                  <input type="url" className="form-control neo-input" value={telegramUrl} onChange={(e) => setTelegramUrl(e.target.value)} />
                </div>
                <div className="col-12">
                  <label className="small fw-bold text-secondary"><i className="bi bi-tiktok text-dark me-1"></i> TikTok</label>
                  <input type="url" className="form-control neo-input" value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} />
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
                
                {/* Contact and Social Details Display */}
                <div className="mt-4 pt-3 border-top text-start">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-2">Personal Details</h6>
                      {user.phone_number && <div className="small mb-1"><i className="bi bi-telephone-fill text-secondary me-2"></i>{user.phone_number}</div>}
                      {user.whatsapp_number && <div className="small mb-1"><i className="bi bi-whatsapp text-success me-2"></i>{user.whatsapp_number}</div>}
                      {user.business_email && <div className="small mb-1"><i className="bi bi-envelope-fill text-primary me-2"></i>{user.business_email}</div>}
                    </div>
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-2">Socials</h6>
                      <div className="d-flex gap-2 flex-wrap">
                        {user.instagram_url && <a href={user.instagram_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-danger"><i className="bi bi-instagram"></i></a>}
                        {user.youtube_url && <a href={user.youtube_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-danger"><i className="bi bi-youtube"></i></a>}
                        {user.facebook_url && <a href={user.facebook_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary"><i className="bi bi-facebook"></i></a>}
                        {user.telegram_url && <a href={user.telegram_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-info"><i className="bi bi-telegram"></i></a>}
                        {user.tiktok_url && <a href={user.tiktok_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-dark"><i className="bi bi-tiktok"></i></a>}
                      </div>
                    </div>
                  </div>
                </div>
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
