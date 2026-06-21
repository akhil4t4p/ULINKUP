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
          // Fetch user wallet balance (correct endpoint and field)
          const walletRes = await api.get('/api/coin-wallets/');
          if (walletRes.status === 200) {
            const walletData = walletRes.data.results || walletRes.data;
            if (walletData.length > 0) {
              setUserCredits(walletData[0].coins);
            }
          }
        } catch (e) {
          console.warn("Could not load user wallet", e);
        }

        try {
          // Check if contact is already unlocked (by reviewing coin transaction logs)
          const transRes = await api.get('/api/coin-transactions/');
          if (transRes.status === 200) {
            const list = transRes.data.results || transRes.data;
            const alreadyUnlocked = list.some(t => 
              t.transaction_type === 'SPEND' && 
              t.description && t.description.includes(`business ID ${id}`)
            );
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
      const res = await api.post('/api/coin-wallets/unlock_contact/', { business_id: id });
      if (res.status === 200 && res.data.success) {
        setContactUnlocked(true);
        setUserCredits(parseFloat(res.data.new_balance));
      }
    } catch (err) {
      alert(err.response?.data?.error || "Deduction failed. Ensure you have 7 ULU Coins.");
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
      {/* Instagram-Style Profile Header */}
      <NeomorphicCard className="mb-5 overflow-hidden p-0 position-relative" elevation="convex">
        {/* Banner Section */}
        <div className="bg-light position-relative" style={{ height: '250px', width: '100%' }}>
          {provider.banner ? (
            <img src={provider.banner} alt="Banner" className="w-100 h-100" style={{ objectFit: 'cover' }} />
          ) : (
            <div className="w-100 h-100 bg-secondary opacity-25"></div>
          )}
        </div>
        
        <div className="px-4 pb-4 position-relative" style={{ marginTop: '-60px' }}>
          <div className="d-flex flex-column flex-md-row align-items-center align-items-md-end justify-content-between mb-4">
            
            {/* Avatar Section */}
            <div className="text-center text-md-start mb-3 mb-md-0 position-relative z-1">
              <div className="rounded-circle p-1 bg-white shadow-lg d-inline-block" style={{ width: '140px', height: '140px' }}>
                {provider.avatar || provider.profile_photo ? (
                  <img src={provider.avatar || provider.profile_photo} alt="Avatar" className="rounded-circle w-100 h-100" style={{ objectFit: 'cover' }} />
                ) : (
                  <div className="rounded-circle w-100 h-100 bg-light d-flex align-items-center justify-content-center">
                    <i className="bi bi-person fs-1 text-secondary"></i>
                  </div>
                )}
              </div>
            </div>

            {/* Unlock Contacts Action Box */}
            <div className="text-center text-md-end mt-4 mt-md-0">
              {contactUnlocked ? (
                <div className="neo-inset p-3 bg-white text-start d-inline-block" style={{ borderRadius: '15px', minWidth: '250px' }}>
                  <div className="small text-muted mb-2"><i className="bi bi-telephone-fill me-2 text-success"></i> {provider.phone || '+91 98765 43210'}</div>
                  <div className="small text-muted"><i className="bi bi-envelope-fill me-2 text-primary"></i> {provider.email || 'contact@provider.com'}</div>
                </div>
              ) : (
                <div className="d-flex flex-column align-items-center align-items-md-end gap-2">
                  <button className="neo-btn-accent px-4 py-2" onClick={handleUnlockContact}>
                    <i className="bi bi-unlock-fill me-2"></i> Get Contact (7 ULU Coins)
                  </button>
                  <span className="text-muted small fw-semibold"><i className="bi bi-coin text-warning me-1"></i>Wallet: {userCredits} ULU Coins</span>
                </div>
              )}
            </div>
          </div>

          {/* User Info Section */}
          <div className="text-center text-md-start">
            <h2 className="fw-black mb-0 d-flex align-items-center justify-content-center justify-content-md-start gap-2">
              {provider.nickname || provider.name || provider.username || "Anonymous User"}
              {provider.verified && <i className="bi bi-patch-check-fill text-primary fs-4" title="Verified"></i>}
            </h2>
            <p className="text-secondary fw-semibold mb-3">
              @{provider.username || `user_${provider.id}`}
            </p>
            
            <p className="text-dark mb-3">
              <span className="neo-badge me-2 bg-light">{provider.category_name}</span>
              <span className="me-3"><i className="bi bi-star-fill text-warning me-1"></i> <strong>{provider.rating || '5.0'}</strong> Rating</span>
              <span className="me-3 text-muted">•</span>
              <span><strong>{provider.experience || 0}</strong> Yrs Exp</span>
            </p>

            <div className="d-flex flex-column flex-md-row gap-3 text-muted small">
              <div><i className="bi bi-geo-alt-fill text-danger me-1"></i> {provider.location || 'Local Area'}</div>
              {provider.work_timings && (
                <div><i className="bi bi-clock-fill text-primary me-1"></i> {provider.work_timings}</div>
              )}
            </div>

            <hr className="my-4 opacity-10" />
            
            <div>
              <h5 className="fw-bold mb-2">About</h5>
              <p className="text-secondary" style={{ lineHeight: '1.6', maxWidth: '800px' }}>
                {provider.about || "No description provided yet."}
              </p>
            </div>
          </div>
        </div>
      </NeomorphicCard>

      {/* Portfolio Showcase */}
      <div className="mb-5">
        <h3 className="mb-4"><i className="bi bi-images text-primary"></i> Recent Project Portfolio</h3>
        {provider.portfolio_items && provider.portfolio_items.length > 0 ? (
          <div className="row g-4">
            {provider.portfolio_items.map(item => (
              <div key={item.id} className="col-md-4">
                <NeomorphicCard className="p-0 overflow-hidden h-100" elevation="convex">
                  <div className="bg-dark text-white d-flex align-items-center justify-content-center" style={{ height: '200px', overflow: 'hidden' }}>
                    <img src={item.image} alt={item.title} className="w-100 h-100" style={{ objectFit: 'cover' }} />
                  </div>
                  <div className="p-4">
                    <h5 className="fw-bold mb-1">{item.title}</h5>
                    <p className="text-muted small mb-0">{item.description}</p>
                  </div>
                </NeomorphicCard>
              </div>
            ))}
          </div>
        ) : (
          <NeomorphicCard elevation="inset" className="p-5 text-center text-muted">
            No portfolio items uploaded by the provider.
          </NeomorphicCard>
        )}
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
