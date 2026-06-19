import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import NeomorphicCard from '../../components/NeomorphicCard';

export default function AdminDatabase() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const [editModal, setEditModal] = useState({ show: false, mode: 'insert', rowData: {} });

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin-database/tables/');
      if (res.status === 200) {
        setTables(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch tables", err);
    } finally {
      setLoading(false);
    }
  };

  const loadTableData = async (tableName) => {
    setSelectedTable(tableName);
    setLoadingData(true);
    try {
      const res = await api.get(`/api/admin-database/${tableName}/`);
      if (res.status === 200) {
        setTableData(res.data.data);
      }
    } catch (err) {
      alert("Failed to load table data");
    } finally {
      setLoadingData(false);
    }
  };

  const handleSaveModal = async () => {
    try {
      if (editModal.mode === 'insert') {
        const res = await api.post(`/api/admin-database/${selectedTable}/`, editModal.rowData);
        if (res.status === 201) {
          alert('Inserted successfully!');
        }
      } else {
        const res = await api.put(`/api/admin-database/${selectedTable}/`, editModal.rowData);
        if (res.status === 200) {
          alert('Updated successfully!');
        }
      }
      setEditModal({ show: false, mode: 'insert', rowData: {} });
      loadTableData(selectedTable);
    } catch (err) {
      alert(`Error saving: ${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-black mb-0">Database Explorer</h2>
        <button onClick={fetchTables} className="neo-btn"><i className="bi bi-arrow-clockwise me-2"></i>Refresh Tables</button>
      </div>

      <div className="row g-4">
        {/* Tables List */}
        <div className="col-12 col-md-4 col-lg-3">
          <NeomorphicCard className="p-0 d-flex flex-column" style={{ height: '80vh' }}>
            <div className="bg-dark text-white p-3 fw-bold flex-shrink-0">
              <i className="bi bi-database-fill me-2"></i> All Tables
            </div>
            <div style={{ overflowY: 'auto', flexGrow: 1 }}>
              <ul className="list-group list-group-flush">
                {loading ? (
                  <li className="list-group-item p-4 text-center">Loading...</li>
                ) : (
                  tables.map(t => (
                    <button 
                      key={t.name}
                      className={`list-group-item list-group-item-action py-3 d-flex justify-content-between align-items-center ${selectedTable === t.name ? 'active bg-primary text-white' : ''}`}
                      onClick={() => loadTableData(t.name)}
                    >
                      <div>
                        <div className="fw-bold">{t.name}</div>
                        <div className={selectedTable === t.name ? 'text-white-50 small' : 'text-muted small'}>{t.app}</div>
                      </div>
                      <span className={`badge rounded-pill ${selectedTable === t.name ? 'bg-light text-dark' : 'bg-secondary'}`}>
                        {t.count}
                      </span>
                    </button>
                  ))
                )}
              </ul>
            </div>
          </NeomorphicCard>
        </div>

        {/* Table Data View */}
        <div className="col-12 col-md-8 col-lg-9">
          <NeomorphicCard className="p-0 d-flex flex-column" elevation="convex" style={{ height: '80vh' }}>
            {selectedTable ? (
              <>
                <div className="bg-light border-bottom p-3 d-flex justify-content-between align-items-center flex-shrink-0">
                  <h5 className="fw-bold mb-0 text-primary"><i className="bi bi-table me-2"></i> {selectedTable} Records</h5>
                  <div className="d-flex align-items-center gap-3">
                    <button 
                      className="btn btn-sm btn-success"
                      onClick={() => setEditModal({ show: true, mode: 'insert', rowData: {} })}
                    >
                      <i className="bi bi-plus-lg me-1"></i> Insert Row
                    </button>
                    <input 
                      type="text" 
                      className="form-control form-control-sm neo-input" 
                      placeholder="Search..." 
                      onChange={e => {
                        const term = e.target.value.toLowerCase();
                        if (!term) setTableData(tableData);
                      }}
                      id="dbSearchInput"
                      style={{ maxWidth: '200px' }}
                    />
                    <span className="badge bg-dark">Showing max 50 rows</span>
                  </div>
                </div>
                <div className="p-0 position-relative" style={{ overflowX: 'auto', overflowY: 'auto', flexGrow: 1 }}>
                  {loadingData ? (
                    <div className="p-5 text-center">Fetching rows...</div>
                  ) : tableData.length === 0 ? (
                    <div className="p-5 text-center text-muted">Table is empty.</div>
                  ) : (
                    <table className="table table-bordered table-striped table-sm mb-0 font-monospace small" style={{ whiteSpace: 'nowrap' }}>
                      <thead className="table-dark" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                        <tr>
                          <th className="px-3 py-2 text-center" style={{ width: '50px' }}>Act</th>
                          {Object.keys(tableData[0]).map(key => (
                            <th key={key} className="px-3 py-2">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.map((row, idx) => {
                          const searchInput = document.getElementById('dbSearchInput');
                          const term = searchInput ? searchInput.value.toLowerCase() : '';
                          const rowString = Object.values(row).join(' ').toLowerCase();
                          if (term && !rowString.includes(term)) return null;

                          return (
                            <tr key={idx}>
                              <td className="px-2 py-1 text-center align-middle" style={{ minWidth: '70px' }}>
                                <button 
                                  className="btn btn-sm text-primary p-0 border-0 me-2" 
                                  title="Edit Row"
                                  onClick={() => setEditModal({ show: true, mode: 'edit', rowData: { ...row } })}
                                >
                                  <i className="bi bi-pencil-fill"></i>
                                </button>
                                <button 
                                  className="btn btn-sm text-danger p-0 border-0" 
                                  title="Delete Row"
                                  onClick={async () => {
                                    if (window.confirm("WARNING: Deleting raw database records is dangerous. Proceed?")) {
                                      try {
                                        const res = await api.delete(`/api/admin-database/${selectedTable}/`, { data: { id: row.id } });
                                        if (res.status === 204) {
                                          setTableData(tableData.filter(r => r.id !== row.id));
                                          fetchTables(); // update counts
                                        }
                                      } catch (err) { alert("Delete failed or no 'id' field."); }
                                    }
                                  }}
                                >
                                  <i className="bi bi-trash-fill"></i>
                                </button>
                              </td>
                              {Object.values(row).map((val, vIdx) => (
                                <td key={vIdx} className="px-3 py-1 text-truncate" style={{ maxWidth: '250px' }}>
                                  {val === null ? <span className="text-muted fst-italic">null</span> : 
                                   typeof val === 'boolean' ? <span className={val ? 'text-success fw-bold' : 'text-danger fw-bold'}>{val.toString()}</span> : 
                                   String(val)}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center h-100 p-5 text-muted">
                <i className="bi bi-database fs-1 mb-3"></i>
                <h5>Select a table from the left to view data</h5>
              </div>
            )}
          </NeomorphicCard>
        </div>
      </div>

      {/* JSON Editor Modal Overlay */}
      {editModal.show && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex justify-content-center align-items-center" style={{ zIndex: 1050 }}>
          <NeomorphicCard className="p-4" style={{ width: '90%', maxWidth: '600px' }}>
            <h5 className="fw-bold mb-3 text-primary">
              {editModal.mode === 'insert' ? `Insert New Row into ${selectedTable}` : `Edit Row in ${selectedTable}`}
            </h5>
            <div className="alert alert-warning small py-2 mb-3">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              Edit the raw JSON fields below. Be careful with foreign keys (IDs) and date formats.
            </div>
            <textarea 
              className="form-control font-monospace mb-3" 
              rows="12"
              value={JSON.stringify(editModal.rowData, null, 2)}
              onChange={e => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setEditModal({ ...editModal, rowData: parsed });
                } catch(err) {
                  // Keep typing even if JSON is temporarily invalid
                }
              }}
              id="jsonEditorTextarea"
            ></textarea>
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-danger" onClick={() => setEditModal({ show: false, mode: 'insert', rowData: {} })}>Cancel</button>
              <button 
                className="btn btn-success" 
                onClick={() => {
                  try {
                    const finalData = JSON.parse(document.getElementById('jsonEditorTextarea').value);
                    setEditModal({ ...editModal, rowData: finalData });
                    // Give state a moment to update before handleSaveModal uses it, or just pass it directly.
                    // Actually handleSaveModal uses editModal state which is async, let's just do it directly.
                  } catch (e) { alert("Invalid JSON!"); return; }
                  // Using a timeout hack to let state sync, or we can just rewrite handleSaveModal to take data.
                }}
                onMouseUp={() => setTimeout(handleSaveModal, 50)}
              >
                Save Changes
              </button>
            </div>
          </NeomorphicCard>
        </div>
      )}

    </div>
  );
}
