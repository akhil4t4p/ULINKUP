import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import NeomorphicCard from '../components/NeomorphicCard';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

export default function BusinessDashboard() {
  const { isAuthenticated } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [leads, setLeads] = useState([]);
  const [wallet, setWallet] = useState({ balance: 0.00 });
  const [subscription, setSubscription] = useState(null);

  // Forms
  const [profileForm, setProfileForm] = useState({
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

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Profile
      const profRes = await api.get('/api/businesses/me/');
      if (profRes.status === 200) {
        setProfile(profRes.data);
        setProfileForm({
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

    try {
      // 3. Fetch Wallet
      const walletRes = await api.get('/api/wallets/');
      if (walletRes.status === 200) {
        const wallets = walletRes.data.results || walletRes.data;
        if (wallets.length > 0) {
          setWallet(wallets[0]);
        }
      }
    } catch (err) {
      console.warn("Could not load wallet", err);
    }

    try {
      // 4. Fetch Leads
      const leadsRes = await api.get('/api/leads/');
      if (leadsRes.status === 200) {
        setLeads(leadsRes.data.results || leadsRes.data);
      }
    } catch (err) {
      console.warn("Could not load leads", err);
    }

    try {
      // 5. Fetch Subscription
      const subRes = await api.get('/api/subscriptions/');
      if (subRes.status === 200) {
        const subs = subRes.data.results || subRes.data;
        // Find active subscription
        const activeSub = subs.find(s => s.is_active);
        setSubscription(activeSub || null);
      }
    } catch (err) {
      console.warn("Could not load subscription", err);
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

  const handleQuickRecharge = async () => {
    try {
      const res = await api.post('/api/wallets/recharge/', { amount: 100 });
      if (res.status === 200) {
        setWallet(res.data);
        alert("Wallet recharged with ₹100 successfully!");
      }
    } catch (err) {
      alert("Quick recharge failed.");
    }
  };

  const unlockLead = async (leadId) => {
    try {
      const res = await api.post(`/api/leads/${leadId}/unlock/`);
      if (res.status === 200 && res.data.success) {
        // Update wallet balance
        setWallet(prev => ({ ...prev, balance: parseFloat(res.data.new_balance) }));
        // Update lead in list
        setLeads(prev => prev.map(lead => lead.id === leadId ? res.data.lead : lead));
        alert("Lead contact info unlocked!");
      }
    } catch (err) {
      alert(err.response?.data?.error || "Lead unlock failed. Please check wallet balance.");
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSubmittingProfile(true);
    try {
      const payload = { ...profileForm };
      if (!payload.category) delete payload.category; // Avoid null error if not set

      // Update basic fields
      let res = await api.patch('/api/businesses/me/', payload);

      // Handle photo upload if exists
      if (profilePhotoFile) {
        const formData = new FormData();
        formData.append('profile_photo', profilePhotoFile);
        res = await api.patch('/api/businesses/me/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
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
        setSubscription(res.data);
        alert(`Successfully upgraded to ${planType} Plan!`);
      }
    } catch (err) {
      alert("Subscription purchase failed. Ensure you have balance if payment integration is added, or check connection.");
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
      {/* Top Profile Summary Header Card */}
      <NeomorphicCard className="p-5 mb-4" elevation="convex">
        <div className="row align-items-center g-4">
          <div className="col-md-2 text-center text-md-start">
            <div className="neo-btn rounded-circle p-2 d-inline-flex bg-white justify-content-center align-items-center" style={{ width: '100px', height: '100px', overflow: 'hidden' }}>
              {profile?.profile_photo ? (
                <img src={profile.profile_photo} alt="" className="w-100 h-100 rounded-circle" style={{ objectFit: 'cover' }} />
              ) : (
                <i className="bi bi-person-workspace fs-1 text-primary"></i>
              )}
            </div>
          </div>
          <div className="col-md-7 text-center text-md-start">
            <h2 className="fw-black mb-1">{profile?.username || 'Professional Provider'}</h2>
            <p className="text-secondary mb-3">
              <span className="neo-badge me-2">{profile?.category_name || 'No Category'}</span>
              <span><i className="bi bi-star-fill text-warning me-1"></i> {profile?.rating || '5.0'} Rating</span>
            </p>
            <div className="d-flex flex-wrap gap-3 justify-content-center justify-content-md-start align-items-center">
              <label className="neo-switch">
                <input 
                  type="checkbox" 
                  checked={profile?.is_available || false} 
                  onChange={handleToggleOnline} 
                />
                <span className="neo-switch-slider"></span>
                <span className="fw-bold small text-secondary">
                  {profile?.is_available ? 'ONLINE & ACTIVE' : 'OFFLINE'}
                </span>
              </label>
              <span className="text-muted small"><i className="bi bi-geo-alt-fill text-danger me-1"></i> {profile?.location || 'Local'}</span>
            </div>
          </div>
          <div className="col-md-3 text-center text-md-end">
            <div className="neo-badge text-primary px-4 py-2 fw-bold">
              Subscription: {subscription ? subscription.plan_type : 'Free Starter'}
            </div>
          </div>
        </div>
      </NeomorphicCard>

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
      </div>

      {/* TAB CONTENT AREAS */}
      {activeTab === 'overview' && (
        <div>
          {/* Top Banner Row */}
          <div className="row g-4 mb-5">
            {/* Analytics Mini Dashboard */}
            <div className="col-md-6">
              <NeomorphicCard className="p-4 h-100 text-center d-flex flex-column justify-content-between">
                <h5 className="text-muted fw-bold mb-3">LEAD STATISTICS</h5>
                <div>
                  <h1 className="fw-black text-primary mb-1">{totalLeadsCount}</h1>
                  <p className="text-secondary small mb-0">Total Leads Received</p>
                </div>
                <div className="border-top pt-3 mt-3 text-start small">
                  <div className="d-flex justify-content-between text-muted">
                    <span>Unlocked Leads</span>
                    <span className="fw-bold text-dark">{unlockedLeadsCount}</span>
                  </div>
                </div>
              </NeomorphicCard>
            </div>

            {/* Wallet Balance Card */}
            <div className="col-md-6">
              <NeomorphicCard className="p-4 h-100 text-center d-flex flex-column justify-content-between">
                <h5 className="text-muted fw-bold mb-3">WALLET CREDITS</h5>
                <div>
                  <h1 className="fw-black text-primary mb-1">₹{parseFloat(wallet?.balance || 0).toFixed(2)}</h1>
                  <p className="text-secondary small mb-0">Cost per unlock: ₹15</p>
                </div>
                <button 
                  onClick={handleQuickRecharge} 
                  className="neo-btn py-3 w-100 mt-3 small"
                >
                  Quick Recharge (₹100)
                </button>
              </NeomorphicCard>
            </div>
          </div>

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
                        <i className="bi bi-unlock-fill"></i> Unlock Details (₹15)
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
                  value={profileForm.category}
                  onChange={(e) => setProfileForm({ ...profileForm, category: e.target.value })}
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold text-secondary">Profile Image</label>
                <input 
                  type="file" 
                  className="form-control neo-input"
                  accept="image/*"
                  onChange={(e) => setProfilePhotoFile(e.target.files[0])}
                />
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
    </div>
  );
}
