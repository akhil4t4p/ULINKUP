import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import NeomorphicCard from '../../components/NeomorphicCard';

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [filterAction]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url = filterAction ? `/api/admin-logs/?action=${filterAction}` : '/api/admin-logs/';
      const res = await api.get(url);
      if (res.status === 200) {
        setLogs(res.data.results || res.data);
      }
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  const actionTypes = ['LOGIN', 'PAYMENT', 'UPGRADE', 'ADMIN', 'ERROR'];

  const getActionBadgeClass = (actionType) => {
    switch (actionType) {
      case 'LOGIN': return 'bg-info text-dark';
      case 'PAYMENT': return 'bg-success';
      case 'UPGRADE': return 'bg-warning text-dark';
      case 'ADMIN': return 'bg-primary';
      case 'ERROR': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <h2 className="fw-black mb-0">System Logs</h2>
        <div className="d-flex gap-2">
          <select 
            className="form-select neo-input" 
            value={filterAction} 
            onChange={e => setFilterAction(e.target.value)}
            style={{ minWidth: '200px' }}
          >
            <option value="">All Actions</option>
            {actionTypes.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button onClick={fetchLogs} className="neo-btn" title="Refresh"><i className="bi bi-arrow-clockwise"></i></button>
        </div>
      </div>

      <NeomorphicCard className="p-0 overflow-hidden" elevation="convex">
        <div className="table-responsive">
          <table className="table table-hover table-borderless mb-0 align-middle">
            <thead className="bg-light text-muted small text-uppercase">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3">Action</th>
                <th className="py-3">User</th>
                <th className="py-3 w-50">Description</th>
                <th className="py-3 text-end px-4">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-5">Loading logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-5 text-muted">No logs found.</td></tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="border-bottom border-light">
                    <td className="py-3 px-4 small text-muted font-monospace">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3">
                      <span className={`badge ${getActionBadgeClass(log.action_type)}`}>
                        {log.action_type}
                      </span>
                    </td>
                    <td className="py-3 small fw-bold text-dark">
                      {log.user_email || 'System'}
                    </td>
                    <td className="py-3 text-secondary" style={{ wordBreak: 'break-word' }}>
                      {log.description}
                    </td>
                    <td className="py-3 px-4 text-end small font-monospace text-muted">
                      {log.ip_address || 'N/A'}
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
