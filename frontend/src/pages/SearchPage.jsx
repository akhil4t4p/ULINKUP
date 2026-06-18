import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import NeomorphicCard from '../components/NeomorphicCard';

const PROVIDERS = [
  { id: 1, name: 'Apex Plumbing Solutions', category: 'Plumber', rating: 4.9, experience: 8, loc: 'Bandra, Mumbai', verified: true, price: '₹400/hr' },
  { id: 2, name: 'Dr. Sarah Carter (Physics)', category: 'Tutor', rating: 4.8, experience: 12, loc: 'Indiranagar, Bangalore', verified: true, price: '₹800/hr' },
  { id: 3, name: 'VoltMaster Electricals', category: 'Electrician', rating: 4.7, experience: 5, loc: 'Salt Lake, Kolkata', verified: false, price: '₹350/hr' },
  { id: 4, name: 'Quick Shine Cleaning', category: 'Cleaner', rating: 4.5, experience: 3, loc: 'Bandra, Mumbai', verified: false, price: '₹250/hr' },
  { id: 5, name: 'Monochrome Pixels', category: 'Web Designer', rating: 4.9, experience: 6, loc: 'Juhu, Mumbai', verified: true, price: '₹1200/hr' },
  { id: 6, name: 'Glow Up Hair Salon', category: 'Salon & Spa', rating: 4.2, experience: 4, loc: 'Indiranagar, Bangalore', verified: false, price: '₹500/hr' }
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State from URL
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [location, setLocation] = useState(searchParams.get('loc') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  
  // Custom Filter State
  const [minRating, setMinRating] = useState(4.0);
  const [minExp, setMinExp] = useState(0);

  // Sync state if searchParams change
  useEffect(() => {
    setQuery(searchParams.get('q') || '');
    setLocation(searchParams.get('loc') || '');
    setCategory(searchParams.get('category') || '');
  }, [searchParams]);

  // Filter listings logic
  const filteredProviders = PROVIDERS.filter(p => {
    const matchQuery = query ? (p.name.toLowerCase().includes(query.toLowerCase()) || p.category.toLowerCase().includes(query.toLowerCase())) : true;
    const matchLoc = location ? p.loc.toLowerCase().includes(location.toLowerCase()) : true;
    const matchCat = category ? p.category === category : true;
    const matchRating = p.rating >= minRating;
    const matchExp = p.experience >= minExp;
    return matchQuery && matchLoc && matchCat && matchRating && matchExp;
  });

  const clearFilters = () => {
    setQuery('');
    setLocation('');
    setCategory('');
    setMinRating(4.0);
    setMinExp(0);
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
                style={{ appearance: 'none', backgroundPosition: 'right 16px center', backgroundImage: 'url("data:image/svg+xml;utf8,<svg fill=\'black\' height=\'24\' viewBox=\'0 0 24 24\' width=\'24\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/></svg>")' }}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="Plumber">Plumber</option>
                <option value="Electrician">Electrician</option>
                <option value="Tutor">Tutor</option>
                <option value="Cleaner">Cleaner</option>
                <option value="Web Designer">Web Designer</option>
                <option value="Salon & Spa">Salon & Spa</option>
              </select>
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
          </NeomorphicCard>
        </div>

        {/* Search Listings Grid */}
        <div className="col-lg-8">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <span className="text-secondary">{filteredProviders.length} Professionals found</span>
            <div className="text-muted small">Showing local results</div>
          </div>

          {filteredProviders.length > 0 ? (
            <div className="row g-4">
              {filteredProviders.map(p => (
                <div key={p.id} className="col-md-6">
                  <NeomorphicCard className="p-4 h-100 d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span className="neo-badge text-primary">{p.category}</span>
                        <div className="text-warning fw-bold small">
                          <i className="bi bi-star-fill"></i> {p.rating}
                        </div>
                      </div>
                      
                      <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
                        {p.name}
                        {p.verified && <i className="bi bi-patch-check-fill text-primary" title="Verified Provider"></i>}
                      </h4>
                      <p className="text-muted small mb-3">
                        <i className="bi bi-geo-alt-fill me-1"></i> {p.loc}
                      </p>
                      
                      <div className="neo-inset p-3 bg-white mb-3" style={{ borderRadius: '12px' }}>
                        <div className="small d-flex justify-content-between text-muted mb-1">
                          <span>Experience</span>
                          <span className="fw-bold text-dark">{p.experience} Years</span>
                        </div>
                        <div className="small d-flex justify-content-between text-muted">
                          <span>Est. Rate</span>
                          <span className="fw-bold text-dark">{p.price}</span>
                        </div>
                      </div>
                    </div>

                    <Link to={`/profile/${p.id}`} className="w-100 neo-btn-accent text-decoration-none py-2 text-center text-white">
                      View Work Portfolio
                    </Link>
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
