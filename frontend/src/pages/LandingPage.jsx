import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import NeomorphicCard from '../components/NeomorphicCard';

const CATEGORIES = [
  { id: 'plumber', name: 'Plumber', icon: 'bi-droplet-fill' },
  { id: 'electrician', name: 'Electrician', icon: 'bi-lightning-charge-fill' },
  { id: 'tutor', name: 'Tutor', icon: 'bi-book-fill' },
  { id: 'cleaner', name: 'Cleaner', icon: 'bi-house-heart-fill' },
  { id: 'designer', name: 'Web Designer', icon: 'bi-laptop' },
  { id: 'salon', name: 'Salon & Spa', icon: 'bi-scissors' }
];

const FEATURED_PROVIDERS = [
  { id: 1, name: 'Apex Plumbing Solutions', category: 'Plumber', rating: 4.9, reviews: 24, loc: 'Bandra, Mumbai', verified: true },
  { id: 2, name: 'Dr. Sarah Carter (Physics)', category: 'Tutor', rating: 4.8, reviews: 42, loc: 'Indiranagar, Bangalore', verified: true },
  { id: 3, name: 'VoltMaster Electricals', category: 'Electrician', rating: 4.7, reviews: 18, loc: 'Salt Lake, Kolkata', verified: false }
];

const RECENT_ADS = [
  { title: 'Flat 20% Off - AC Servicing', provider: 'VoltMaster', badge: 'Sponsored' },
  { title: 'Free Demo Class for IIT JEE', provider: 'Dr. Sarah Carter', badge: 'Featured' }
];

export default function LandingPage() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(query)}&loc=${encodeURIComponent(location)}`);
  };

  const selectCategory = (categoryName) => {
    navigate(`/search?category=${encodeURIComponent(categoryName)}`);
  };

  return (
    <div className="container py-5">
      {/* Hero Section */}
      <div className="row align-items-center mb-5 py-4">
        <div className="col-lg-6 mb-4 mb-lg-0">
          <h1 className="display-4 fw-black mb-3">
            Find Hyperlocal <br />
            <span style={{ textShadow: '2px 2px var(--neo-dark)' }}>Professionals</span> Instantly.
          </h1>
          <p className="lead text-secondary mb-4" style={{ maxWidth: '480px' }}>
            Connect with verified local businesses, hire specialists, and browse active community advertisements in your neighborhood.
          </p>
          <div className="d-flex gap-3">
            <Link to="/select-account" className="neo-btn-accent text-decoration-none py-3 px-4">
              Get Listed Today <i className="bi bi-arrow-right ms-2"></i>
            </Link>
            <Link to="/search" className="neo-btn py-3 px-4">
              Explore Network
            </Link>
          </div>
        </div>
        
        {/* Search Bar / Panel */}
        <div className="col-lg-6">
          <NeomorphicCard className="p-5 animate-float">
            <h3 className="mb-4 text-center">Where do you need help?</h3>
            <form onSubmit={handleSearch}>
              <div className="mb-3">
                <label className="form-label fw-bold text-secondary">Service Needed</label>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-0 pe-0">
                    <i className="bi bi-search text-muted"></i>
                  </span>
                  <input 
                    type="text" 
                    className="form-control neo-input" 
                    placeholder="e.g. Plumber, Tutor, AC Repair..." 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="form-label fw-bold text-secondary">Your Location</label>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-0 pe-0">
                    <i className="bi bi-geo-alt text-muted"></i>
                  </span>
                  <input 
                    type="text" 
                    className="form-control neo-input" 
                    placeholder="e.g. Bandra, Mumbai or Pincode" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <button type="submit" className="w-100 neo-btn-accent py-3">
                Find Professionals
              </button>
            </form>
          </NeomorphicCard>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="mb-5 py-4">
        <h2 className="text-center mb-4">Browse Services</h2>
        <div className="row g-4 justify-content-center">
          {CATEGORIES.map(cat => (
            <div key={cat.id} className="col-6 col-sm-4 col-md-2 text-center">
              <button 
                onClick={() => selectCategory(cat.name)}
                className="neo-btn w-100 py-4 d-flex flex-column align-items-center justify-content-center gap-3"
                style={{ borderRadius: '20px', minHeight: '120px' }}
              >
                <i className={`bi ${cat.icon} fs-2 text-primary`}></i>
                <span className="fw-semibold small">{cat.name}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Ads & Providers Split Grid */}
      <div className="row g-5">
        {/* Featured Service Providers */}
        <div className="col-lg-7">
          <h2 className="mb-4">Top Rated Near You</h2>
          <div className="d-flex flex-column gap-4">
            {FEATURED_PROVIDERS.map(provider => (
              <NeomorphicCard key={provider.id} elevation="convex" className="d-flex flex-sm-row align-items-center justify-content-between p-4 gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="neo-btn p-3 rounded-circle" style={{ width: '60px', height: '60px', pointerEvents: 'none' }}>
                    <i className="bi bi-person-workspace fs-3"></i>
                  </div>
                  <div>
                    <h5 className="mb-1 d-flex align-items-center gap-2">
                      {provider.name}
                      {provider.verified && <i className="bi bi-patch-check-fill text-primary" title="Verified Provider"></i>}
                    </h5>
                    <p className="mb-0 text-muted small">
                      <span className="neo-badge me-2">{provider.category}</span>
                      <i className="bi bi-geo-alt-fill me-1"></i> {provider.loc}
                    </p>
                  </div>
                </div>
                
                <div className="text-sm-end d-flex flex-column align-items-center align-items-sm-end gap-2">
                  <div className="text-warning fw-bold d-flex align-items-center gap-1">
                    <i className="bi bi-star-fill"></i> {provider.rating} 
                    <span className="text-muted small fw-normal">({provider.reviews} reviews)</span>
                  </div>
                  <Link to={`/profile/${provider.id}`} className="neo-btn btn-sm py-2 px-3 small text-decoration-none">
                    View Profile
                  </Link>
                </div>
              </NeomorphicCard>
            ))}
          </div>
        </div>

        {/* Hyperlocal Sponsored Ads */}
        <div className="col-lg-5">
          <h2 className="mb-4">Sponsored Banners</h2>
          <div className="d-flex flex-column gap-4">
            {RECENT_ADS.map((ad, idx) => (
              <NeomorphicCard key={idx} elevation="concave" className="p-4 border-start border-4 border-dark">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="badge bg-dark text-white rounded-pill px-3 py-1">{ad.badge}</span>
                  <span className="text-muted small">Ad</span>
                </div>
                <h4 className="fw-bold my-2 text-primary">{ad.title}</h4>
                <p className="text-muted mb-3 small">Offered by {ad.provider} • Available hyperlocally in your area.</p>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-dark fw-bold">Limited Time</span>
                  <Link to="/search" className="neo-btn py-2 px-3 small text-decoration-none">
                    Claim Deal
                  </Link>
                </div>
              </NeomorphicCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
