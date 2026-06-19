import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import NeomorphicCard from '../../components/NeomorphicCard';

export default function AdminSettings() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin-settings/');
      if (res.status === 200) {
        setSettings(res.data.results || res.data);
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (id) => {
    try {
      const res = await api.patch(`/api/admin-settings/${id}/`, { value: editValue });
      if (res.status === 200) {
        setSettings(settings.map(s => s.id === id ? { ...s, value: res.data.value } : s));
        setEditingId(null);
      }
    } catch (err) {
      alert("Failed to save setting");
    }
  };

  const handleCreateNew = async (e) => {
    e.preventDefault();
    const key = prompt("Enter Setting Key (e.g. MAINTENANCE_MODE):");
    if (!key) return;
    const val = prompt(`Enter value for ${key}:`);
    if (!val) return;

    try {
      const res = await api.post('/api/admin-settings/', { key: key.toUpperCase(), value: val, description: 'Added via Admin UI' });
      if (res.status === 201) {
        setSettings([...settings, res.data]);
      }
    } catch (err) {
      alert("Failed to create setting. Key must be unique.");
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-black mb-0">Global Site Settings</h2>
        <button onClick={handleCreateNew} className="neo-btn-accent"><i className="bi bi-plus-lg me-2"></i>New Setting</button>
      </div>

      <div className="row g-4">
        {loading ? (
          <div className="col-12 text-center py-5">Loading settings...</div>
        ) : settings.length === 0 ? (
          <div className="col-12 text-center py-5 text-muted">No settings found.</div>
        ) : (
          settings.map(setting => (
            <div className="col-12 col-md-6" key={setting.id}>
              <NeomorphicCard className="p-4 h-100" elevation="convex">
                <div className="d-flex justify-content-between mb-3">
                  <h5 className="fw-bold text-dark font-monospace mb-0">{setting.key}</h5>
                  <span className="badge bg-secondary">System Variable</span>
                </div>
                
                <p className="text-muted small mb-3">{setting.description || 'No description provided.'}</p>
                
                {editingId === setting.id ? (
                  <div className="d-flex gap-2">
                    <input 
                      type="text" 
                      className="form-control neo-input" 
                      value={editValue} 
                      onChange={e => setEditValue(e.target.value)}
                    />
                    <button onClick={() => handleSave(setting.id)} className="btn btn-success"><i className="bi bi-check-lg"></i></button>
                    <button onClick={() => setEditingId(null)} className="btn btn-danger"><i className="bi bi-x-lg"></i></button>
                  </div>
                ) : (
                  <div className="neo-inset p-3 rounded bg-light d-flex justify-content-between align-items-center" style={{ wordBreak: 'break-all' }}>
                    <span className="fw-bold">{setting.value}</span>
                    <button 
                      onClick={() => { setEditingId(setting.id); setEditValue(setting.value); }}
                      className="btn btn-sm btn-outline-primary border-0"
                    >
                      <i className="bi bi-pencil-fill"></i>
                    </button>
                  </div>
                )}
              </NeomorphicCard>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
