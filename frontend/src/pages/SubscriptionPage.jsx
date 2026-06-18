import React, { useState, useEffect, useContext } from 'react';
import NeomorphicCard from '../components/NeomorphicCard';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

const TIERS = [
  {
    key: 'FREE',
    name: 'Free Starter',
    price: '₹0',
    period: 'forever',
    desc: 'Perfect for beginners starting out local service networking.',
    features: ['Basic Local Directory Listing', 'Receive job inquiries', 'Pay ₹15 per lead unlock', 'No verification badge', 'Standard search listing priority'],
    accent: false,
    cta: 'Current Plan'
  },
  {
    key: 'SILVER',
    name: 'Silver Growth',
    price: '₹499',
    period: 'monthly',
    desc: 'Great value for active freelancers and growing businesses.',
    features: ['Standard Directory Listing', '10 Free Lead Unlocks per month', 'Pay ₹10 per additional lead', 'Silver Verification Badge', 'Medium search listing priority'],
    accent: true,
    cta: 'Upgrade to Silver'
  },
  {
    key: 'GOLD',
    name: 'Gold Enterprise',
    price: '₹1499',
    period: 'monthly',
    desc: 'Maximum exposure and infinite leads for top-tier professionals.',
    features: ['Featured Directory Listing', 'UNLIMITED Lead Unlocks', 'Zero cost per lead unlock', 'Gold Verification Badge', 'Top search listing priority', '1 Sponsored Banner Ad / month'],
    accent: false,
    cta: 'Upgrade to Gold'
  }
];

export default function SubscriptionPage() {
  const { isAuthenticated } = useContext(AuthContext);
  const [activeSub, setActiveSub] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchActiveSubscription = async () => {
      if (!isAuthenticated) return;
      try {
        const res = await api.get('/api/subscriptions/');
        if (res.status === 200) {
          const list = res.data.results || res.data;
          const active = list.find(s => s.is_active);
          setActiveSub(active || null);
        }
      } catch (err) {
        console.warn("Could not fetch active subscription", err);
      }
    };
    fetchActiveSubscription();
  }, [isAuthenticated]);

  const handleSubscribe = async (tierKey) => {
    if (!isAuthenticated) {
      alert("Please sign in to change your plan.");
      return;
    }
    if (tierKey === 'FREE') return;
    setLoading(true);

    const price = tierKey === 'SILVER' ? 499 : 1499;

    try {
      // 1. Create Razorpay order
      const res = await api.post('/api/wallets/create_razorpay_order/', {
        amount: price,
        type: 'SUBSCRIPTION',
        plan_type: tierKey
      });

      if (res.status === 200) {
        const orderData = res.data;

        // 2. Open payment flow
        if (orderData.mock) {
          const confirmPayment = window.confirm(`[MOCK PAYMENTS ENGINE] Simulate payment of ₹${price} for ${tierKey} Subscription?`);
          if (confirmPayment) {
            const verifyRes = await api.post('/api/wallets/verify_razorpay_payment/', {
              razorpay_order_id: orderData.order_id,
              type: 'SUBSCRIPTION',
              plan_type: tierKey
            });
            if (verifyRes.status === 200 && verifyRes.data.success) {
              // Fetch updated subscription list
              const subRes = await api.get('/api/subscriptions/');
              if (subRes.status === 200) {
                const list = subRes.data.results || subRes.data;
                const active = list.find(s => s.is_active);
                setActiveSub(active || null);
              }
              alert(`Successfully upgraded to the ${tierKey} plan (Mock Mode)!`);
            }
          }
        } else {
          // Open real Razorpay checkout
          const options = {
            key: orderData.key_id,
            amount: parseFloat(orderData.amount) * 100, // in paise
            currency: 'INR',
            name: 'ULINKUP Hyperlocal',
            description: `${tierKey} Subscription Upgrade`,
            order_id: orderData.order_id,
            handler: async function (response) {
              try {
                const verifyRes = await api.post('/api/wallets/verify_razorpay_payment/', {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  type: 'SUBSCRIPTION',
                  plan_type: tierKey
                });
                if (verifyRes.status === 200 && verifyRes.data.success) {
                  // Fetch updated subscription list
                  const subRes = await api.get('/api/subscriptions/');
                  if (subRes.status === 200) {
                    const list = subRes.data.results || subRes.data;
                    const active = list.find(s => s.is_active);
                    setActiveSub(active || null);
                  }
                  alert(`Successfully upgraded to the ${tierKey} plan!`);
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
      alert("Subscription upgrade order creation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="text-center mb-5">
        <h1 className="fw-black mb-2">Platform Subscriptions</h1>
        <p className="text-secondary lead">Select a subscription tier to unlock unlimited customer leads and gain profile visibility</p>
      </div>

      <div className="row g-4 justify-content-center">
        {TIERS.map((tier, idx) => {
          const isCurrent = (tier.key === 'FREE' && !activeSub) || (activeSub && activeSub.plan_type === tier.key);
          return (
            <div key={idx} className="col-md-6 col-lg-4">
              <NeomorphicCard 
                elevation={tier.accent ? 'concave' : 'convex'} 
                className={`p-5 h-100 d-flex flex-column justify-content-between ${tier.accent ? 'border border-dark border-3' : ''}`}
              >
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4 className="fw-bold mb-0">{tier.name}</h4>
                    {tier.accent && <span className="badge bg-dark text-white rounded-pill px-3 py-1">Best Value</span>}
                  </div>
                  
                  <p className="text-muted small mb-4">{tier.desc}</p>
                  
                  <div className="mb-4">
                    <span className="display-4 fw-black font-monospace">{tier.price}</span>
                    <span className="text-muted"> / {tier.period}</span>
                  </div>
                  
                  <hr className="my-4 opacity-25" />
                  
                  <ul className="list-unstyled d-flex flex-column gap-3 mb-4">
                    {tier.features.map((feat, fIdx) => (
                      <li key={fIdx} className="small d-flex align-items-start gap-2 text-secondary">
                        <i className="bi bi-check-circle-fill text-success mt-1"></i>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button 
                  disabled={isCurrent || loading}
                  onClick={() => handleSubscribe(tier.key)}
                  className={`w-100 py-3 ${tier.accent ? 'neo-btn-accent text-white border-0' : 'neo-btn'} ${isCurrent ? 'active border-dark' : ''}`}
                >
                  {isCurrent ? 'Current Plan' : tier.cta}
                </button>
              </NeomorphicCard>
            </div>
          );
        })}
      </div>
    </div>
  );
}
