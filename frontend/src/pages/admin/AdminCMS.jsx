import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import NeomorphicCard from '../../components/NeomorphicCard';

export default function AdminCMS() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    fetchBlocks();
  }, []);

  const fetchBlocks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin-cms/');
      if (res.status === 200) {
        setBlocks(res.data.results || res.data);
      }
    } catch (err) {
      console.error("Failed to fetch CMS blocks", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (id) => {
    try {
      const res = await api.patch(`/api/admin-cms/${id}/`, { content: editContent });
      if (res.status === 200) {
        setBlocks(blocks.map(b => b.id === id ? { ...b, content: res.data.content } : b));
        setEditingId(null);
      }
    } catch (err) {
      alert("Failed to save content");
    }
  };

  const handleCreateNew = async (e) => {
    e.preventDefault();
    const section = prompt("Enter Section Name (e.g. LandingPage):");
    if (!section) return;
    const key = prompt("Enter Block Key (e.g. HERO_TITLE):");
    if (!key) return;

    try {
      const res = await api.post('/api/admin-cms/', { section, key: key.toUpperCase(), content: 'Sample text' });
      if (res.status === 201) {
        setBlocks([...blocks, res.data]);
      }
    } catch (err) {
      alert("Failed to create block. Key must be unique.");
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-black mb-0">Content Management System (CMS)</h2>
        <button onClick={handleCreateNew} className="neo-btn-accent"><i className="bi bi-plus-lg me-2"></i>New Text Block</button>
      </div>

      <div className="row g-4">
        {loading ? (
          <div className="col-12 text-center py-5">Loading text blocks...</div>
        ) : blocks.length === 0 ? (
          <div className="col-12 text-center py-5 text-muted">No content blocks found.</div>
        ) : (
          blocks.map(block => (
            <div className="col-12" key={block.id}>
              <NeomorphicCard className="p-4" elevation="convex">
                <div className="d-flex justify-content-between mb-3 align-items-center">
                  <div>
                    <span className="badge bg-primary me-2">{block.section}</span>
                    <span className="fw-bold text-dark font-monospace">{block.key}</span>
                  </div>
                  {editingId !== block.id && (
                    <button 
                      onClick={() => { setEditingId(block.id); setEditContent(block.content); }}
                      className="btn btn-sm btn-outline-primary"
                    >
                      <i className="bi bi-pencil-fill me-1"></i> Edit Text
                    </button>
                  )}
                </div>
                
                {editingId === block.id ? (
                  <div className="d-flex flex-column gap-2 mt-3">
                    <textarea 
                      className="form-control neo-input" 
                      rows="4"
                      value={editContent} 
                      onChange={e => setEditContent(e.target.value)}
                    ></textarea>
                    <div className="d-flex gap-2 justify-content-end">
                      <button onClick={() => setEditingId(null)} className="btn btn-danger">Cancel</button>
                      <button onClick={() => handleSave(block.id)} className="btn btn-success">Save Content</button>
                    </div>
                  </div>
                ) : (
                  <div className="neo-inset p-3 rounded bg-light" style={{ whiteSpace: 'pre-wrap' }}>
                    {block.content}
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
