import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import NeomorphicCard from '../components/NeomorphicCard';
import api from '../utils/api';

export default function CustomerDashboard() {
  const [walletBalance, setWalletBalance] = useState(0);
  const [addingCredits, setAddingCredits] = useState(false);
  const [creditAmount, setCreditAmount] = useState('100');

  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Wallet Credits and Transactions on Load
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const walletRes = await api.get('/api/wallets/');
        if (walletRes.status === 200) {
          const data = walletRes.data.results || walletRes.data;
          if (data.length > 0) {
            setWalletBalance(parseFloat(data[0].balance));
          }
        }
      } catch (err) {
        console.warn("Could not fetch real wallet, using mock state", err);
        setWalletBalance(150);
      }

      try {
        const transRes = await api.get('/api/transactions/');
        if (transRes.status === 200) {
          setInquiries(transRes.data.results || transRes.data);
        }
      } catch (err) {
        console.warn("Could not fetch real transaction logs, using mock logs", err);
        setInquiries([
          { id: 101, reference_id: 'UNLK_1', transaction_type: 'LEAD_UNLOCK', status: 'SUCCESS', created_at: '2026-06-18T10:00:00Z', amount: '15.00' },
          { id: 102, reference_id: 'PAY_MOCK_1', transaction_type: 'RECHARGE', status: 'SUCCESS', created_at: '2026-06-15T10:00:00Z', amount: '100.00' }
        ]);
      }
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  const handleAddCredits = async (e) => {
    e.preventDefault();
    const parsed = parseFloat(creditAmount);
    if (isNaN(parsed) || parsed <= 0) return;

    try {
      // 1. Create Razorpay order on backend
      const res = await api.post('/api/wallets/create_razorpay_order/', {
        amount: parsed,
        type: 'RECHARGE'
      });

      if (res.status === 200) {
        const orderData = res.data;

        // 2. Open payment flow
        if (orderData.mock) {
          const confirmPayment = window.confirm(`[MOCK PAYMENTS ENGINE] Simulate payment of ₹${parsed}?`);
          if (confirmPayment) {
            const verifyRes = await api.post('/api/wallets/verify_razorpay_payment/', {
              razorpay_order_id: orderData.order_id,
              type: 'RECHARGE'
            });
            if (verifyRes.status === 200 && verifyRes.data.success) {
              setWalletBalance(parseFloat(verifyRes.data.balance));
              setAddingCredits(false);
              setCreditAmount('100');
              
              // Refresh transaction list
              const transRes = await api.get('/api/transactions/');
              if (transRes.status === 200) {
                setInquiries(transRes.data.results || transRes.data);
              }
              alert(`Successfully recharged wallet with ₹${parsed} (Mock Mode)!`);
            }
          }
        } else {
          // Open real Razorpay popup
          const options = {
            key: orderData.key_id,
            amount: parseFloat(orderData.amount) * 100, // in paise
            currency: 'INR',
            name: 'ULINKUP Hyperlocal',
            description: 'Wallet Recharge',
            order_id: orderData.order_id,
            handler: async function (response) {
              try {
                const verifyRes = await api.post('/api/wallets/verify_razorpay_payment/', {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  type: 'RECHARGE'
                });
                if (verifyRes.status === 200 && verifyRes.data.success) {
                  setWalletBalance(parseFloat(verifyRes.data.balance));
                  setAddingCredits(false);
                  setCreditAmount('100');
                  
                  // Refresh transaction list
                  const transRes = await api.get('/api/transactions/');
                  if (transRes.status === 200) {
                    setInquiries(transRes.data.results || transRes.data);
                  }
                  alert("Payment successful! Wallet updated.");
                }
              } catch (verErr) {
                alert("Payment verification failed.");
              }
            },
            prefill: {
              email: 'user@ulinkup.com'
            },
            theme: {
              color: '#000000'
            }
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
        }
      }
    } catch (err) {
      alert("Order creation failed. Please check backend connection.");
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
              <h1 className="fw-black text-primary font-monospace">₹{walletBalance.toFixed(2)}</h1>
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
        {/* Shortcuts / Saved Providers */}
        <div className="col-lg-5">
          <h3 className="mb-4 d-flex align-items-center gap-2">
            <i className="bi bi-bookmark-star text-primary"></i> Saved Professionals
          </h3>
          <div className="d-flex flex-column gap-3">
            <NeomorphicCard elevation="convex" className="p-4 d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-1">Apex Plumbing Solutions</h5>
                <p className="text-muted mb-0 small">
                  <span className="neo-badge me-2">Plumber</span>
                  <i className="bi bi-geo-alt-fill me-1"></i> Bandra, Mumbai
                </p>
              </div>
              <div className="text-end d-flex flex-column align-items-end gap-2">
                <span className="text-warning small fw-bold"><i className="bi bi-star-fill"></i> 4.9</span>
                <Link to="/profile/1" className="neo-btn py-1 px-3 small text-decoration-none">Hire</Link>
              </div>
            </NeomorphicCard>
            
            <NeomorphicCard elevation="convex" className="p-4 d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-1">Dr. Sarah Carter (Physics)</h5>
                <p className="text-muted mb-0 small">
                  <span className="neo-badge me-2">Tutor</span>
                  <i className="bi bi-geo-alt-fill me-1"></i> Indiranagar, Bangalore
                </p>
              </div>
              <div className="text-end d-flex flex-column align-items-end gap-2">
                <span className="text-warning small fw-bold"><i className="bi bi-star-fill"></i> 4.8</span>
                <Link to="/profile/2" className="neo-btn py-1 px-3 small text-decoration-none">Hire</Link>
              </div>
            </NeomorphicCard>
          </div>
        </div>

        {/* Connection Transaction Logs */}
        <div className="col-lg-7">
          <h3 className="mb-4 d-flex align-items-center gap-2">
            <i className="bi bi-receipt text-primary"></i> Transaction Logs & Ledgers
          </h3>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          ) : inquiries.length > 0 ? (
            <div className="d-flex flex-column gap-3">
              {inquiries.map(inq => (
                <NeomorphicCard key={inq.id} elevation="convex" className="p-4">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="mb-0 fw-bold">
                      {inq.transaction_type === 'RECHARGE' ? 'Wallet Recharge Success' : 'Contact Details Unlocked'}
                    </h5>
                    <span className={`badge ${inq.status === 'SUCCESS' ? 'bg-success' : 'bg-secondary'} px-3 py-1 rounded-pill`}>
                      {inq.status}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center text-muted small mt-3">
                    <span>Date: {new Date(inq.created_at).toLocaleDateString()}</span>
                    <span className="fw-semibold text-dark">
                      {inq.transaction_type === 'RECHARGE' ? `+₹${inq.amount}` : `-₹${inq.amount}`}
                    </span>
                  </div>
                </NeomorphicCard>
              ))}
            </div>
          ) : (
            <NeomorphicCard elevation="inset" className="p-5 text-center text-muted">
              No transactions recorded yet.
            </NeomorphicCard>
          )}
        </div>
      </div>
    </div>
  );
}
