import React from 'react';
import NeomorphicCard from '../components/NeomorphicCard';

const TIERS = [
  {
    name: 'Free Starter',
    price: '₹0',
    period: 'forever',
    desc: 'Perfect for beginners starting out local service networking.',
    features: ['Basic Local Directory Listing', 'Receive job inquiries', 'Pay ₹15 per lead unlock', 'No verification badge', 'Standard search listing priority'],
    accent: false,
    cta: 'Current Plan'
  },
  {
    name: 'Silver Growth',
    price: '₹499',
    period: 'monthly',
    desc: 'Great value for active freelancers and growing businesses.',
    features: ['Standard Directory Listing', '10 Free Lead Unlocks per month', 'Pay ₹10 per additional lead', 'Silver Verification Badge', 'Medium search listing priority'],
    accent: true,
    cta: 'Upgrade to Silver'
  },
  {
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
  return (
    <div className="container py-5">
      <div className="text-center mb-5">
        <h1 className="fw-black mb-2">Platform Subscriptions</h1>
        <p className="text-secondary lead">Select a subscription tier to unlock unlimited customer leads and gain profile visibility</p>
      </div>

      <div className="row g-4 justify-content-center">
        {TIERS.map((tier, idx) => (
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
                className={`w-100 py-3 ${tier.accent ? 'neo-btn-accent text-white' : 'neo-btn'}`}
              >
                {tier.cta}
              </button>
            </NeomorphicCard>
          </div>
        ))}
      </div>
    </div>
  );
}
