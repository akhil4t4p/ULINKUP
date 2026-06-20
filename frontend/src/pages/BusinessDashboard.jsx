import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import NeomorphicCard from '../components/NeomorphicCard';
import UserProfileHeader from '../components/UserProfileHeader';
import ReferralSection from '../components/ReferralSection';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

export default function BusinessDashboard() {
  const { isAuthenticated } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [leads, setLeads] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [myAds, setMyAds] = useState([]);
  const [subscription, setSubscription] = useState(null);

  // Campaign Form States
  const [adForm, setAdForm] = useState({
    title: '',
    target_category: '',
    budget: '',
    start_date: '',
    end_date: ''
  });
  const [adBannerFile, setAdBannerFile] = useState(null);
  const [submittingAd, setSubmittingAd] = useState(false);
  const [editingAdId, setEditingAdId] = useState(null);
  const [editBudgetAmount, setEditBudgetAmount] = useState('');
  const [updatingAdBudget, setUpdatingAdBudget] = useState(false);

  // Forms
  const [profileForm, setProfileForm] = useState({
    username: '',
    category: '',
    experience: '',
    hourly_rate: '',
    location: '',
    work_timings: '',
    service_areas: '',
    about: ''
  });
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);

  const [portfolioForm, setPortfolioForm] = useState({
    title: '',
    description: ''
  });
  const [portfolioImageFile, setPortfolioImageFile] = useState(null);
  const [submittingPortfolio, setSubmittingPortfolio] = useState(false);
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customAdCategory, setCustomAdCategory] = useState('');
  const [isCustomAdCategory, setIsCustomAdCategory] = useState(false);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Profile
      const profRes = await api.get('/api/businesses/me/');
      if (profRes.status === 200) {
        setProfile(profRes.data);
        // Derive subscription from profile data
        setSubscription(profRes.data.subscription_plan ? { plan_type: profRes.data.subscription_plan } : null);
        setProfileForm({
          username: profRes.data.username || '',
          category: profRes.data.category || '',
          experience: profRes.data.experience || 0,
          hourly_rate: profRes.data.hourly_rate || '0.00',
          location: profRes.data.location || '',
          work_timings: profRes.data.work_timings || '',
          service_areas: profRes.data.service_areas || '',
          about: profRes.data.about || ''
        });
      }
    } catch (err) {
      console.error("Failed to load business profile", err);
    }

    try {
      // 2. Fetch Categories
      const catRes = await api.get('/api/categories/');
      if (catRes.status === 200) {
        setCategories(catRes.data.results || catRes.data);
      }
    } catch (err) {
      console.warn("Could not load categories", err);
    }

    // Removed wallet and subscription standalone endpoints (data comes from profile now)

    try {
      // 6. Fetch Analytics
      const analRes = await api.get('/api/businesses/analytics/');
      if (analRes.status === 200) {
        setAnalytics(analRes.data);
      }
    } catch (err) {
      console.warn("Could not load analytics", err);
    }

    try {
      // 7. Fetch Ad Campaigns
      const adsRes = await api.get('/api/ads/?my=true');
      if (adsRes.status === 200) {
        setMyAds(adsRes.data.results || adsRes.data);
      }
    } catch (err) {
      console.warn("Could not load ad campaigns", err);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  // Actions
  const handleToggleOnline = async () => {
    if (!profile) return;
    try {
      const res = await api.patch('/api/businesses/me/', {
        is_available: !profile.is_available
      });
      if (res.status === 200) {
        setProfile(res.data);
      }
    } catch (err) {
      alert("Failed to toggle online status.");
    }
  };

  // Actions

  const unlockLead = async (leadId) => {
    try {
      const res = await api.post(`/api/leads/${leadId}/unlock/`);
      if (res.status === 200 && res.data.success) {
        // Update lead in list
        setLeads(prev => prev.map(lead => lead.id === leadId ? res.data.lead : lead));
        fetchDashboardData();
        alert("Lead contact info unlocked!");
      }
    } catch (err) {
      alert(err.response?.data?.error || "Lead unlock failed. Please check your plan limits.");
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSubmittingProfile(true);
    try {
      const payload = { ...profileForm };

      // If custom category was typed, create it first
      if (isCustomCategory && customCategory.trim()) {
        try {
          const catRes = await api.post('/api/categories/', { name: customCategory.toUpperCase(), slug: customCategory.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and') });
          if (catRes.status === 201) {
            payload.category = catRes.data.id;
            // Refresh categories list
            const updatedCats = await api.get('/api/categories/');
            setCategories(updatedCats.data.results || updatedCats.data);
          }
        } catch (catErr) {
          // Category might already exist, try to find it
          const existingCats = await api.get('/api/categories/');
          const catList = existingCats.data.results || existingCats.data;
          setCategories(catList);
          const found = catList.find(c => c.name === customCategory.toUpperCase());
          if (found) payload.category = found.id;
        }
      }

      if (!payload.category) delete payload.category;

      // Update basic fields
      let res = await api.patch('/api/businesses/me/', payload);

      // Handle photo upload if exists
      if (profilePhotoFile) {
        const formData = new FormData();
        formData.append('profile_photo', profilePhotoFile);
        res = await api.patch('/api/businesses/me/', formData);
      }

      if (res.status === 200) {
        setProfile(res.data);
        setProfilePhotoFile(null);
        alert("Profile updated successfully!");
      }
    } catch (err) {
      alert("Failed to update profile settings.");
    } finally {
      setSubmittingProfile(false);
    }
  };

  const handleAddPortfolio = async (e) => {
    e.preventDefault();
    if (!portfolioImageFile) {
      alert("Please select a portfolio image file.");
      return;
    }
    setSubmittingPortfolio(true);
    try {
      const formData = new FormData();
      formData.append('image', portfolioImageFile);
      formData.append('title', portfolioForm.title);
      formData.append('description', portfolioForm.description);

      const res = await api.post('/api/portfolio/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.status === 201) {
        // Refresh profile to show new portfolio items
        const profRes = await api.get('/api/businesses/me/');
        if (profRes.status === 200) {
          setProfile(profRes.data);
        }
        // Reset form
        setPortfolioForm({ title: '', description: '' });
        setPortfolioImageFile(null);
        alert("Portfolio item uploaded successfully!");
      }
    } catch (err) {
      alert("Failed to upload portfolio item.");
    } finally {
      setSubmittingPortfolio(false);
    }
  };

  const handleBuySubscription = async (planType) => {
    try {
      const res = await api.post('/api/subscriptions/', { plan_type: planType });
      if (res.status === 201) {
        fetchDashboardData();
        alert(`Successfully upgraded to ${planType} Plan!`);
      }
    } catch (err) {
      alert("Subscription purchase failed. Ensure you have balance if payment integration is added, or check connection.");
    }
  };

  const handleCreateAd = async (e) => {
    e.preventDefault();
    if (!adBannerFile) {
      alert("Please select a banner image file.");
      return;
    }
    setSubmittingAd(true);
    try {
      const formData = new FormData();
      formData.append('title', adForm.title);
      formData.append('target_category', adForm.target_category);
      formData.append('budget', adForm.budget);
      formData.append('start_date', adForm.start_date);
      formData.append('end_date', adForm.end_date);
      formData.append('banner_image', adBannerFile);

      const res = await api.post('/api/ads/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.status === 201) {
        alert("Ad campaign created successfully!");
        setAdForm({
          title: '',
          target_category: '',
          budget: '',
          start_date: '',
          end_date: ''
        });
        setAdBannerFile(null);
        fetchDashboardData();
      }
    } catch (err) {
      alert(err.response?.data?.error || "Failed to create ad campaign.");
    } finally {
      setSubmittingAd(false);
    }
  };

  const handleToggleAdStatus = async (adId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PENDING' : 'ACTIVE';
    try {
      const res = await api.patch(`/api/ads/${adId}/`, { status: newStatus });
      if (res.status === 200) {
        setMyAds(prev => prev.map(ad => ad.id === adId ? res.data : ad));
        alert(`Ad campaign status updated to ${newStatus}.`);
        const analRes = await api.get('/api/businesses/analytics/');
        if (analRes.status === 200) {
          setAnalytics(analRes.data);
        }
      }
    } catch (err) {
      alert("Failed to toggle ad status.");
    }
  };

  const handleDeleteAd = async (adId) => {
    if (!window.confirm("Are you sure you want to delete this ad campaign?")) return;
    try {
      const res = await api.delete(`/api/ads/${adId}/`);
      if (res.status === 204 || res.status === 200) {
        alert("Ad campaign deleted successfully!");
        fetchDashboardData();
      }
    } catch (err) {
      alert("Failed to delete ad campaign.");
    }
  };

  const handleEditAdBudget = async (e) => {
    e.preventDefault();
    setUpdatingAdBudget(true);
    try {
      const res = await api.patch(`/api/ads/${editingAdId}/`, { budget: editBudgetAmount });
      if (res.status === 200) {
        alert("Ad budget updated successfully!");
        setEditingAdId(null);
        setEditBudgetAmount('');
        fetchDashboardData();
      }
    } catch (err) {
      alert(err.response?.data?.budget?.[0] || err.response?.data?.error || "Failed to update budget.");
    } finally {
      setUpdatingAdBudget(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  // Fallback mocks if backend fails to load list (for dev check convenience)
  const displayLeads = leads.length > 0 ? leads : [
    { id: 1, customer_name: 'Sandeep Sharma', service_description: 'Plumbing leak repair in kitchen sink', location: 'Bandra, Mumbai', created_at: '2026-06-18', is_locked: true, customer_phone: '+91 98765 43210', customer_email: 'sandeep@gmail.com' },
    { id: 2, customer_name: 'Rita Patel', service_description: 'Complete pipeline refitting', location: 'Khar, Mumbai', created_at: '2026-06-17', is_locked: false, customer_phone: '+91 91234 56789', customer_email: 'rita.patel@hotmail.com' }
  ];

  const totalLeadsCount = displayLeads.length;
  const unlockedLeadsCount = displayLeads.filter(l => !l.is_locked).length;

  return (
    <div className="container py-5">
      <UserProfileHeader 
        profile={profile} 
        subscription={subscription} 
        handleToggleOnline={handleToggleOnline} 
      />
      
      {/* Removed old profile summary header card to avoid duplication */}

      {/* Tabs Control Row */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        <button 
          onClick={() => setActiveTab('overview')} 
          className={`neo-btn py-2 px-4 ${activeTab === 'overview' ? 'active font-weight-bold border-dark' : ''}`}
        >
          <i className="bi bi-graph-up me-2"></i> Overview & Leads
        </button>
        <button 
          onClick={() => setActiveTab('profile')} 
          className={`neo-btn py-2 px-4 ${activeTab === 'profile' ? 'active font-weight-bold border-dark' : ''}`}
        >
          <i className="bi bi-gear-fill me-2"></i> Edit Profile Settings
        </button>
        <button 
          onClick={() => setActiveTab('portfolio')} 
          className={`neo-btn py-2 px-4 ${activeTab === 'portfolio' ? 'active font-weight-bold border-dark' : ''}`}
        >
          <i className="bi bi-images me-2"></i> Portfolio Items
        </button>
        <button 
          onClick={() => setActiveTab('subscription')} 
          className={`neo-btn py-2 px-4 ${activeTab === 'subscription' ? 'active font-weight-bold border-dark' : ''}`}
        >
          <i className="bi bi-credit-card-2-front-fill me-2"></i> Subscription Plans
        </button>
        <button 
          onClick={() => setActiveTab('campaigns')} 
          className={`neo-btn py-2 px-4 ${activeTab === 'campaigns' ? 'active font-weight-bold border-dark' : ''}`}
        >
          <i className="bi bi-megaphone-fill me-2"></i> Ad Campaigns
        </button>
      </div>

      {/* TAB CONTENT AREAS */}
      {activeTab === 'overview' && (
        <div>
          {/* Analytics Overview Metrics */}
          <div className="row g-4 mb-5">
            {/* Lead Stats Card */}
            <div className="col-md-4">
              <NeomorphicCard className="p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  <h5 className="text-muted fw-bold mb-3 uppercase small text-center">Lead Conversions</h5>
                  <div className="text-center my-3">
                    <h1 className="fw-black text-primary mb-1">{analytics?.leads?.total || totalLeadsCount}</h1>
                    <p className="text-secondary small mb-0">Total Leads Received</p>
                  </div>
                </div>
                <div className="border-top pt-3 mt-2 small">
                  <div className="d-flex justify-content-between text-muted mb-2">
                    <span>Unlocked Leads</span>
                    <span className="fw-bold text-dark">{analytics?.leads?.unlocked || unlockedLeadsCount}</span>
                  </div>
                  <div className="d-flex justify-content-between text-muted mb-1">
                    <span>Unlock Rate</span>
                    <span className="fw-bold text-primary">{analytics?.leads?.unlock_rate || '0.00'}%</span>
                  </div>
                  <div className="neo-inset w-100 bg-white" style={{ height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div className="bg-primary h-100" style={{ width: `${analytics?.leads?.unlock_rate || 0}%` }}></div>
                  </div>
                </div>
              </NeomorphicCard>
            </div>

            {/* Review Metrics Card */}
            <div className="col-md-4">
              <NeomorphicCard className="p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  <h5 className="text-muted fw-bold mb-3 uppercase small text-center">Reviews & Ratings</h5>
                  <div className="d-flex justify-content-around align-items-center my-2">
                    <div className="text-center">
                      <h1 className="fw-black text-warning mb-1">{analytics?.reviews?.average || '5.0'}</h1>
                      <p className="text-muted small mb-0">Avg Rating</p>
                    </div>
                    <div className="text-center">
                      <h3 className="fw-bold text-dark mb-1">{analytics?.reviews?.count || 0}</h3>
                      <p className="text-muted small mb-0">Total Reviews</p>
                    </div>
                  </div>
                </div>
                <div className="border-top pt-3 mt-2">
                  {['5', '4', '3', '2', '1'].map(star => {
                    const count = analytics?.reviews?.distribution?.[star] || 0;
                    const totalReviews = analytics?.reviews?.count || 1;
                    const pct = (count / totalReviews) * 100;
                    return (
                      <div key={star} className="d-flex align-items-center mb-1 gap-2 text-secondary small">
                        <span className="fw-bold" style={{ width: '40px' }}>{star} Star</span>
                        <div className="neo-inset flex-grow-1 bg-white" style={{ height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                          <div className="bg-warning h-100" style={{ width: `${pct}%` }}></div>
                        </div>
                        <span style={{ width: '25px', textAlign: 'right' }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </NeomorphicCard>
            </div>

            {/* Subscription & Quick Actions Card */}
            <div className="col-md-4">
              <NeomorphicCard className="p-4 h-100 d-flex flex-column justify-content-between text-center">
                <div>
                  <h5 className="text-muted fw-bold mb-3 uppercase small">Current Plan</h5>
                  <div className="my-3">
                    <h1 className="fw-black text-primary mb-1">{profile?.subscription_plan || 'FREE'}</h1>
                    <p className="text-secondary small mb-0">Connections Used: {profile?.lead_connections_count || 0}</p>
                    {profile?.subscription_plan === 'FREE' && (
                       <p className="text-danger small fw-bold">Limit: 10 Connections</p>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab('subscription')} 
                  className="neo-btn py-3 w-100 mt-2 small"
                >
                  Manage Subscription
                </button>
              </NeomorphicCard>
            </div>
          </div>

          {/* Advertising Campaigns Analytics */}
          <NeomorphicCard className="p-4 mb-5" elevation="convex">
            <h4 className="fw-bold mb-3"><i className="bi bi-megaphone-fill text-primary"></i> Hyperlocal Ad Campaigns Analytics</h4>
            {analytics?.advertising?.ads && analytics.advertising.ads.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-borderless align-middle small text-muted">
                  <thead>
                    <tr className="border-bottom text-secondary">
                      <th>Campaign Title</th>
                      <th className="text-center">Views / Impressions</th>
                      <th className="text-center">Clicks</th>
                      <th className="text-center">CTR (Click Rate)</th>
                      <th className="text-end">Budget</th>
                      <th className="text-end">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.advertising.ads.map(ad => (
                      <tr key={ad.id} className="border-bottom">
                        <td className="fw-bold text-dark">{ad.title}</td>
                        <td className="text-center">{ad.views}</td>
                        <td className="text-center">{ad.clicks}</td>
                        <td className="text-center fw-bold text-primary">{ad.ctr}%</td>
                        <td className="text-end">₹{ad.budget}</td>
                        <td className="text-end">
                          <span className={`badge ${ad.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'} rounded-pill px-3 py-1`}>
                            {ad.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 text-muted small">
                No active advertising campaigns. Toggle settings to purchase sponsored ads.
              </div>
            )}
          </NeomorphicCard>

          {/* Leads Section */}
          <h3 className="mb-4 d-flex align-items-center gap-2">
            <i className="bi bi-person-lines-fill text-primary"></i> Incoming Job Inquiries
          </h3>
          {displayLeads.length > 0 ? (
            <div className="row g-4">
              {displayLeads.map(lead => (
                <div key={lead.id} className="col-md-6 col-lg-4">
                  <NeomorphicCard elevation={lead.is_locked ? 'convex' : 'concave'} className="p-4 h-100 d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="text-muted small">
                          <i className="bi bi-clock me-1"></i> {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'Recent'}
                        </span>
                        <span className="text-muted small"><i className="bi bi-geo-alt-fill text-danger"></i> {lead.location}</span>
                      </div>
                      
                      <h5 className="fw-bold mb-2">
                        {lead.is_locked ? 'Lead: ' + lead.customer_name : lead.customer_name}
                      </h5>
                      <p className="text-secondary mb-3 small" style={{ minHeight: '40px' }}>
                        "{lead.service_description}"
                      </p>
                    </div>

                    {lead.is_locked ? (
                      <button 
                        onClick={() => unlockLead(lead.id)} 
                        className="w-100 neo-btn-accent py-3 d-flex align-items-center justify-content-center gap-2 text-white border-0"
                      >
                        <i className="bi bi-unlock-fill"></i> Unlock Details (7 ULU Coins)
                      </button>
                    ) : (
                      <div className="neo-inset p-3 bg-white" style={{ borderRadius: '12px' }}>
                        <div className="mb-2 text-muted small fw-bold"><i className="bi bi-telephone-fill me-2 text-success"></i> {lead.customer_phone || '+91 98765 43210'}</div>
                        <div className="text-muted small fw-bold"><i className="bi bi-envelope-fill me-2 text-primary"></i> {lead.customer_email || 'customer@gmail.com'}</div>
                      </div>
                    )}
                  </NeomorphicCard>
                </div>
              ))}
            </div>
          ) : (
            <NeomorphicCard elevation="inset" className="p-5 text-center text-muted">
              No job inquiries received yet.
            </NeomorphicCard>
          )}
          
          <ReferralSection />
        </div>
      )}

      {activeTab === 'profile' && (
        <NeomorphicCard className="p-5" elevation="convex">
          <h3 className="mb-4 fw-bold">Update Profile Details</h3>
          <form onSubmit={handleUpdateProfile}>
            <div className="row g-4">
              <div className="col-md-6">
                <label className="form-label fw-bold text-secondary">Trade Category</label>
                <select 
                  className="form-control neo-input"
                  value={isCustomCategory ? '__OTHERS__' : profileForm.category}
                  onChange={(e) => {
                    if (e.target.value === '__OTHERS__') {
                      setIsCustomCategory(true);
                      setCustomCategory('');
                      setProfileForm({ ...profileForm, category: '' });
                    } else {
                      setIsCustomCategory(false);
                      setProfileForm({ ...profileForm, category: e.target.value });
                    }
                  }}
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                  <option value="__OTHERS__">OTHERS (Type Manually)</option>
                </select>
                {isCustomCategory && (
                  <input
                    type="text"
                    className="form-control neo-input mt-2"
                    placeholder="Type your category (auto UPPERCASE)"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value.toUpperCase())}
                    autoFocus
                  />
                )}
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold text-secondary">Experience (Years)</label>
                <input 
                  type="number" 
                  className="form-control neo-input"
                  value={profileForm.experience}
                  onChange={(e) => setProfileForm({ ...profileForm, experience: parseInt(e.target.value) || 0 })}
                  placeholder="e.g. 5"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold text-secondary">Hourly Rate (₹)</label>
                <input 
                  type="number" 
                  className="form-control neo-input"
                  value={profileForm.hourly_rate}
                  onChange={(e) => setProfileForm({ ...profileForm, hourly_rate: e.target.value })}
                  placeholder="e.g. 400"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold text-secondary">Primary Location</label>
                <input 
                  type="text" 
                  className="form-control neo-input"
                  value={profileForm.location}
                  onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                  placeholder="e.g. Bandra, Mumbai"
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold text-secondary">Work Timings</label>
                <input 
                  type="text" 
                  className="form-control neo-input"
                  value={profileForm.work_timings}
                  onChange={(e) => setProfileForm({ ...profileForm, work_timings: e.target.value })}
                  placeholder="e.g. Mon-Sat: 9 AM - 7 PM"
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-bold text-secondary">Service Areas (Comma separated)</label>
                <input 
                  type="text" 
                  className="form-control neo-input"
                  value={profileForm.service_areas}
                  onChange={(e) => setProfileForm({ ...profileForm, service_areas: e.target.value })}
                  placeholder="e.g. Bandra West, Khar, Santacruz"
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-bold text-secondary">About / Bio</label>
                <textarea 
                  className="form-control neo-input"
                  rows="4"
                  value={profileForm.about}
                  onChange={(e) => setProfileForm({ ...profileForm, about: e.target.value })}
                  placeholder="Tell clients about your services, skills, and specializations..."
                ></textarea>
              </div>
            </div>

            <button type="submit" disabled={submittingProfile} className="neo-btn-accent py-3 px-5 mt-4 text-white border-0">
              {submittingProfile ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </NeomorphicCard>
      )}

      {activeTab === 'portfolio' && (
        <div>
          {/* Upload Portfolio Form */}
          <NeomorphicCard className="p-5 mb-5" elevation="convex">
            <h3 className="mb-4 fw-bold">Upload Portfolio Item</h3>
            <form onSubmit={handleAddPortfolio}>
              <div className="row g-4">
                <div className="col-md-6">
                  <label className="form-label fw-bold text-secondary">Project Title</label>
                  <input 
                    type="text" 
                    className="form-control neo-input"
                    value={portfolioForm.title}
                    onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })}
                    placeholder="e.g. Bathroom Leak Repaired"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold text-secondary">Project Photo</label>
                  <input 
                    type="file" 
                    className="form-control neo-input"
                    accept="image/*"
                    onChange={(e) => setPortfolioImageFile(e.target.files[0])}
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-bold text-secondary">Project Details / Description</label>
                  <textarea 
                    className="form-control neo-input"
                    rows="3"
                    value={portfolioForm.description}
                    onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })}
                    placeholder="Describe the problem, the solution, and what was achieved..."
                  ></textarea>
                </div>
              </div>
              <button type="submit" disabled={submittingPortfolio} className="neo-btn-accent py-3 px-5 mt-4 text-white border-0">
                {submittingPortfolio ? 'Uploading...' : 'Upload Item'}
              </button>
            </form>
          </NeomorphicCard>

          {/* Portfolio Grid */}
          <h3 className="mb-4"><i className="bi bi-images text-primary"></i> Current Project Portfolio</h3>
          {profile?.portfolio_items && profile.portfolio_items.length > 0 ? (
            <div className="row g-4">
              {profile.portfolio_items.map(item => (
                <div key={item.id} className="col-md-4">
                  <NeomorphicCard className="p-0 overflow-hidden h-100" elevation="convex">
                    <div className="bg-dark text-white d-flex align-items-center justify-content-center" style={{ height: '200px', overflow: 'hidden' }}>
                      <img src={item.image} alt={item.title} className="w-100 h-100" style={{ objectFit: 'cover' }} />
                    </div>
                    <div className="p-4">
                      <h5 className="fw-bold mb-2">{item.title}</h5>
                      <p className="text-muted small mb-0">{item.description || 'Delivered successfully.'}</p>
                    </div>
                  </NeomorphicCard>
                </div>
              ))}
            </div>
          ) : (
            <NeomorphicCard elevation="inset" className="p-5 text-center text-muted">
              No portfolio items uploaded yet. Use the form above to add some!
            </NeomorphicCard>
          )}
        </div>
      )}

      {activeTab === 'subscription' && (
        <div>
          <div className="text-center mb-5">
            <h2 className="fw-black mb-2">Upgrade Subscription Tier</h2>
            <p className="text-secondary lead">Current active plan: <span className="text-primary fw-bold">{subscription ? subscription.plan_type : 'Free Starter'}</span></p>
          </div>

          <div className="row g-4 justify-content-center">
            {/* Silver Plan Card */}
            <div className="col-md-6 col-lg-5">
              <NeomorphicCard elevation="convex" className="p-5 h-100 d-flex flex-column justify-content-between border-start border-4 border-dark">
                <div>
                  <h4 className="fw-bold mb-2">Silver Growth</h4>
                  <p className="text-muted small mb-4">Great value for active freelancers and growing businesses.</p>
                  <div className="mb-4">
                    <span className="display-4 fw-black font-monospace">₹499</span>
                    <span className="text-muted"> / monthly</span>
                  </div>
                  <hr className="my-4 opacity-25" />
                  <ul className="list-unstyled d-flex flex-column gap-3 mb-4">
                    <li className="small d-flex align-items-center gap-2 text-secondary">
                      <i className="bi bi-check-circle-fill text-success"></i> 10 Free Lead Unlocks / month
                    </li>
                    <li className="small d-flex align-items-center gap-2 text-secondary">
                      <i className="bi bi-check-circle-fill text-success"></i> Silver Verification Badge
                    </li>
                    <li className="small d-flex align-items-center gap-2 text-secondary">
                      <i className="bi bi-check-circle-fill text-success"></i> Medium search listing priority
                    </li>
                  </ul>
                </div>
                <button 
                  onClick={() => handleBuySubscription('SILVER')}
                  disabled={subscription?.plan_type === 'SILVER'}
                  className="w-100 py-3 neo-btn-accent text-white border-0"
                >
                  {subscription?.plan_type === 'SILVER' ? 'Active Plan' : 'Upgrade to Silver'}
                </button>
              </NeomorphicCard>
            </div>

            {/* Gold Plan Card */}
            <div className="col-md-6 col-lg-5">
              <NeomorphicCard elevation="convex" className="p-5 h-100 d-flex flex-column justify-content-between border-start border-4 border-primary">
                <div>
                  <h4 className="fw-bold mb-2">Gold Enterprise</h4>
                  <p className="text-muted small mb-4">Maximum exposure and infinite leads for top-tier professionals.</p>
                  <div className="mb-4">
                    <span className="display-4 fw-black font-monospace">₹1499</span>
                    <span className="text-muted"> / monthly</span>
                  </div>
                  <hr className="my-4 opacity-25" />
                  <ul className="list-unstyled d-flex flex-column gap-3 mb-4">
                    <li className="small d-flex align-items-center gap-2 text-secondary">
                      <i className="bi bi-check-circle-fill text-success"></i> UNLIMITED Lead Unlocks
                    </li>
                    <li className="small d-flex align-items-center gap-2 text-secondary">
                      <i className="bi bi-check-circle-fill text-success"></i> Gold Verification Badge
                    </li>
                    <li className="small d-flex align-items-center gap-2 text-secondary">
                      <i className="bi bi-check-circle-fill text-success"></i> Top search listing priority
                    </li>
                  </ul>
                </div>
                <button 
                  onClick={() => handleBuySubscription('GOLD')}
                  disabled={subscription?.plan_type === 'GOLD'}
                  className="w-100 py-3 neo-btn border-dark text-dark"
                >
                  {subscription?.plan_type === 'GOLD' ? 'Active Plan' : 'Upgrade to Gold'}
                </button>
              </NeomorphicCard>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div>
          {/* Create Campaign Form */}
          <NeomorphicCard className="p-5 mb-5" elevation="convex">
            <h3 className="mb-4 fw-bold">Launch New Hyperlocal Ad Campaign</h3>
            <form onSubmit={handleCreateAd}>
              <div className="row g-4">
                <div className="col-md-6">
                  <label className="form-label fw-bold text-secondary">Campaign Title</label>
                  <input 
                    type="text" 
                    className="form-control neo-input"
                    value={adForm.title}
                    onChange={(e) => setAdForm({ ...adForm, title: e.target.value })}
                    placeholder="e.g. 20% Off Plumbing Services"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold text-secondary">Banner Image</label>
                  <input 
                    type="file" 
                    className="form-control neo-input"
                    accept="image/*"
                    onChange={(e) => setAdBannerFile(e.target.files[0])}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold text-secondary">Target Category</label>
                  <select 
                    className="form-control neo-input"
                    value={isCustomAdCategory ? '__OTHERS__' : adForm.target_category}
                    onChange={(e) => {
                      if (e.target.value === '__OTHERS__') {
                        setIsCustomAdCategory(true);
                        setCustomAdCategory('');
                        setAdForm({ ...adForm, target_category: '' });
                      } else {
                        setIsCustomAdCategory(false);
                        setAdForm({ ...adForm, target_category: e.target.value });
                      }
                    }}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                    <option value="__OTHERS__">OTHERS (Type Manually)</option>
                  </select>
                  {isCustomAdCategory && (
                    <input
                      type="text"
                      className="form-control neo-input mt-2"
                      placeholder="Type target category (auto UPPERCASE)"
                      value={customAdCategory}
                      onChange={(e) => setCustomAdCategory(e.target.value.toUpperCase())}
                      autoFocus
                    />
                  )}
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold text-secondary">Budget (₹)</label>
                  <input 
                    type="number" 
                    className="form-control neo-input"
                    value={adForm.budget}
                    onChange={(e) => setAdForm({ ...adForm, budget: e.target.value })}
                    placeholder="e.g. 500"
                    min="1"
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold text-secondary">Start Date</label>
                  <input 
                    type="date" 
                    className="form-control neo-input"
                    value={adForm.start_date}
                    onChange={(e) => setAdForm({ ...adForm, start_date: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold text-secondary">End Date</label>
                  <input 
                    type="date" 
                    className="form-control neo-input"
                    value={adForm.end_date}
                    onChange={(e) => setAdForm({ ...adForm, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={submittingAd} className="neo-btn-accent py-3 px-5 mt-4 text-white border-0">
                {submittingAd ? 'Launching Campaign...' : 'Launch Campaign'}
              </button>
            </form>
          </NeomorphicCard>

          {/* Edit Budget Panel */}
          {editingAdId && (
            <NeomorphicCard className="p-4 mb-5 border-start border-4 border-warning" elevation="convex">
              <h5 className="fw-bold mb-3"><i className="bi bi-pencil-fill text-warning"></i> Adjust Ad Campaign Budget</h5>
              <form onSubmit={handleEditAdBudget} className="d-flex align-items-end gap-3 flex-wrap">
                <div>
                  <label className="form-label fw-bold text-secondary small">New Budget (₹)</label>
                  <input 
                    type="number" 
                    className="form-control neo-input" 
                    value={editBudgetAmount}
                    onChange={(e) => setEditBudgetAmount(e.target.value)}
                    required
                    style={{ width: '200px' }}
                  />
                </div>
                <div className="d-flex gap-2">
                  <button type="submit" disabled={updatingAdBudget} className="neo-btn-accent px-4 py-2 text-white border-0">
                    {updatingAdBudget ? 'Saving...' : 'Update Budget'}
                  </button>
                  <button type="button" onClick={() => { setEditingAdId(null); setEditBudgetAmount(''); }} className="neo-btn px-4 py-2">
                    Cancel
                  </button>
                </div>
                <div className="text-secondary small mt-1 w-100">
                  Budget changes will be logged in your transactions.
                </div>
              </form>
            </NeomorphicCard>
          )}

          {/* Ad Campaigns List */}
          <h3 className="mb-4"><i className="bi bi-megaphone-fill text-primary"></i> Your Ad Campaigns</h3>
          {myAds.length > 0 ? (
            <div className="row g-4">
              {myAds.map(ad => {
                const ctr = ad.views > 0 ? ((ad.clicks / ad.views) * 100).toFixed(2) : '0.00';
                return (
                  <div key={ad.id} className="col-md-6 col-lg-4">
                    <NeomorphicCard elevation="convex" className="p-0 overflow-hidden h-100 d-flex flex-column justify-content-between">
                      <div>
                        {/* Banner Image */}
                        <div className="bg-dark text-white d-flex align-items-center justify-content-center position-relative" style={{ height: '150px', overflow: 'hidden' }}>
                          {ad.banner_image ? (
                            <img src={ad.banner_image} alt={ad.title} className="w-100 h-100" style={{ objectFit: 'cover' }} />
                          ) : (
                            <i className="bi bi-megaphone fs-1"></i>
                          )}
                          <div className="position-absolute top-0 end-0 m-2">
                            <span className={`badge ${ad.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'} rounded-pill px-3 py-1`}>
                              {ad.status}
                            </span>
                          </div>
                        </div>
                        
                        {/* Details */}
                        <div className="p-4">
                          <h5 className="fw-bold mb-2">{ad.title}</h5>
                          <div className="text-muted small mb-3">
                            <i className="bi bi-tag-fill me-1 text-primary"></i> Category: {ad.category_name || 'General'}
                          </div>
                          
                          <div className="border-top pt-3 text-secondary small">
                            <div className="d-flex justify-content-between mb-1">
                              <span>Impressions (Views):</span>
                              <span className="fw-bold text-dark">{ad.views}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-1">
                              <span>Clicks:</span>
                              <span className="fw-bold text-dark">{ad.clicks}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                              <span>CTR:</span>
                              <span className="fw-bold text-primary">{ctr}%</span>
                            </div>
                            <div className="d-flex justify-content-between mb-1">
                              <span>Campaign Budget:</span>
                              <span className="fw-bold text-success">₹{ad.budget}</span>
                            </div>
                            <div className="d-flex justify-content-between small text-muted mt-2 border-top pt-2">
                              <span>Start: {ad.start_date}</span>
                              <span>End: {ad.end_date}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Campaign Actions */}
                      <div className="p-4 border-top bg-light d-flex gap-2">
                        <button 
                          onClick={() => handleToggleAdStatus(ad.id, ad.status)}
                          className="neo-btn flex-grow-1 py-2 text-center small"
                        >
                          {ad.status === 'ACTIVE' ? 'Pause' : 'Resume'}
                        </button>
                        <button 
                          onClick={() => {
                            setEditingAdId(ad.id);
                            setEditBudgetAmount(ad.budget);
                          }}
                          className="neo-btn py-2 px-3 small"
                          title="Edit Budget"
                        >
                          <i className="bi bi-pencil-fill text-warning"></i>
                        </button>
                        <button 
                          onClick={() => handleDeleteAd(ad.id)}
                          className="neo-btn py-2 px-3 small"
                          title="Delete Ad"
                        >
                          <i className="bi bi-trash-fill text-danger"></i>
                        </button>
                      </div>
                    </NeomorphicCard>
                  </div>
                );
              })}
            </div>
          ) : (
            <NeomorphicCard elevation="inset" className="p-5 text-center text-muted">
              You haven't launched any hyperlocal advertisement campaigns yet. Use the form above to get started!
            </NeomorphicCard>
          )}
        </div>
      )}
    </div>
  );
}
