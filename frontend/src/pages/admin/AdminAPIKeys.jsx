import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import NeomorphicCard from '../../components/NeomorphicCard';

export default function AdminAPIKeys() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ service_name: '', name: '', key_value: '', is_secret: true });

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin-apikeys/');
      if (res.status === 200) {
        setKeys(res.data.results || res.data);
      }
    } catch (err) {
      console.error("Failed to fetch keys", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this API Key?")) return;
    try {
      const res = await api.delete(`/api/admin-apikeys/${id}/`);
      if (res.status === 204) {
        setKeys(keys.filter(k => k.id !== id));
      }
    } catch (err) {
      alert("Failed to delete key");
    }
  };

  const handleCreateNew = async (e) => {
    e.preventDefault();
    const svc = prompt("Enter Service Name (e.g. Razorpay):");
    if (!svc) return;
    const name = prompt("Enter Key Name (e.g. RAZORPAY_KEY_ID):");
    if (!name) return;
    const val = prompt("Enter Key Value:");
    if (!val) return;
    const isSecret = window.confirm("Is this a secret key? (Click OK for Yes, Cancel for No)");

    try {
      const res = await api.post('/api/admin-apikeys/', { 
        service_name: svc, 
        name: name.toUpperCase(), 
        key_value: val,
        is_secret: isSecret
      });
      if (res.status === 201) {
        setKeys([...keys, res.data]);
      }
    } catch (err) {
      alert("Failed to create key. Ensure the Key Name is unique.");
    }
  };

  const startEditing = (k) => {
    setEditingId(k.id);
    setEditData({ service_name: k.service_name, name: k.name, key_value: k.key_value, is_secret: k.is_secret });
  };

  const handleEditSave = async (id) => {
    try {
      const res = await api.patch(`/api/admin-apikeys/${id}/`, editData);
      if (res.status === 200) {
        setKeys(keys.map(k => k.id === id ? res.data : k));
        setEditingId(null);
      }
    } catch (err) {
      alert("Failed to update API Key");
    }
  };

  const maskKey = (key) => {
    if (!key || key.length < 8) return '********';
    return `${key.substring(0, 4)}••••••••••••${key.substring(key.length - 4)}`;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-black mb-0">API Key Manager</h2>
        <button onClick={handleCreateNew} className="neo-btn-accent"><i className="bi bi-shield-lock me-2"></i>Add API Key</button>
      </div>

      <NeomorphicCard className="p-0 overflow-hidden" elevation="convex">
        <div className="table-responsive">
          <table className="table table-hover table-borderless mb-0 align-middle">
            <thead className="bg-light text-muted small text-uppercase">
              <tr>
                <th className="py-3 px-4">Service</th>
                <th className="py-3">Key Name</th>
                <th className="py-3 w-50">Value</th>
                <th className="py-3 text-center">Status</th>
                <th className="py-3 text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-5">Loading keys...</td></tr>
              ) : keys.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted">
                    <i className="bi bi-key fs-1 d-block mb-3"></i>
                    No API keys configured.
                  </td>
                </tr>
              ) : (
                keys.map(k => (
                  <tr key={k.id} className="border-bottom border-light">
                    {editingId === k.id ? (
                      <>
                        <td className="py-3 px-4">
                          <input type="text" className="form-control form-control-sm neo-input" value={editData.service_name} onChange={e => setEditData({...editData, service_name: e.target.value})} />
                        </td>
                        <td className="py-3 font-monospace small">
                          <input type="text" className="form-control form-control-sm neo-input" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
                        </td>
                        <td className="py-3 font-monospace small">
                          <input type="text" className="form-control form-control-sm neo-input" value={editData.key_value} onChange={e => setEditData({...editData, key_value: e.target.value})} />
                        </td>
                        <td className="py-3 text-center">
                          <div className="form-check form-switch d-flex justify-content-center">
                            <input className="form-check-input" type="checkbox" checked={editData.is_secret} onChange={e => setEditData({...editData, is_secret: e.target.checked})} />
                            <label className="form-check-label ms-2 small">Secret</label>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-end">
                          <button onClick={() => handleEditSave(k.id)} className="btn btn-sm btn-success me-2" title="Save"><i className="bi bi-check-lg"></i></button>
                          <button onClick={() => setEditingId(null)} className="btn btn-sm btn-danger" title="Cancel"><i className="bi bi-x-lg"></i></button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 px-4 fw-bold text-dark">{k.service_name}</td>
                        <td className="py-3 font-monospace small">{k.name}</td>
                        <td className="py-3 font-monospace small">
                          <div className="neo-inset p-2 rounded bg-light text-muted" style={{ wordBreak: 'break-all' }}>
                            {k.is_secret ? maskKey(k.key_value) : k.key_value}
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <span className="badge bg-success-subtle text-success border border-success-subtle">
                            <i className="bi bi-check-circle-fill me-1"></i>Active
                          </span>
                        </td>
                        <td className="py-3 px-4 text-end">
                          <button 
                            onClick={() => startEditing(k)}
                            className="btn btn-sm btn-outline-primary me-2"
                            title="Edit Key"
                          >
                            <i className="bi bi-pencil-fill"></i>
                          </button>
                          <button 
                            onClick={() => handleDelete(k.id)}
                            className="btn btn-sm btn-outline-danger"
                            title="Delete Key"
                          >
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        </td>
                      </>
                    )}
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
