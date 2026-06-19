import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import NeomorphicCard from '../../components/NeomorphicCard';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin-users/');
      if (res.status === 200) {
        setUsers(res.data.results || res.data);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId) => {
    if (!window.confirm("Are you sure you want to toggle the active status of this user?")) return;
    try {
      const res = await api.post(`/api/admin-users/${userId}/toggle_active/`);
      if (res.status === 200) {
        setUsers(users.map(u => u.id === userId ? { ...u, is_active: res.data.is_active } : u));
      }
    } catch (err) {
      alert("Failed to toggle status");
    }
  };

  const filteredUsers = users.filter(u => 
    (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <h2 className="fw-black mb-0">User Management</h2>
        <div className="d-flex gap-2">
          <input 
            type="text" 
            className="form-control neo-input" 
            placeholder="Search email or username..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ minWidth: '250px' }}
          />
          <button onClick={fetchUsers} className="neo-btn" title="Refresh"><i className="bi bi-arrow-clockwise"></i></button>
        </div>
      </div>

      <NeomorphicCard className="p-0 overflow-hidden" elevation="convex">
        <div className="table-responsive">
          <table className="table table-hover table-borderless mb-0 align-middle">
            <thead className="bg-light text-muted small text-uppercase">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3">Role / Plan</th>
                <th className="py-3">Wallet</th>
                <th className="py-3">Joined</th>
                <th className="py-3">Status</th>
                <th className="py-3 px-4 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-5">Loading users...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-5 text-muted">No users found.</td></tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="border-bottom border-light">
                    <td className="py-3 px-4">
                      <div className="fw-bold text-dark">{user.username}</div>
                      <div className="small text-muted">{user.email}</div>
                    </td>
                    <td className="py-3">
                      <span className={`badge ${user.role === 'ADMIN' ? 'bg-danger' : user.role === 'BUSINESS' ? 'bg-primary' : 'bg-secondary'}`}>
                        {user.role}
                      </span>
                      {user.role === 'BUSINESS' && (
                        <span className={`badge ms-2 ${user.plan_tier === 'GOLD' ? 'bg-warning text-dark' : 'bg-light text-dark border'}`}>
                          {user.plan_tier}
                        </span>
                      )}
                    </td>
                    <td className="py-3 fw-bold font-monospace text-warning">
                      <i className="bi bi-coin me-1"></i>{user.wallet_balance}
                    </td>
                    <td className="py-3 small text-muted">
                      {new Date(user.date_joined).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      {user.is_active ? (
                        <span className="badge bg-success-subtle text-success border border-success-subtle"><i className="bi bi-check-circle-fill me-1"></i>Active</span>
                      ) : (
                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle"><i className="bi bi-x-circle-fill me-1"></i>Suspended</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-end">
                      <button 
                        onClick={() => handleToggleActive(user.id)}
                        className={`btn btn-sm ${user.is_active ? 'btn-outline-danger' : 'btn-outline-success'} fw-bold`}
                      >
                        {user.is_active ? 'Suspend' : 'Activate'}
                      </button>
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
