import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import NeomorphicCard from '../components/NeomorphicCard';
import api from '../utils/api';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State from URL
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [location, setLocation] = useState(searchParams.get('loc') || localStorage.getItem('detected_location') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  
  // Custom Filter State
  const [minRating, setMinRating] = useState(4.0);
  const [minExp, setMinExp] = useState(0);
  const [maxRate, setMaxRate] = useState(1500);
  const [isAvailableOnly, setIsAvailableOnly] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  // Loaded DB data
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync state if searchParams change
  useEffect(() => {
    setQuery(searchParams.get('q') || '');
    setLocation(searchParams.get('loc') || localStorage.getItem('detected_location') || '');
    setCategory(searchParams.get('category') || '');
  }, [searchParams]);

  // Fetch categories on load
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/api/categories/');
        if (res.status === 200) {
          setCategories(res.data.results || res.data);
        }
      } catch (err) {
        console.warn("Could not load categories from backend", err);
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  // Fetch search results on filters update
  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      try {
        // Construct query parameters
        const params = {};
        if (query) params.q = query;
        if (location) params.loc = location;
        if (category) params.category = category;
        if (minRating) params.min_rating = minRating;
        if (minExp) params.min_exp = minExp;
        if (maxRate) params.max_rate = maxRate;
        if (isAvailableOnly) params.is_available = 'true';

        const res = await api.get('/api/businesses/', { params });
        if (res.status === 200) {
          setProviders(res.data.results || res.data);
        }
      } catch (err) {
        console.warn("Search query failed", err);
        setProviders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [query, location, category, minRating, minExp, maxRate, isAvailableOnly]);

  const clearFilters = () => {
    setQuery('');
    setLocation('');
    setCategory('');
    setMinRating(4.0);
    setMinExp(0);
    setMaxRate(1500);
    setIsAvailableOnly(false);
    setSearchParams({});
  };

  return (
    <div className="container py-5">
      <h1 className="fw-black mb-4">Find Local Professionals</h1>
      
      <div className="row g-4">
        {/* Sidebar Filters */}
        <div className="col-lg-4">
          <NeomorphicCard className="p-4" elevation="convex">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="mb-0">Filter Results</h4>
              <button onClick={clearFilters} className="btn btn-sm text-decoration-underline p-0 border-0 bg-transparent text-muted">
                Clear All
              </button>
            </div>

            {/* Keyword Search */}
            <div className="mb-3">
              <label className="form-label fw-bold text-secondary">Keyword</label>
              <input 
                type="text" 
                className="form-control neo-input" 
                placeholder="Search name or service" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {/* Location Search */}
            <div className="mb-3">
              <label className="form-label fw-bold text-secondary">Location</label>
              <input 
                type="text" 
                className="form-control neo-input" 
                placeholder="e.g. Bandra, Mumbai" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Category Dropdown */}
            <div className="mb-3">
              <label className="form-label fw-bold text-secondary">Category</label>
              <select 
                className="form-select neo-input" 
                value={isCustomCategory ? '__OTHERS__' : category}
                onChange={(e) => {
                  if (e.target.value === '__OTHERS__') {
                    setIsCustomCategory(true);
                    setCategory('');
                  } else {
                    setIsCustomCategory(false);
                    setCategory(e.target.value);
                  }
                }}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id || cat.slug} value={cat.name}>{cat.name}</option>
                ))}
                <option value="__OTHERS__">OTHERS (Type Manually)</option>
              </select>
              {isCustomCategory && (
                <input
                  type="text"
                  className="form-control neo-input mt-2"
                  placeholder="Type category name (auto UPPERCASE)"
                  value={category}
                  onChange={(e) => setCategory(e.target.value.toUpperCase())}
                  autoFocus
                />
              )}
            </div>

            {/* Rating Filter Slider */}
            <div className="mb-3">
              <div className="d-flex justify-content-between mb-1">
                <label className="form-label fw-bold text-secondary mb-0">Minimum Rating</label>
                <span className="fw-bold text-primary">{minRating} ★</span>
              </div>
              <input 
                type="range" 
                className="form-range" 
                min="4.0" 
                max="5.0" 
                step="0.1" 
                value={minRating}
                onChange={(e) => setMinRating(parseFloat(e.target.value))}
              />
            </div>

            {/* Experience Filter Slider */}
            <div className="mb-3">
              <div className="d-flex justify-content-between mb-1">
                <label className="form-label fw-bold text-secondary mb-0">Min Experience</label>
                <span className="fw-bold text-primary">{minExp} Years</span>
              </div>
              <input 
                type="range" 
                className="form-range" 
                min="0" 
                max="15" 
                step="1" 
                value={minExp}
                onChange={(e) => setMinExp(parseInt(e.target.value))}
              />
            </div>

            {/* Max Hourly Rate Filter Slider */}
            <div className="mb-3">
              <div className="d-flex justify-content-between mb-1">
                <label className="form-label fw-bold text-secondary mb-0">Max Hourly Rate</label>
                <span className="fw-bold text-primary">₹{maxRate}/hr</span>
              </div>
              <input 
                type="range" 
                className="form-range" 
                min="100" 
                max="2000" 
                step="50" 
                value={maxRate}
                onChange={(e) => setMaxRate(parseInt(e.target.value))}
              />
            </div>

            {/* Availability Filter Checkbox */}
            <div className="form-check form-switch mt-4">
              <input 
                type="checkbox" 
                className="form-check-input"
                id="isAvailableOnlySwitch"
                checked={isAvailableOnly}
                onChange={(e) => setIsAvailableOnly(e.target.checked)}
              />
              <label className="form-check-label fw-bold text-secondary" htmlFor="isAvailableOnlySwitch">
                Available Providers Only
              </label>
            </div>
          </NeomorphicCard>
        </div>

        {/* Search Listings Grid */}
        <div className="col-lg-8">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <span className="text-secondary">{providers.length} Professionals found</span>
            <div className="text-muted small">Showing local results</div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          ) : providers.length > 0 ? (
            <div className="row g-4">
              {providers.map(p => (
                <div key={p.id} className="col-md-6">
                  <NeomorphicCard 
                    className={`p-4 h-100 d-flex flex-column justify-content-between ${p.is_restricted ? 'opacity-50 grayscale' : ''}`}
                  >
                    <div>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span className={`neo-badge ${p.is_restricted ? 'bg-secondary text-white' : 'text-primary'}`}>
                          {p.category_name}
                        </span>
                        <div className="text-warning fw-bold small">
                          <i className="bi bi-star-fill"></i> {p.rating || 5.0}
                        </div>
                      </div>
                      
                      <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
                        {p.name || p.username}
                        {p.verified && <i className="bi bi-patch-check-fill text-primary" title="Verified Provider"></i>}
                        {p.is_restricted && <span className="badge bg-danger ms-2" style={{fontSize: '0.6rem'}}>INACTIVE</span>}
                      </h4>
                      <p className="text-muted small mb-3">
                        <i className="bi bi-geo-alt-fill me-1"></i> {p.location || 'Local'}
                      </p>
                      
                      <div className="neo-inset p-3 bg-white mb-3" style={{ borderRadius: '12px' }}>
                        <div className="small d-flex justify-content-between text-muted mb-1">
                          <span>Experience</span>
                          <span className="fw-bold text-dark">{p.experience || 0} Years</span>
                        </div>
                        <div className="small d-flex justify-content-between text-muted">
                          <span>Est. Rate</span>
                          <span className="fw-bold text-dark">₹{p.hourly_rate || '0'}/hr</span>
                        </div>
                      </div>
                      {p.is_restricted && (
                        <div className="text-danger small fw-bold text-center mb-3">
                          Maximum lead connection utilized
                        </div>
                      )}
                    </div>

                    {p.is_restricted ? (
                      <button className="w-100 neo-btn py-2 text-center text-muted" disabled>
                        Profile Locked
                      </button>
                    ) : (
                      <Link to={`/profile/${p.id}`} className="w-100 neo-btn-accent text-decoration-none py-2 text-center text-white">
                        View Work Portfolio
                      </Link>
                    )}
                  </NeomorphicCard>
                </div>
              ))}
            </div>
          ) : (
            <NeomorphicCard elevation="inset" className="p-5 text-center text-muted">
              <i className="bi bi-info-circle fs-1 d-block mb-3"></i>
              No professionals match your selected filter criteria. Try adjusting the sliders.
            </NeomorphicCard>
          )}
        </div>
      </div>
    </div>
  );
}
