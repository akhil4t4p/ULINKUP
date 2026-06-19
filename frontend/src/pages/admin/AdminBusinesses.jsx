import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import NeomorphicCard from '../../components/NeomorphicCard';

export default function AdminBusinesses() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin-businesses/');
      if (res.status === 200) {
        setBusinesses(res.data.results || res.data);
      }
    } catch (err) {
      console.error("Failed to fetch businesses", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerification = async (bizId) => {
    if (!window.confirm("Toggle verification status for this business?")) return;
    try {
      const res = await api.post(`/api/admin-businesses/${bizId}/toggle_verification/`);
      if (res.status === 200) {
        setBusinesses(businesses.map(b => b.id === bizId ? { ...b, verified: res.data.verified } : b));
      }
    } catch (err) {
      alert("Failed to toggle verification");
    }
  };

  const handleChangePlan = async (bizId, newPlan) => {
    if (!window.confirm(`Upgrade/Downgrade this business to ${newPlan} plan?`)) return;
    try {
      const res = await api.post(`/api/admin-businesses/${bizId}/change_plan/`, { plan_tier: newPlan });
      if (res.status === 200) {
        setBusinesses(businesses.map(b => b.id === bizId ? { ...b, plan_tier: res.data.plan_tier, is_featured: res.data.is_featured } : b));
      }
    } catch (err) {
      alert("Failed to change plan");
    }
  };

  const filteredBusinesses = businesses.filter(b => 
    (b.username && b.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (b.user_email && b.user_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (b.category_name && b.category_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (b.location && b.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <h2 className="fw-black mb-0">Business Accounts Management</h2>
        <div className="d-flex gap-2">
          <input 
            type="text" 
            className="form-control neo-input" 
            placeholder="Search name, category, or location..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ minWidth: '300px' }}
          />
          <button onClick={fetchBusinesses} className="neo-btn" title="Refresh"><i className="bi bi-arrow-clockwise"></i></button>
        </div>
      </div>

      <NeomorphicCard className="p-0 overflow-hidden" elevation="convex">
        <div className="table-responsive">
          <table className="table table-hover table-borderless mb-0 align-middle">
            <thead className="bg-light text-muted small text-uppercase">
              <tr>
                <th className="py-3 px-4">Business / User</th>
                <th className="py-3">Category & Loc</th>
                <th className="py-3">Stats</th>
                <th className="py-3">Verification</th>
                <th className="py-3 text-center">Subscription Plan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-5">Loading businesses...</td></tr>
              ) : filteredBusinesses.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-5 text-muted">No businesses found.</td></tr>
              ) : (
                filteredBusinesses.map(biz => (
                  <tr key={biz.id} className="border-bottom border-light">
                    <td className="py-3 px-4">
                      <div className="fw-bold text-dark d-flex align-items-center gap-2">
                        {biz.username}
                        {biz.is_featured && <i className="bi bi-star-fill text-warning" title="Featured"></i>}
                      </div>
                      <div className="small text-muted">{biz.user_email}</div>
                    </td>
                    <td className="py-3">
                      <span className="badge bg-secondary mb-1">{biz.category_name || 'No Category'}</span>
                      <div className="small text-muted"><i className="bi bi-geo-alt-fill text-danger me-1"></i>{biz.location || 'N/A'}</div>
                    </td>
                    <td className="py-3 small">
                      <div><i className="bi bi-bullseye text-primary me-1"></i> {biz.leads_count} Leads</div>
                      <div><i className="bi bi-collection-fill text-secondary me-1"></i> {biz.groups_count} Groups</div>
                    </td>
                    <td className="py-3">
                      <button 
                        onClick={() => handleToggleVerification(biz.id)}
                        className={`btn btn-sm ${biz.verified ? 'btn-success' : 'btn-outline-secondary'} rounded-pill`}
                        style={{ fontSize: '0.75rem' }}
                      >
                        {biz.verified ? <><i className="bi bi-patch-check-fill me-1"></i> Verified</> : 'Unverified'}
                      </button>
                    </td>
                    <td className="py-3 text-center">
                      <div className="btn-group btn-group-sm shadow-sm" role="group">
                        <button 
                          onClick={() => handleChangePlan(biz.id, 'FREE')}
                          className={`btn ${biz.plan_tier === 'FREE' ? 'btn-dark' : 'btn-outline-dark'}`}
                        >
                          FREE
                        </button>
                        <button 
                          onClick={() => handleChangePlan(biz.id, 'SILVER')}
                          className={`btn ${biz.plan_tier === 'SILVER' ? 'btn-primary' : 'btn-outline-primary'}`}
                        >
                          SILVER
                        </button>
                        <button 
                          onClick={() => handleChangePlan(biz.id, 'GOLD')}
                          className={`btn ${biz.plan_tier === 'GOLD' ? 'btn-warning text-dark' : 'btn-outline-warning text-dark'}`}
                        >
                          <i className="bi bi-star-fill me-1"></i> GOLD
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </NeomorphicCard>
    </div>
  );
}
