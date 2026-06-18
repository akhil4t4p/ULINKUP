import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import NeomorphicCard from '../components/NeomorphicCard';

const PROVIDERS_DATA = {
  "1": { name: 'Apex Plumbing Solutions', category: 'Plumber', rating: 4.9, experience: 8, loc: 'Bandra, Mumbai', verified: true, price: '₹400/hr', about: 'Professional plumbing services specializing in pipe repairs, installation of fixtures, and leak detection for residential and commercial spaces.', phone: '+91 98765 43210', email: 'apex.plumbing@gmail.com' },
  "2": { name: 'Dr. Sarah Carter (Physics)', category: 'Tutor', rating: 4.8, experience: 12, loc: 'Indiranagar, Bangalore', verified: true, price: '₹800/hr', about: 'Ph.D. in Physics offering personal tutoring for IIT JEE, NEET, and AP Physics. Focused on strengthening conceptual foundations and problem-solving skills.', phone: '+91 91234 56789', email: 'sarah.physics@tutor.org' },
  "3": { name: 'VoltMaster Electricals', category: 'Electrician', rating: 4.7, experience: 5, loc: 'Salt Lake, Kolkata', verified: false, price: '₹350/hr', about: 'Experienced electric installation and repair specialist. Handles home wiring, circuit break updates, short circuit debugging, and appliance installations.', phone: '+91 99887 76655', email: 'voltmaster.electric@gmail.com' }
};

const INITIAL_REVIEWS = [
  { id: 1, author: 'Sandeep Sharma', rating: 5, comment: 'Quick response and resolved the sink leak in less than an hour! Highly recommend.', date: '2 days ago' },
  { id: 2, author: 'Karan Malhotra', rating: 4, comment: 'Professional service, although they arrived 15 mins late. The repair work was excellent.', date: '1 week ago' }
];

export default function ProfilePage() {
  const { id } = useParams();
  const provider = PROVIDERS_DATA[id] || PROVIDERS_DATA["1"]; // Fallback to 1

  const [reviews, setReviews] = useState(INITIAL_REVIEWS);
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewAuthor, setNewReviewAuthor] = useState('');

  const [contactUnlocked, setContactUnlocked] = useState(false);
  const [userCredits, setUserCredits] = useState(100);

  const handleUnlockContact = () => {
    if (userCredits < 15) {
      alert("Insufficient credits to unlock contact information.");
      return;
    }
    setUserCredits(prev => prev - 15);
    setContactUnlocked(true);
  };

  const handleAddReview = (e) => {
    e.preventDefault();
    if (!newReviewText.trim() || !newReviewAuthor.trim()) return;

    const review = {
      id: Date.now(),
      author: newReviewAuthor,
      rating: newReviewRating,
      comment: newReviewText,
      date: 'Just now'
    };

    setReviews([review, ...reviews]);
    setNewReviewText('');
    setNewReviewAuthor('');
    setNewReviewRating(5);
  };

  return (
    <div className="container py-5">
      {/* Profile Header Block */}
      <NeomorphicCard className="p-5 mb-5" elevation="convex">
        <div className="row align-items-center g-4">
          <div className="col-md-2 text-center text-md-start">
            <div className="neo-btn rounded-circle p-4 d-inline-flex bg-white" style={{ width: '100px', height: '100px', pointerEvents: 'none' }}>
              <i className="bi bi-person-workspace fs-1 text-primary"></i>
            </div>
          </div>
          
          <div className="col-md-7 text-center text-md-start">
            <h1 className="fw-black mb-1 d-flex align-items-center justify-content-center justify-content-md-start gap-2">
              {provider.name}
              {provider.verified && <i className="bi bi-patch-check-fill text-primary" title="Verified Business"></i>}
            </h1>
            <p className="text-secondary lead mb-2">
              <span className="neo-badge me-2">{provider.category}</span>
              <span><i className="bi bi-star-fill text-warning me-1"></i> {provider.rating} Rating</span>
              <span className="mx-2">•</span>
              <span>{provider.experience} Yrs Exp</span>
            </p>
            <p className="text-muted mb-0"><i className="bi bi-geo-alt-fill text-danger me-1"></i> {provider.loc}</p>
          </div>
          
          {/* Unlock Contacts Action Box */}
          <div className="col-md-3 text-center text-md-end">
            {contactUnlocked ? (
              <div className="neo-inset p-3 bg-white text-start" style={{ borderRadius: '15px' }}>
                <div className="small text-muted mb-1"><i className="bi bi-telephone-fill me-2 text-success"></i> {provider.phone}</div>
                <div className="small text-muted"><i className="bi bi-envelope-fill me-2 text-primary"></i> {provider.email}</div>
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
            {provider.about}
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
                  <h5 className="mb-0 fw-bold">{rev.author}</h5>
                  <span className="text-muted small">{rev.date}</span>
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
                <label className="form-label fw-bold text-secondary">Your Name</label>
                <input 
                  type="text" 
                  className="form-control neo-input" 
                  value={newReviewAuthor}
                  onChange={(e) => setNewReviewAuthor(e.target.value)}
                  placeholder="e.g. Akhil K."
                  required
                />
              </div>

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
