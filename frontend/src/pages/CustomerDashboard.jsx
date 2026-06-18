import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import NeomorphicCard from '../components/NeomorphicCard';

const BOOKMARKS = [
  { id: 1, name: 'Apex Plumbing Solutions', category: 'Plumber', rating: 4.9, loc: 'Bandra, Mumbai' },
  { id: 2, name: 'Dr. Sarah Carter (Physics)', category: 'Tutor', rating: 4.8, loc: 'Indiranagar, Bangalore' }
];

const INQUIRIES = [
  { id: 101, provider: 'VoltMaster Electricals', status: 'Contact Unlocked', date: '2026-06-18', cost: '₹15' },
  { id: 102, provider: 'Apex Plumbing Solutions', status: 'Pending Review', date: '2026-06-15', cost: '₹0' }
];

export default function CustomerDashboard() {
  const [walletBalance, setWalletBalance] = useState(150);
  const [addingCredits, setAddingCredits] = useState(false);
  const [creditAmount, setCreditAmount] = useState('100');

  const handleAddCredits = (e) => {
    e.preventDefault();
    const parsed = parseFloat(creditAmount);
    if (!isNaN(parsed) && parsed > 0) {
      setWalletBalance(prev => prev + parsed);
      setAddingCredits(false);
    }
  };

  return (
    <div className="container py-5">
      {/* Welcome & Wallet Bar */}
      <div className="row g-4 mb-5 align-items-stretch">
        <div className="col-md-7">
          <NeomorphicCard className="p-5 h-100 d-flex flex-column justify-content-center">
            <h2 className="mb-2">Hello, Akhil!</h2>
            <p className="text-secondary mb-0">Manage your hyperlocal searches, review saved professionals, and unlock contact details seamlessly.</p>
          </NeomorphicCard>
        </div>
        
        {/* Wallet Credit Card */}
        <div className="col-md-5">
          <NeomorphicCard className="p-5 h-100 text-center d-flex flex-column justify-content-between">
            <div>
              <h5 className="text-muted fw-bold mb-2 uppercase">Wallet Credits</h5>
              <h1 className="fw-black text-primary font-monospace">₹{walletBalance}</h1>
            </div>
            
            {addingCredits ? (
              <form onSubmit={handleAddCredits} className="mt-3">
                <div className="input-group mb-2">
                  <span className="input-group-text bg-transparent border-0 font-weight-bold">₹</span>
                  <input 
                    type="number" 
                    className="form-control neo-input py-2" 
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="10"
                    required
                  />
                </div>
                <div className="d-flex gap-2">
                  <button type="submit" className="neo-btn-accent flex-fill py-2 small">Add</button>
                  <button type="button" onClick={() => setAddingCredits(false)} className="neo-btn flex-fill py-2 small">Cancel</button>
                </div>
              </form>
            ) : (
              <button 
                onClick={() => setAddingCredits(true)} 
                className="w-100 neo-btn py-3 mt-3"
              >
                <i className="bi bi-wallet2 me-2"></i> Recharge Wallet
              </button>
            )}
          </NeomorphicCard>
        </div>
      </div>

      <div className="row g-5">
        {/* Bookmarked Professionals */}
        <div className="col-lg-6">
          <h3 className="mb-4 d-flex align-items-center gap-2">
            <i className="bi bi-bookmark-star text-primary"></i> Saved Professionals
          </h3>
          {BOOKMARKS.length > 0 ? (
            <div className="d-flex flex-column gap-3">
              {BOOKMARKS.map(bookmark => (
                <NeomorphicCard key={bookmark.id} elevation="convex" className="p-4 d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-1">{bookmark.name}</h5>
                    <p className="text-muted mb-0 small">
                      <span className="neo-badge me-2">{bookmark.category}</span>
                      <i className="bi bi-geo-alt-fill me-1"></i> {bookmark.loc}
                    </p>
                  </div>
                  <div className="text-end d-flex flex-column align-items-end gap-2">
                    <span className="text-warning small fw-bold">
                      <i className="bi bi-star-fill"></i> {bookmark.rating}
                    </span>
                    <Link to={`/profile/${bookmark.id}`} className="neo-btn py-1 px-3 small text-decoration-none">
                      Hire
                    </Link>
                  </div>
                </NeomorphicCard>
              ))}
            </div>
          ) : (
            <NeomorphicCard elevation="inset" className="p-5 text-center text-muted">
              No saved profiles yet.
            </NeomorphicCard>
          )}
        </div>

        {/* Recent Connection Inquiries */}
        <div className="col-lg-6">
          <h3 className="mb-4 d-flex align-items-center gap-2">
            <i className="bi bi-chat-left-dots text-primary"></i> Unlocked Service Inquiries
          </h3>
          <div className="d-flex flex-column gap-3">
            {INQUIRIES.map(inq => (
              <NeomorphicCard key={inq.id} elevation="convex" className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h5 className="mb-0 fw-bold">{inq.provider}</h5>
                  <span className={`badge ${inq.status === 'Contact Unlocked' ? 'bg-success' : 'bg-secondary'} px-3 py-1 rounded-pill`}>
                    {inq.status}
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center text-muted small mt-3">
                  <span>Inquiry Date: {inq.date}</span>
                  <span className="fw-semibold">Cost: {inq.cost}</span>
                </div>
              </NeomorphicCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
