import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import NeomorphicCard from '../components/NeomorphicCard';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

export default function ProfilePage() {
  const { id } = useParams();
  const { isAuthenticated } = useContext(AuthContext);

  const [provider, setProvider] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review Form state
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewAuthor, setNewReviewAuthor] = useState('');

  // Wallet and Unlock states
  const [contactUnlocked, setContactUnlocked] = useState(false);
  const [userCredits, setUserCredits] = useState(0);

  // Load Profile and Reviews from API
  useEffect(() => {
    const fetchProfileAndReviews = async () => {
      try {
        const profileRes = await api.get(`/api/businesses/${id}/`);
        if (profileRes.status === 200) {
          setProvider(profileRes.data);
        }
      } catch (err) {
        console.warn("Could not load real profile, using stubs", err);
        const STUBS = {
          "1": { name: 'Apex Plumbing Solutions', category_name: 'Plumber', rating: 4.9, experience: 8, location: 'Bandra, Mumbai', verified: true, hourly_rate: '400', about: 'Professional plumbing services specializing in pipe repairs, installation of fixtures, and leak detection for residential and commercial spaces.', phone: '+91 98765 43210', email: 'apex.plumbing@gmail.com' },
          "2": { name: 'Dr. Sarah Carter (Physics)', category_name: 'Tutor', rating: 4.8, experience: 12, location: 'Indiranagar, Bangalore', verified: true, hourly_rate: '800', about: 'Ph.D. in Physics offering personal tutoring for IIT JEE, NEET, and AP Physics. Focused on strengthening conceptual foundations and problem-solving skills.', phone: '+91 91234 56789', email: 'sarah.physics@tutor.org' },
          "3": { name: 'VoltMaster Electricals', category_name: 'Electrician', rating: 4.7, experience: 5, location: 'Salt Lake, Kolkata', verified: false, hourly_rate: '350', about: 'Experienced electric installation and repair specialist. Handles home wiring, circuit break updates, short circuit debugging, and appliance installations.', phone: '+91 99887 76655', email: 'voltmaster.electric@gmail.com' }
        };
        setProvider(STUBS[id] || STUBS["1"]);
      }

      try {
        const reviewsRes = await api.get(`/api/reviews/?business=${id}`);
        if (reviewsRes.status === 200) {
          setReviews(reviewsRes.data.results || reviewsRes.data);
        }
      } catch (err) {
        console.warn("Could not load real reviews, using stubs", err);
        setReviews([
          { id: 1, customer_name: 'Sandeep Sharma', rating: 5, comment: 'Quick response and resolved the sink leak in less than an hour! Highly recommend.', created_at: '2 days ago' },
          { id: 2, customer_name: 'Karan Malhotra', rating: 4, comment: 'Professional service, although they arrived 15 mins late. The repair work was excellent.', created_at: '1 week ago' }
        ]);
      }

      if (isAuthenticated) {
        try {
          // Fetch user wallet balance
          const walletRes = await api.get('/api/wallets/');
          if (walletRes.status === 200) {
            const walletData = walletRes.data.results || walletRes.data;
            if (walletData.length > 0) {
              setUserCredits(parseFloat(walletData[0].balance));
            }
          }
        } catch (e) {
          console.warn("Could not load user wallet", e);
        }

        try {
          // Check if contact is already unlocked (by reviewing transaction logs)
          const transRes = await api.get('/api/transactions/');
          if (transRes.status === 200) {
            const list = transRes.data.results || transRes.data;
            const alreadyUnlocked = list.some(t => t.transaction_type === 'LEAD_UNLOCK' && t.reference_id === `UNLK_${id}`);
            if (alreadyUnlocked) {
              setContactUnlocked(true);
            }
          }
        } catch (e) {
          // ignore
        }
      }

      setLoading(false);
    };

    fetchProfileAndReviews();
  }, [id, isAuthenticated]);

  const handleUnlockContact = async () => {
    if (!isAuthenticated) {
      alert("Please sign in to unlock contact details.");
      return;
    }

    try {
      const res = await api.post('/api/wallets/unlock_contact/', { business_id: id });
      if (res.status === 200 && res.data.success) {
        setContactUnlocked(true);
        setUserCredits(parseFloat(res.data.new_balance));
      }
    } catch (err) {
      alert(err.response?.data?.error || "Deduction failed. Ensure you have ₹15 credits.");
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;

    if (!isAuthenticated) {
      alert("Please sign in to write a review.");
      return;
    }

    try {
      const res = await api.post('/api/reviews/', {
        business: id,
        rating: newReviewRating,
        comment: newReviewText
      });

      if (res.status === 201) {
        setReviews([res.data, ...reviews]);
        setNewReviewText('');
        setNewReviewRating(5);
        alert("Review posted successfully!");
      }
    } catch (err) {
      alert(err.response?.data?.error || "Failed to post review. Only customers can write reviews.");
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="container py-5 text-center">
        <h3>Provider not found.</h3>
        <Link to="/search" className="neo-btn mt-3">Back to Search</Link>
      </div>
    );
  }

  return (
    <div className="container py-5">
      {/* Profile Header Block */}
      <NeomorphicCard className="p-5 mb-5" elevation="convex">
        <div className="row align-items-center g-4">
          <div className="col-md-2 text-center text-md-start">
            <div className="neo-btn rounded-circle p-4 d-inline-flex bg-white" style={{ width: '100px', height: '100px', pointerEvents: 'none' }}>
              {provider.profile_photo ? (
                <img src={provider.profile_photo} alt="" className="rounded-circle w-100 h-100" style={{ objectFit: 'cover' }} />
              ) : (
                <i className="bi bi-person-workspace fs-1 text-primary"></i>
              )}
            </div>
          </div>
          
          <div className="col-md-7 text-center text-md-start">
            <h1 className="fw-black mb-1 d-flex align-items-center justify-content-center justify-content-md-start gap-2">
              {provider.name || provider.username}
              {provider.verified && <i className="bi bi-patch-check-fill text-primary" title="Verified Business"></i>}
            </h1>
            <p className="text-secondary lead mb-2">
              <span className="neo-badge me-2">{provider.category_name}</span>
              <span><i className="bi bi-star-fill text-warning me-1"></i> {provider.rating || '5.0'} Rating</span>
              <span className="mx-2">•</span>
              <span>{provider.experience || 0} Yrs Exp</span>
            </p>
            <p className="text-muted mb-0"><i className="bi bi-geo-alt-fill text-danger me-1"></i> {provider.location || 'Local'}</p>
          </div>
          
          {/* Unlock Contacts Action Box */}
          <div className="col-md-3 text-center text-md-end">
            {contactUnlocked ? (
              <div className="neo-inset p-3 bg-white text-start" style={{ borderRadius: '15px' }}>
                <div className="small text-muted mb-2"><i className="bi bi-telephone-fill me-2 text-success"></i> {provider.phone || '+91 98765 43210'}</div>
                <div className="small text-muted"><i className="bi bi-envelope-fill me-2 text-primary"></i> {provider.email || 'apex.plumbing@gmail.com'}</div>
              </div>
            ) : (
              <div className="d-flex flex-column align-items-center align-items-md-end gap-2">
                <button 
                  onClick={handleUnlockContact} 
                  className="neo-btn-accent w-100 py-3"
                >
                  <i className="bi bi-unlock-fill me-2"></i> Get Contact (₹15)
                </button>
                <span className="text-muted small">Your Wallet Bal: ₹{userCredits}</span>
              </div>
            )}
          </div>
        </div>

        <hr className="my-4 opacity-25" />
        
        <div>
          <h4 className="fw-bold mb-3">About the Provider</h4>
          <p className="text-secondary" style={{ lineHeight: '1.6' }}>
            {provider.about || "No description provided yet by the professional."}
          </p>
        </div>
      </NeomorphicCard>

      {/* Portfolio Showcase */}
      <div className="mb-5">
        <h3 className="mb-4"><i className="bi bi-images text-primary"></i> Recent Project Portfolio</h3>
        <div className="row g-4">
          <div className="col-md-4">
            <NeomorphicCard className="p-0 overflow-hidden h-100" elevation="convex">
              <div className="bg-dark text-white d-flex align-items-center justify-content-center" style={{ height: '200px' }}>
                <i className="bi bi-check2-circle fs-1"></i>
              </div>
              <div className="p-4">
                <h5 className="fw-bold mb-1">Standard Project A</h5>
                <p className="text-muted small mb-0">Delivered successfully in hyperlocal range.</p>
              </div>
            </NeomorphicCard>
          </div>
          <div className="col-md-4">
            <NeomorphicCard className="p-0 overflow-hidden h-100" elevation="convex">
              <div className="bg-secondary text-white d-flex align-items-center justify-content-center" style={{ height: '200px' }}>
                <i className="bi bi-award fs-1"></i>
              </div>
              <div className="p-4">
                <h5 className="fw-bold mb-1">Commercial Fitting B</h5>
                <p className="text-muted small mb-0">Verified client audit and checkout completed.</p>
              </div>
            </NeomorphicCard>
          </div>
          <div className="col-md-4">
            <NeomorphicCard className="p-0 overflow-hidden h-100" elevation="convex">
              <div className="bg-dark text-white d-flex align-items-center justify-content-center" style={{ height: '200px' }}>
                <i className="bi bi-activity fs-1"></i>
              </div>
              <div className="p-4">
                <h5 className="fw-bold mb-1">Custom Overhaul C</h5>
                <p className="text-muted small mb-0">Completed with complete parts integration.</p>
              </div>
            </NeomorphicCard>
          </div>
        </div>
      </div>

      <div className="row g-5">
        {/* Customer Reviews list */}
        <div className="col-lg-7">
          <h3 className="mb-4"><i className="bi bi-star-fill text-warning"></i> Customer Reviews ({reviews.length})</h3>
          <div className="d-flex flex-column gap-3">
            {reviews.map(rev => (
              <NeomorphicCard key={rev.id} elevation="convex" className="p-4">
                <div className="d-flex justify-content-between mb-2">
                  <h5 className="mb-0 fw-bold">{rev.customer_name || rev.author || 'Anonymous'}</h5>
                  <span className="text-muted small">
                    {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
                <div className="text-warning mb-2">
                  {Array.from({ length: rev.rating }).map((_, i) => <i key={i} className="bi bi-star-fill"></i>)}
                  {Array.from({ length: 5 - rev.rating }).map((_, i) => <i key={i} className="bi bi-star text-muted"></i>)}
                </div>
                <p className="text-secondary mb-0 small">"{rev.comment}"</p>
              </NeomorphicCard>
            ))}
          </div>
        </div>

        {/* Submit Review Form */}
        <div className="col-lg-5">
          <h3 className="mb-4"><i className="bi bi-pencil-square text-primary"></i> Write a Review</h3>
          <NeomorphicCard className="p-4" elevation="convex">
            <form onSubmit={handleAddReview}>
              <div className="mb-3">
                <label className="form-label fw-bold text-secondary d-block">Rating</label>
                <div className="d-flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button 
                      key={star}
                      type="button" 
                      onClick={() => setNewReviewRating(star)}
                      className={`neo-btn py-1 px-3 ${newReviewRating === star ? 'active border-dark' : ''}`}
                    >
                      {star} <i className="bi bi-star-fill text-warning"></i>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold text-secondary">Your Review Comments</label>
                <textarea 
                  className="form-control neo-input" 
                  rows="4"
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                  placeholder="Share your experience hiring this provider..."
                  required
                ></textarea>
              </div>

              <button type="submit" className="w-100 neo-btn-accent py-3">
                Post Review
              </button>
            </form>
          </NeomorphicCard>
        </div>
      </div>
    </div>
  );
}
