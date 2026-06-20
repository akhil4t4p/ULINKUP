import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import NeomorphicCard from '../components/NeomorphicCard';
import UserProfileHeader from '../components/UserProfileHeader';
import ReferralSection from '../components/ReferralSection';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

const COIN_PACKS = [
  { code: 'STARTER', label: 'Starter Pack', price: 15, coins: 30 },
  { code: 'BASIC', label: 'Basic Pack', price: 29, coins: 70 },
  { code: 'MINI', label: 'Mini Pack', price: 49, coins: 130 },
  { code: 'POPULAR', label: 'Popular Pack', price: 99, coins: 300 },
  { code: 'SILVER', label: 'Silver Pack', price: 199, coins: 700 },
  { code: 'GOLD', label: 'Gold Pack', price: 499, coins: 2000 },
  { code: 'PREMIUM', label: 'Premium Pack', price: 999, coins: 5000 }
];

export default function CustomerDashboard() {
  const { user } = useContext(AuthContext);

  const [uluCoins, setUluCoins] = useState(0);
  const [addingCredits, setAddingCredits] = useState(false);
  const [selectedPack, setSelectedPack] = useState(null);

  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch ULU Coins and Transactions on Load
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const walletRes = await api.get('/api/coin-wallets/');
        if (walletRes.status === 200) {
          const data = walletRes.data.results || walletRes.data;
          if (data.length > 0) {
            setUluCoins(data[0].coins);
          }
        }
      } catch (err) {
        console.warn("Could not fetch coin wallet", err);
      }

      try {
        const transRes = await api.get('/api/coin-transactions/');
        if (transRes.status === 200) {
          setInquiries(transRes.data.results || transRes.data);
        }
      } catch (err) {
        console.warn("Could not fetch coin transactions", err);
      }
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  const handleRecharge = async (pack) => {
    try {
      const res = await api.post('/api/coin-wallets/create_razorpay_order/', {
        amount: pack.price,
        type: 'RECHARGE',
        plan_type: pack.code
      });

      if (res.status === 200) {
        const orderData = res.data;
        // Real Razorpay flow
        const options = {
          key: orderData.key_id,
          amount: parseFloat(orderData.amount) * 100, // in paise
          currency: 'INR',
          name: 'ULINKUP Hyperlocal',
          description: `Purchase ${pack.label} for ₹${pack.price}`,
          ...(orderData.real_order ? { order_id: orderData.order_id } : {}),
          handler: async function (response) {
            try {
              const verifyRes = await api.post('/api/coin-wallets/verify_razorpay_payment/', {
                razorpay_order_id: response.razorpay_order_id || orderData.order_id,
                razorpay_payment_id: response.razorpay_payment_id || 'pay_demo123',
                razorpay_signature: response.razorpay_signature || 'mock_signature',
                type: 'RECHARGE',
                plan_type: pack.code
              });
              if (verifyRes.status === 200 && verifyRes.data.success) {
                setUluCoins(verifyRes.data.coins);
                setAddingCredits(false);
                
                // Refresh transaction list
                const transRes = await api.get('/api/coin-transactions/');
                if (transRes.status === 200) {
                  setInquiries(transRes.data.results || transRes.data);
                }
                alert(`Successfully purchased ${pack.label}!`);
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
    } catch (err) {
      alert("Order creation failed: " + (err.response?.data?.error || "Please check backend connection."));
    }
  };

  return (
    <div className="container py-5">
      <UserProfileHeader />

      {/* Coin Bar */}
      <div className="row justify-content-end mb-5">
        <div className="col-md-12">
          <NeomorphicCard className="p-4 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
               <div className="rounded-circle d-flex align-items-center justify-content-center bg-warning text-dark fw-bold fs-2 shadow-sm" style={{width: '60px', height: '60px'}}>
                 <i className="bi bi-coin"></i>
               </div>
               <div>
                 <h5 className="text-muted fw-bold mb-1 uppercase">ULU Coins Balance</h5>
                 <h2 className="fw-black text-primary font-monospace mb-0">{uluCoins} <span className="fs-6 text-muted">Coins</span></h2>
               </div>
            </div>
            <button 
              onClick={() => setAddingCredits(!addingCredits)} 
              className="neo-btn py-3 px-4 fw-bold"
            >
              <i className="bi bi-plus-circle me-2"></i> Get More Coins
            </button>
          </NeomorphicCard>

          {addingCredits && (
             <div className="mt-4 row g-3">
                <h4 className="fw-bold mb-3"><i className="bi bi-shop"></i> Coin Store</h4>
                {COIN_PACKS.map(pack => (
                  <div className="col-md-3" key={pack.code}>
                     <NeomorphicCard className="p-4 text-center h-100 d-flex flex-column justify-content-between" elevation="convex">
                        <div>
                           <div className="text-warning mb-2 fs-1"><i className="bi bi-coin"></i></div>
                           <h5 className="fw-bold mb-1">{pack.coins} Coins</h5>
                           <p className="text-muted small">{pack.label}</p>
                        </div>
                        <div>
                           <h3 className="text-dark fw-black">₹{pack.price}</h3>
                           <button onClick={() => handleRecharge(pack)} className="neo-btn-accent w-100 mt-2 py-2">Buy Now</button>
                        </div>
                     </NeomorphicCard>
                  </div>
                ))}
             </div>
          )}
        </div>
      </div>

      <ReferralSection />

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
          </div>
        </div>

        {/* Transaction Logs */}
        <div className="col-lg-7">
          <h3 className="mb-4 d-flex align-items-center gap-2">
            <i className="bi bi-receipt text-primary"></i> Coin Transactions
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
                      {inq.transaction_type === 'RECHARGE' ? 'Coin Recharge' : 'Coins Spent'}
                    </h5>
                    <span className={`badge ${inq.transaction_type === 'RECHARGE' ? 'bg-success' : 'bg-danger'} px-3 py-1 rounded-pill`}>
                       {inq.transaction_type === 'RECHARGE' ? `+${inq.coins_amount}` : `-${inq.coins_amount}`}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center text-muted small mt-3">
                    <span>Date: {new Date(inq.created_at).toLocaleDateString()}</span>
                    <span>{inq.description}</span>
                  </div>
                </NeomorphicCard>
              ))}
            </div>
          ) : (
            <NeomorphicCard elevation="inset" className="p-5 text-center text-muted">
              No coin transactions recorded yet.
            </NeomorphicCard>
          )}
        </div>
      </div>
    </div>
  );
}
