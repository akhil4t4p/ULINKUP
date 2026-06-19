import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import NeomorphicCard from '../../components/NeomorphicCard';

export default function AdminPayments() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/api/admin-payments/');
      if (res.status === 200) {
        setTransactions(res.data.results || res.data);
      }
    } catch (err) {
      console.error("Failed to fetch payments", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'SUCCESS': return 'bg-success';
      case 'PENDING': return 'bg-warning text-dark';
      case 'FAILED': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const getTypeBadge = (type) => {
    if (type.includes('SUBSCRIPTION')) return 'bg-primary';
    return 'bg-info text-dark';
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-black mb-0">Payments Overview</h2>
        <button onClick={fetchTransactions} className="neo-btn" title="Refresh"><i className="bi bi-arrow-clockwise"></i></button>
      </div>

      <NeomorphicCard className="p-0 overflow-hidden" elevation="convex">
        <div className="table-responsive">
          <table className="table table-hover table-borderless mb-0 align-middle">
            <thead className="bg-light text-muted small text-uppercase">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3">User</th>
                <th className="py-3">Amount</th>
                <th className="py-3">Type</th>
                <th className="py-3">Status</th>
                <th className="py-3 text-end px-4">Order ID</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-5">Loading transactions...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-5 text-muted">No transactions found.</td></tr>
              ) : (
                transactions.map(t => (
                  <tr key={t.id} className="border-bottom border-light">
                    <td className="py-3 px-4 small text-muted font-monospace">
                      {new Date(t.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 small">
                      <div className="fw-bold text-dark">{t.username}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{t.user_email}</div>
                    </td>
                    <td className="py-3 fw-bold text-dark">
                      ₹{parseFloat(t.amount).toFixed(2)}
                    </td>
                    <td className="py-3">
                      <span className={`badge ${getTypeBadge(t.transaction_type)}`}>
                        {t.transaction_type}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`badge ${getStatusBadge(t.status)}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 text-end px-4 small font-monospace text-secondary text-truncate" style={{ maxWidth: '150px' }}>
                      {t.razorpay_order_id || `MOCK-${t.id}`}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </NeomorphicCard>
    </div>
  );
}
