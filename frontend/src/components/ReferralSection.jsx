import React, { useState, useEffect, useContext } from 'react';
import NeomorphicCard from './NeomorphicCard';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

export default function ReferralSection() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    total_invites: 0,
    successful_invites: 0,
    coins_earned: 0,
    pending_invites: 0,
    referral_code: user?.referral_code || ''
  });
  const [notifications, setNotifications] = useState([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(true);

  const inviteCode = stats.referral_code || user?.referral_code || 'AKHIL12345';
  const inviteLink = `${window.location.origin}/signup?ref=${inviteCode}`;

  const fetchReferralData = async () => {
    try {
      const statsRes = await api.get('/api/coin-wallets/referral-stats/');
      if (statsRes.status === 200) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.warn("Could not load referral stats from backend", err);
    }

    try {
      const notifRes = await api.get('/api/notifications/');
      if (notifRes.status === 200) {
        setNotifications(notifRes.data.results || notifRes.data);
      }
    } catch (err) {
      console.warn("Could not load notifications from backend", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReferralData();
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await api.post('/api/notifications/mark_all_read/');
      if (res.status === 200) {
        // Refresh notifications
        fetchReferralData();
      }
    } catch (err) {
      console.warn("Failed to mark all as read", err);
    }
  };

  const handleShareInstagram = () => {
    navigator.clipboard.writeText(inviteLink);
    alert("Invite Link copied! Open Instagram and paste it in your Story sticker or Bio to share with friends. 📸");
  };

  return (
    <div className="referral-section mt-5">
      <h3 className="mb-4 d-flex align-items-center gap-2">
        <i className="bi bi-gift text-primary fs-4"></i> Referrals & Rewards
      </h3>

      <div className="row g-4 mb-5">
        {/* Referral Code & Share Link Card */}
        <div className="col-lg-6">
          <NeomorphicCard className="p-4 h-100" elevation="convex">
            <h5 className="fw-bold mb-3">Invite Friends & Earn ULU Coins</h5>
            <p className="text-secondary small mb-4">
              Share your referral link with friends. They receive <strong>500 ULU Coins</strong> upon signup, and you receive <strong>25 ULU Coins</strong> once they register successfully!
            </p>

            {/* My Referral Code */}
            <div className="mb-4">
              <label className="form-label fw-bold text-secondary small uppercase">My Referral Code</label>
              <div className="d-flex gap-2">
                <div className="flex-grow-1 p-3 bg-light rounded-4 font-monospace fw-bold text-center border-0 neo-inset">
                  {inviteCode}
                </div>
                <button 
                  onClick={handleCopyCode} 
                  className="neo-btn px-4"
                  title="Copy Referral Code"
                >
                  {copiedCode ? <i className="bi bi-check-lg text-success"></i> : <i className="bi bi-clipboard"></i>}
                </button>
              </div>
            </div>

            {/* Share Link */}
            <div className="mb-4">
              <label className="form-label fw-bold text-secondary small uppercase">Invite Link</label>
              <div className="d-flex gap-2">
                <input 
                  type="text" 
                  className="form-control neo-input flex-grow-1" 
                  value={inviteLink} 
                  readOnly 
                />
                <button 
                  onClick={handleCopyLink} 
                  className="neo-btn px-4"
                  title="Copy Invite Link"
                >
                  {copiedLink ? <i className="bi bi-check-lg text-success"></i> : <i className="bi bi-link-45deg"></i>}
                </button>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div>
              <label className="form-label fw-bold text-secondary small uppercase d-block mb-2">Share on Socials</label>
              <div className="d-flex gap-2 flex-wrap">
                <a 
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Join me on ULINKUP and get 500 ULU Coins! 🚀\n${inviteLink}`)}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="neo-btn p-2 d-flex align-items-center justify-content-center text-success text-decoration-none"
                  style={{ width: '45px', height: '45px', borderRadius: '12px' }}
                >
                  <i className="bi bi-whatsapp fs-5"></i>
                </a>
                <a 
                  href={`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent("Join me on ULINKUP and get 500 ULU Coins! 🚀")}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="neo-btn p-2 d-flex align-items-center justify-content-center text-info text-decoration-none"
                  style={{ width: '45px', height: '45px', borderRadius: '12px' }}
                >
                  <i className="bi bi-telegram fs-5"></i>
                </a>
                <a 
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteLink)}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="neo-btn p-2 d-flex align-items-center justify-content-center text-primary text-decoration-none"
                  style={{ width: '45px', height: '45px', borderRadius: '12px' }}
                >
                  <i className="bi bi-facebook fs-5"></i>
                </a>
                <button 
                  onClick={handleShareInstagram}
                  className="neo-btn p-2 d-flex align-items-center justify-content-center text-danger"
                  style={{ width: '45px', height: '45px', borderRadius: '12px' }}
                >
                  <i className="bi bi-instagram fs-5"></i>
                </button>
              </div>
            </div>
            
            {/* Manual Referral Entry */}
            <hr className="my-4 opacity-25" />
            <div>
              <label className="form-label fw-bold text-secondary small uppercase d-block mb-2">Have a Referral Code?</label>
              {user?.has_used_referral ? (
                <div className="p-3 bg-success bg-opacity-10 text-success rounded-4 d-flex align-items-center gap-2 small fw-bold neo-inset border-0">
                  <i className="bi bi-check-circle-fill fs-5"></i> You have already applied a referral code.
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex gap-2">
                    <input 
                      type="text" 
                      className="form-control neo-input flex-grow-1" 
                      placeholder="Enter code here"
                      id="manual-referral-input"
                    />
                    <button 
                      className="neo-btn-accent px-4"
                      onClick={async () => {
                        const code = document.getElementById('manual-referral-input').value.trim();
                        if (!code) return alert("Please enter a referral code.");
                        try {
                          const res = await api.post('/api/auth/referral/apply/', { referral_code: code });
                          if (res.status === 200) {
                            alert("Referral code applied successfully! You received 500 ULU Coins.");
                            window.location.reload();
                          }
                        } catch (err) {
                          alert(err.response?.data?.error || "Failed to apply referral code.");
                        }
                      }}
                    >
                      Apply
                    </button>
                  </div>
                  <small className="text-muted">Get 500 ULU coins instantly when you enter a valid referral code.</small>
                </div>
              )}
            </div>
          </NeomorphicCard>
        </div>

        {/* Referral Stats Grid & Notifications */}
        <div className="col-lg-6">
          <div className="d-flex flex-column gap-4 h-100">
            {/* Stats Row */}
            <div className="row g-3">
              <div className="col-6">
                <NeomorphicCard className="p-3 text-center h-100" elevation="convex">
                  <h6 className="text-secondary small fw-bold mb-1 uppercase">Total Invites</h6>
                  <h3 className="fw-black text-primary font-monospace mb-0">{stats.total_invites}</h3>
                </NeomorphicCard>
              </div>
              <div className="col-6">
                <NeomorphicCard className="p-3 text-center h-100" elevation="convex">
                  <h6 className="text-secondary small fw-bold mb-1 uppercase">Successful</h6>
                  <h3 className="fw-black text-success font-monospace mb-0">{stats.successful_invites}</h3>
                </NeomorphicCard>
              </div>
              <div className="col-6">
                <NeomorphicCard className="p-3 text-center h-100" elevation="convex">
                  <h6 className="text-secondary small fw-bold mb-1 uppercase">Coins Earned</h6>
                  <h3 className="fw-black text-warning font-monospace mb-0">{stats.coins_earned}</h3>
                </NeomorphicCard>
              </div>
              <div className="col-6">
                <NeomorphicCard className="p-3 text-center h-100" elevation="convex">
                  <h6 className="text-secondary small fw-bold mb-1 uppercase">Pending</h6>
                  <h3 className="fw-black text-muted font-monospace mb-0">{stats.pending_invites}</h3>
                </NeomorphicCard>
              </div>
            </div>

            {/* Notifications Feed */}
            <NeomorphicCard className="p-4 flex-grow-1 d-flex flex-column" elevation="convex" style={{ maxHeight: '250px', overflowY: 'auto' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0">Activity Notifications</h5>
                {notifications.some(n => !n.is_read) && (
                  <button onClick={handleMarkAllRead} className="btn btn-link btn-sm text-primary p-0 fw-semibold text-decoration-none">
                    Mark all read
                  </button>
                )}
              </div>

              {loading ? (
                <div className="text-center py-4 my-auto">
                  <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                </div>
              ) : notifications.length > 0 ? (
                <div className="d-flex flex-column gap-2 overflow-auto pr-1">
                  {notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      className={`p-3 rounded-4 border-0 small ${notif.is_read ? 'bg-light text-secondary opacity-75' : 'bg-primary bg-opacity-10 text-dark fw-semibold'} neo-inset`}
                    >
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <span style={{ whiteSpace: 'pre-line' }}>{notif.message}</span>
                        {!notif.is_read && (
                          <span className="badge bg-primary rounded-circle p-1" style={{ width: '8px', height: '8px' }}>
                            <span className="visually-hidden">New</span>
                          </span>
                        )}
                      </div>
                      <div className="text-muted mt-2" style={{ fontSize: '0.75rem' }}>
                        {new Date(notif.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted my-auto py-4">
                  No activity logs or notifications yet.
                </div>
              )}
            </NeomorphicCard>
          </div>
        </div>
      </div>
    </div>
  );
}
