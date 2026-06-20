import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import NeomorphicCard from '../../components/NeomorphicCard';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/api/admin-stats/');
        if (res.status === 200) {
          setStats(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch admin stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;
  if (!stats) return <div className="text-danger">Failed to load statistics.</div>;

  const cards = [
    { title: 'Total Users', value: stats.totalUsers, icon: 'bi-people-fill', color: 'text-primary' },
    { title: 'Business Users', value: stats.businessUsers, icon: 'bi-building-fill', color: 'text-info' },
    { title: 'Total Revenue', value: `₹${stats.totalRevenue}`, icon: 'bi-cash-stack', color: 'text-success' },
    { title: "Today's Revenue", value: `₹${stats.todayRevenue}`, icon: 'bi-graph-up-arrow', color: 'text-success' },
    { title: 'Active Users', value: stats.activeUsers, icon: 'bi-activity', color: 'text-warning' },
    { title: 'Pending Payments', value: stats.pendingPayments, icon: 'bi-clock-history', color: 'text-danger' },
    { title: 'Total Referrals', value: stats.totalReferrals || 0, icon: 'bi-gift-fill', color: 'text-primary' },
    { title: 'Coins Distributed', value: `${stats.totalCoinsDistributed || 0} ULU`, icon: 'bi-coin', color: 'text-warning' },
  ];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-black mb-0">Super Admin Dashboard</h2>
        <button className="neo-btn" onClick={() => window.location.reload()}><i className="bi bi-arrow-clockwise me-2"></i> Refresh</button>
      </div>

      <div className="row g-4 mb-5">
        {cards.map((card, idx) => (
          <div className="col-12 col-sm-6 col-lg-3" key={idx}>
            <NeomorphicCard className="p-4 h-100 d-flex flex-column justify-content-center text-center" elevation="convex">
              <i className={`bi ${card.icon} fs-1 mb-2 ${card.color}`}></i>
              <h3 className="fw-black mb-1">{card.value}</h3>
              <p className="text-muted small mb-0 text-uppercase fw-bold">{card.title}</p>
            </NeomorphicCard>
          </div>
        ))}
      </div>

      {stats.charts && (
        <div className="row g-4">
          {/* Revenue Chart */}
          <div className="col-12 col-lg-6">
            <NeomorphicCard className="p-4 h-100">
              <h5 className="fw-bold mb-4"><i className="bi bi-graph-up text-success me-2"></i> Revenue (Last 7 Days)</h5>
              <div className="d-flex align-items-end justify-content-between h-100" style={{ minHeight: '200px' }}>
                {stats.charts.labels.map((label, i) => {
                  const maxRev = Math.max(...stats.charts.revenue, 1);
                  const height = (stats.charts.revenue[i] / maxRev) * 100;
                  return (
                    <div key={i} className="d-flex flex-column align-items-center flex-fill px-1">
                      <div className="text-muted small mb-1">₹{stats.charts.revenue[i]}</div>
                      <div className="bg-success rounded-top" style={{ width: '100%', maxWidth: '40px', height: `${height}%`, minHeight: '5px', opacity: 0.8 }}></div>
                      <div className="small text-secondary mt-2 fw-bold" style={{ fontSize: '0.7rem' }}>{label}</div>
                    </div>
                  );
                })}
              </div>
            </NeomorphicCard>
          </div>

          {/* Users Chart */}
          <div className="col-12 col-lg-6">
            <NeomorphicCard className="p-4 h-100">
              <h5 className="fw-bold mb-4"><i className="bi bi-people text-primary me-2"></i> New Users (Last 7 Days)</h5>
              <div className="d-flex align-items-end justify-content-between h-100" style={{ minHeight: '200px' }}>
                {stats.charts.labels.map((label, i) => {
                  const maxUsers = Math.max(...stats.charts.users, 1);
                  const height = (stats.charts.users[i] / maxUsers) * 100;
                  return (
                    <div key={i} className="d-flex flex-column align-items-center flex-fill px-1">
                      <div className="text-muted small mb-1">{stats.charts.users[i]}</div>
                      <div className="bg-primary rounded-top" style={{ width: '100%', maxWidth: '40px', height: `${height}%`, minHeight: '5px', opacity: 0.8 }}></div>
                      <div className="small text-secondary mt-2 fw-bold" style={{ fontSize: '0.7rem' }}>{label}</div>
                    </div>
                  );
                })}
              </div>
            </NeomorphicCard>
          </div>
        </div>
      )}

      {stats.topInviters && stats.topInviters.length > 0 && (
        <div className="row g-4 mt-4">
          <div className="col-12">
            <NeomorphicCard className="p-4">
              <h5 className="fw-bold mb-4"><i className="bi bi-trophy-fill text-warning me-2"></i> Top Referrers / Inviters Leaderboard</h5>
              <div className="table-responsive">
                <table className="table table-hover align-middle border-0">
                  <thead>
                    <tr className="text-secondary small uppercase border-bottom">
                      <th>Username</th>
                      <th>Email</th>
                      <th className="text-center">Successful Referrals</th>
                      <th className="text-center">Total Coins Awarded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topInviters.map((inviter, idx) => (
                      <tr key={idx} className="border-bottom">
                        <td className="fw-bold text-dark">{inviter.inviter__username || 'Anonymous'}</td>
                        <td>{inviter.inviter__email}</td>
                        <td className="text-center fw-bold">{inviter.total_referrals}</td>
                        <td className="text-center text-warning fw-bold">{inviter.total_referrals * 25} ULU</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </NeomorphicCard>
          </div>
        </div>
      )}
    </div>
  );
}
