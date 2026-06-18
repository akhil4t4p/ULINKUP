import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import NeomorphicCard from '../components/NeomorphicCard';

const INITIAL_LEADS = [
  { id: 1, name: 'Sandeep Sharma', service: 'Plumbing leak repair in kitchen sink', loc: 'Bandra, Mumbai', date: 'Today', locked: true, details: { phone: '+91 98765 43210', email: 'sandeep@gmail.com' } },
  { id: 2, name: 'Rita Patel', service: 'Complete pipeline refitting', loc: 'Khar, Mumbai', date: 'Yesterday', locked: true, details: { phone: '+91 91234 56789', email: 'rita.patel@hotmail.com' } },
  { id: 3, name: 'Rohit Sen', service: 'Bathroom bathroom drain jam', loc: 'Juhu, Mumbai', date: '3 days ago', locked: false, details: { phone: '+91 99887 76655', email: 'rohit.sen@yahoo.com' } }
];

export default function BusinessDashboard() {
  const [isOnline, setIsOnline] = useState(true);
  const [walletBalance, setWalletBalance] = useState(60); // simulated credits for business too
  const [leads, setLeads] = useState(INITIAL_LEADS);
  const [subscription, setSubscription] = useState('Silver Plan');

  const unlockLead = (leadId) => {
    if (walletBalance < 15) {
      alert("Insufficient wallet credits! Please recharge your wallet.");
      return;
    }
    
    setLeads(prev => prev.map(lead => {
      if (lead.id === leadId && lead.locked) {
        setWalletBalance(bal => bal - 15);
        return { ...lead, locked: false };
      }
      return lead;
    }));
  };

  return (
    <div className="container py-5">
      {/* Top Banner Row */}
      <div className="row g-4 mb-5 align-items-stretch">
        {/* Business Profile Title */}
        <div className="col-lg-6">
          <NeomorphicCard className="p-5 h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <span className="neo-badge text-primary">{subscription}</span>
                <label className="neo-switch">
                  <input 
                    type="checkbox" 
                    checked={isOnline} 
                    onChange={() => setIsOnline(prev => !prev)} 
                  />
                  <span className="neo-switch-slider"></span>
                  <span className="fw-bold small text-secondary">
                    {isOnline ? 'ONLINE & ACTIVE' : 'OFFLINE'}
                  </span>
                </label>
              </div>
              <h2 className="mb-2">Apex Plumbing Solutions</h2>
              <p className="text-secondary mb-0">Manage incoming lead requests, update active service areas, and check platform analytics.</p>
            </div>
            
            <div className="d-flex gap-2 mt-4">
              <Link to="/profile/1" className="neo-btn py-2 px-3 small text-decoration-none">
                View Public Profile
              </Link>
              <Link to="/subscriptions" className="neo-btn py-2 px-3 small text-decoration-none border-dark text-dark">
                Manage Plans
              </Link>
            </div>
          </NeomorphicCard>
        </div>

        {/* Analytics Mini Dashboard */}
        <div className="col-lg-3 col-md-6">
          <NeomorphicCard className="p-4 h-100 text-center d-flex flex-column justify-content-between">
            <h5 className="text-muted fw-bold mb-0">LEAD STATISTICS</h5>
            <div>
              <h1 className="fw-black text-primary mb-1">12</h1>
              <p className="text-secondary small mb-0">Total Leads Received</p>
            </div>
            <div className="border-top pt-3 text-start small">
              <div className="d-flex justify-content-between text-muted">
                <span>Unlocked Leads</span>
                <span className="fw-bold text-dark">8</span>
              </div>
            </div>
          </NeomorphicCard>
        </div>

        {/* Wallet Balance Card */}
        <div className="col-lg-3 col-md-6">
          <NeomorphicCard className="p-4 h-100 text-center d-flex flex-column justify-content-between">
            <h5 className="text-muted fw-bold mb-0">WALLET CREDITS</h5>
            <div>
              <h1 className="fw-black text-primary mb-1">₹{walletBalance}</h1>
              <p className="text-secondary small mb-0">Cost per unlock: ₹15</p>
            </div>
            <button 
              onClick={() => setWalletBalance(prev => prev + 100)} 
              className="neo-btn py-2 w-100 mt-2 small"
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
      <div className="row g-4">
        {leads.map(lead => (
          <div key={lead.id} className="col-md-6 col-lg-4">
            <NeomorphicCard elevation={lead.locked ? 'convex' : 'concave'} className="p-4 h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-muted small"><i className="bi bi-clock me-1"></i> {lead.date}</span>
                  <span className="text-muted small"><i className="bi bi-geo-alt-fill text-danger"></i> {lead.loc}</span>
                </div>
                
                <h5 className="fw-bold mb-2">
                  {lead.locked ? 'Lead: ' + lead.name.split(' ')[0] + ' ***' : lead.name}
                </h5>
                <p className="text-secondary mb-3 small" style={{ minHeight: '40px' }}>
                  "{lead.service}"
                </p>
              </div>

              {lead.locked ? (
                <button 
                  onClick={() => unlockLead(lead.id)} 
                  className="w-100 neo-btn-accent py-3 d-flex align-items-center justify-content-center gap-2"
                >
                  <i className="bi bi-unlock-fill"></i> Unlock Details (₹15)
                </button>
              ) : (
                <div className="neo-inset p-3 bg-white" style={{ borderRadius: '12px' }}>
                  <div className="mb-2 text-muted small fw-bold"><i className="bi bi-telephone-fill me-2 text-success"></i> {lead.details.phone}</div>
                  <div className="text-muted small fw-bold"><i className="bi bi-envelope-fill me-2 text-primary"></i> {lead.details.email}</div>
                </div>
              )}
            </NeomorphicCard>
          </div>
        ))}
      </div>
    </div>
  );
}
