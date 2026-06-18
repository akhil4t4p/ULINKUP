import React from 'react';
import { useNavigate } from 'react-router-dom';
import NeomorphicCard from '../components/NeomorphicCard';

export default function AccountSelection() {
  const navigate = useNavigate();

  const handleSelection = (role) => {
    if (role === 'customer') {
      navigate('/customer/dashboard');
    } else {
      navigate('/business/dashboard');
    }
  };

  return (
    <div className="container py-5 d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <div className="text-center mb-5">
        <h1 className="fw-black mb-2">Choose Account Type</h1>
        <p className="text-secondary lead">Configure your ULINKUP experience to match your requirements</p>
      </div>

      <div className="row g-4 w-100 justify-content-center" style={{ maxWidth: '800px' }}>
        {/* Customer Choice */}
        <div className="col-md-6">
          <button 
            onClick={() => handleSelection('customer')}
            className="w-100 border-0 bg-transparent text-start p-0"
            style={{ display: 'block', outline: 'none' }}
          >
            <NeomorphicCard 
              elevation="convex" 
              className="p-5 h-100 d-flex flex-column gap-3 neo-btn text-start text-dark"
              style={{ borderRadius: '25px', display: 'flex' }}
            >
              <div className="neo-btn rounded-circle p-3 d-inline-flex align-items-center justify-content-center bg-white" style={{ width: '70px', height: '70px', pointerEvents: 'none' }}>
                <i className="bi bi-people-fill fs-2 text-primary"></i>
              </div>
              <h3 className="fw-bold mt-2">Customer Account</h3>
              <p className="text-muted mb-0 small">
                I am looking for local service providers, freelancers, and businesses. I want to search portfolios, read reviews, and hire professionals.
              </p>
              <div className="mt-auto pt-3 text-primary fw-bold">
                Enter Customer Portal <i className="bi bi-arrow-right-short fs-4 align-middle"></i>
              </div>
            </NeomorphicCard>
          </button>
        </div>

        {/* Business Choice */}
        <div className="col-md-6">
          <button 
            onClick={() => handleSelection('business')}
            className="w-100 border-0 bg-transparent text-start p-0"
            style={{ display: 'block', outline: 'none' }}
          >
            <NeomorphicCard 
              elevation="convex" 
              className="p-5 h-100 d-flex flex-column gap-3 neo-btn text-start text-dark"
              style={{ borderRadius: '25px', display: 'flex' }}
            >
              <div className="neo-btn rounded-circle p-3 d-inline-flex align-items-center justify-content-center bg-white" style={{ width: '70px', height: '70px', pointerEvents: 'none' }}>
                <i className="bi bi-briefcase-fill fs-2 text-primary"></i>
              </div>
              <h3 className="fw-bold mt-2">Business / Professional</h3>
              <p className="text-muted mb-0 small">
                I want to offer services, register my business profile, upload work portfolios, purchase subscriptions, and post sponsored advertisements.
              </p>
              <div className="mt-auto pt-3 text-primary fw-bold">
                Enter Business Portal <i className="bi bi-arrow-right-short fs-4 align-middle"></i>
              </div>
            </NeomorphicCard>
          </button>
        </div>
      </div>
    </div>
  );
}
