import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import SeatMatrix from '../components/SeatMatrix';

const CAT_LABELS = {
  OPEN: 'OPEN', SC: 'SC', ST: 'ST', VJ_DT: 'VJ/DT',
  NTB: 'NT-B', NTC: 'NT-C', NTD: 'NT-D', OBC: 'OBC', SEBC: 'SEBC', EWS: 'EWS'
};

function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const { user } = useAuth();
  const { socket } = useSocket();

  // Shared state
  const [branches, setBranches] = useState([]);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [round, setRound] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Allocation state
  const [allocMode, setAllocMode] = useState('manual');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('OPEN');
  const [selectedType, setSelectedType] = useState('general');
  const [allocating, setAllocating] = useState(false);

  // Branch Upgrade state
  const [upgradeStudent, setUpgradeStudent] = useState('');
  const [upgradeFromBranch, setUpgradeFromBranch] = useState('');
  const [upgradeFromCat, setUpgradeFromCat] = useState('OPEN');
  const [upgradeFromType, setUpgradeFromType] = useState('general');
  const [upgradeToBranch, setUpgradeToBranch] = useState('');
  const [upgradeToCat, setUpgradeToCat] = useState('OPEN');
  const [upgradeToType, setUpgradeToType] = useState('general');
  const [upgrading, setUpgrading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('seat-update', (data) => {
      setBranches(prev => prev.map(b => b._id === data.branchId ? data.branch : b));
    });
    socket.on('round-update', (data) => {
      setRound(data.round);
    });
    return () => {
      socket.off('seat-update');
      socket.off('round-update');
    };
  }, [socket]);

  const fetchAll = async () => {
    try {
      const [branchRes, studentRes, statsRes, roundRes, alloRes] = await Promise.all([
        axios.get('/api/branches'),
        axios.get('/api/students'),
        axios.get('/api/students/stats'),
        axios.get('/api/round/current'),
        axios.get('/api/allocation/history')
      ]);
      setBranches(branchRes.data);
      setStudents(studentRes.data);
      setStats(statsRes.data);
      setRound(roundRes.data);
      setAllocations(alloRes.data);
    } catch (err) {
      console.error('Fetch error:', err);
    }
    setLoading(false);
  };

  const showMsg = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  // Branch update handler
  const handleBranchUpdate = useCallback(async (branchId, updatedData) => {
    try {
      await axios.put(`/api/branches/${branchId}`, updatedData);
      showMsg('Seats updated successfully!');
    } catch (err) {
      showMsg('Error updating seats: ' + (err.response?.data?.message || err.message));
    }
  }, []);

  // Manual allocation
  const handleManualAllocate = async () => {
    if (!selectedStudent || !selectedBranch) {
      showMsg('Please select both a student and a branch');
      return;
    }
    setAllocating(true);
    try {
      await axios.post('/api/allocation/manual', {
        studentId: selectedStudent,
        branchId: selectedBranch,
        seatCategory: selectedCategory,
        seatType: selectedType,
        seatPool: 'stateLevel'
      });
      showMsg('Student allocated successfully!');
      fetchAll();
      setSelectedStudent('');
      setSelectedBranch('');
    } catch (err) {
      showMsg('Allocation failed: ' + (err.response?.data?.message || err.message));
    }
    setAllocating(false);
  };

  // Auto allocation
  const handleAutoAllocate = async () => {
    if (!window.confirm('Run auto-allocation for all pending students? This will allocate based on merit and category rules.')) return;
    setAllocating(true);
    try {
      const res = await axios.post('/api/allocation/auto', {});
      showMsg(res.data.message);
      fetchAll();
    } catch (err) {
      showMsg('Auto allocation failed: ' + (err.response?.data?.message || err.message));
    }
    setAllocating(false);
  };

  // Cancel allocation
  const handleCancelAllocation = async (alloId) => {
    if (!window.confirm('Cancel this allocation? The seat will be returned to the pool.')) return;
    try {
      await axios.delete(`/api/allocation/${alloId}`);
      showMsg('Allocation cancelled, seat returned.');
      fetchAll();
    } catch (err) {
      showMsg('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  // Branch Upgrade
  const handleBranchUpgrade = async () => {
    if (!upgradeStudent || !upgradeFromBranch || !upgradeToBranch) {
      showMsg('Please fill in Student, From Branch, and To Branch');
      return;
    }
    if (upgradeFromBranch === upgradeToBranch) {
      showMsg('From Branch and To Branch must be different');
      return;
    }
    if (!window.confirm('Confirm Branch Upgrade?\n\n' +
      '• FROM branch seat → +1 (returned to pool, live)\n' +
      '• TO branch seat → -1 (new allocation, live)\n\n' +
      'This is visible to all students in real-time.')) return;
    setUpgrading(true);
    try {
      const res = await axios.post('/api/allocation/upgrade', {
        studentId: upgradeStudent,
        fromBranchId: upgradeFromBranch,
        fromSeatPool: 'stateLevel',
        fromSeatCategory: upgradeFromCat,
        fromSeatType: upgradeFromType,
        toBranchId: upgradeToBranch,
        toSeatPool: 'stateLevel',
        toSeatCategory: upgradeToCat,
        toSeatType: upgradeToType
      });
      showMsg('✅ ' + res.data.message);
      fetchAll();
      setUpgradeStudent('');
      setUpgradeFromBranch('');
      setUpgradeToBranch('');
    } catch (err) {
      showMsg('Upgrade failed: ' + (err.response?.data?.message || err.message));
    }
    setUpgrading(false);
  };

  // Round management
  const handleRoundAction = async (action) => {
    const confirmMsgs = {
      initialize: 'Initialize new round? This will reset ALL seats to 0 and cancel all allocations. You can then enter actual vacancy data.',
      start: 'Start the round? This will mark it as active.',
      pause: 'Pause the round?',
      end: 'End the round? This marks it as completed.'
    };
    if (!window.confirm(confirmMsgs[action])) return;

    try {
      const res = await axios.post(`/api/round/${action}`, {
        name: 'Spot Round 2025-26'
      });
      showMsg(res.data.message);
      fetchAll();
    } catch (err) {
      showMsg('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  // Filtered students
  const filteredStudents = students.filter(s => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!s.fullName.toLowerCase().includes(term) &&
          !s.applicationId.toLowerCase().includes(term) &&
          !s.email.toLowerCase().includes(term)) return false;
    }
    if (filterCategory && s.category !== filterCategory) return false;
    if (filterStatus && s.allocationStatus !== filterStatus) return false;
    return true;
  });

  const pendingStudents = students.filter(s => s.allocationStatus === 'pending');
  const totalVacant = branches.reduce((sum, b) => sum + (b.totalVacant || 0), 0);

  if (loading) {
    return <div className="loading"><div className="spinner"></div><p>Loading admin panel...</p></div>;
  }

  return (
    <main className="main-content">
      {message && (
        <div className={`alert ${message.includes('Error') || message.includes('failed') ? 'alert-error' : 'alert-success'}`}>
          {message}
        </div>
      )}

      {/* Admin Tabs */}
      <div className="admin-tabs">
        {[
          { key: 'overview', label: '📊 Overview' },
          { key: 'seats', label: '💺 Seat Management' },
          { key: 'students', label: '👨‍🎓 Students' },
          { key: 'allocate', label: '🎯 Allocation' },
          { key: 'round', label: '⚙️ Round Management' }
        ].map(t => (
          <button
            key={t.key}
            className={`admin-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {tab === 'overview' && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>👨‍🎓</div>
              <div className="stat-value">{stats?.total || 0}</div>
              <div className="stat-label">Total Students</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>⏳</div>
              <div className="stat-value">{stats?.pending || 0}</div>
              <div className="stat-label">Pending Allocation</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>✅</div>
              <div className="stat-value">{stats?.allocated || 0}</div>
              <div className="stat-label">Allocated</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'var(--info-light)', color: 'var(--info)' }}>💺</div>
              <div className="stat-value">{totalVacant}</div>
              <div className="stat-label">Vacant Seats</div>
            </div>
          </div>

          {/* Round Status */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header">
              <h2>Round Status</h2>
              <span className={`badge badge-${round?.status || 'demo'}`}>{(round?.status || 'demo').toUpperCase()}</span>
            </div>
            <div className="card-body">
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                <strong>{round?.name || 'Spot Round'}</strong> — {round?.description || 'Demo mode'}
              </p>
              {round?.isDemo && (
                <div className="alert alert-warning" style={{ marginTop: '12px' }}>
                  Demo mode active. Use "Round Management" tab to initialize an actual round.
                </div>
              )}
            </div>
          </div>

          {/* Recent Allocations */}
          <div className="card">
            <div className="card-header">
              <h2>Recent Allocations</h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{allocations.length} total</span>
            </div>
            <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>App ID</th>
                    <th>Student</th>
                    <th>Branch</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allocations.slice(0, 10).map(allo => (
                    <tr key={allo._id}>
                      <td style={{ fontWeight: 600 }}>{allo.student?.applicationId}</td>
                      <td>{allo.student?.fullName}</td>
                      <td>{allo.branch?.name} ({allo.branch?.type})</td>
                      <td>{CAT_LABELS[allo.seatCategory] || allo.seatCategory}</td>
                      <td>{allo.seatType === 'ladies' ? 'Ladies' : 'General'}</td>
                      <td>{allo.allocatedBy === 'auto' ? '🤖 Auto' : '👤 Manual'}</td>
                      <td><span className={`badge badge-${allo.status}`}>{allo.status}</span></td>
                      <td>
                        {allo.status !== 'cancelled' && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleCancelAllocation(allo._id)}>
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {allocations.length === 0 && (
                    <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No allocations yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ===== SEATS TAB ===== */}
      {tab === 'seats' && (
        <>
          <div className="alert alert-info">
            Edit seat counts directly in the matrix below. Changes are saved and broadcast to all connected students in real-time.
          </div>
          {branches.map(branch => (
            <div key={branch._id} style={{ marginBottom: '24px' }}>
              <SeatMatrix
                branch={branch}
                editable={true}
                onUpdate={(updated) => {
                  setBranches(prev => prev.map(b => b._id === branch._id ? { ...b, ...updated } : b));
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px', gap: '8px' }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleBranchUpdate(branch._id, branches.find(b => b._id === branch._id))}
                >
                  💾 Save Changes
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* ===== STUDENTS TAB ===== */}
      {tab === 'students' && (
        <>
          <div className="filters-bar">
            <input
              type="text"
              placeholder="Search by name, App ID, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1, minWidth: '200px' }}
            />
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="">All Categories</option>
              {Object.entries(CAT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="allocated">Allocated</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {filteredStudents.length} students
            </span>
          </div>

          <div className="card">
            <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>App ID</th>
                    <th>Name</th>
                    <th>Percentile</th>
                    <th>Category</th>
                    <th>Gender</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Allocated To</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(s => (
                    <tr key={s._id}>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{s.applicationId}</td>
                      <td>{s.fullName}</td>
                      <td style={{ fontWeight: 700 }}>{s.mhtCetPercentile}</td>
                      <td>{CAT_LABELS[s.category] || s.category}</td>
                      <td>{s.gender}</td>
                      <td>{s.studentType}</td>
                      <td><span className={`badge badge-${s.allocationStatus}`}>{s.allocationStatus}</span></td>
                      <td>{s.allocatedBranch ? `${s.allocatedBranch.name} (${s.allocatedBranch.type})` : '—'}</td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No students found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ===== ALLOCATION TAB ===== */}
      {tab === 'allocate' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>Seat Allocation</h3>
            <div className="toggle-wrapper">
              <button className={`toggle-btn ${allocMode === 'manual' ? 'active' : ''}`} onClick={() => setAllocMode('manual')}>
                👤 Manual
              </button>
              <button className={`toggle-btn ${allocMode === 'auto' ? 'active' : ''}`} onClick={() => setAllocMode('auto')}>
                🤖 Auto
              </button>
              <button className={`toggle-btn ${allocMode === 'upgrade' ? 'active' : ''}`} onClick={() => setAllocMode('upgrade')}>
                🔄 Branch Upgrade
              </button>
            </div>
          </div>

          {allocMode === 'manual' ? (
            <div className="card">
              <div className="card-header">
                <h2>Manual Allocation</h2>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{pendingStudents.length} pending students</span>
              </div>
              <div className="card-body">
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Select Student <span className="required">*</span></label>
                    <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
                      <option value="">-- Select a pending student --</option>
                      {pendingStudents.map(s => (
                        <option key={s._id} value={s._id}>
                          {s.applicationId} — {s.fullName} (Percentile: {s.mhtCetPercentile}, {CAT_LABELS[s.category]}, {s.gender})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label>Select Branch <span className="required">*</span></label>
                    <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
                      <option value="">-- Select a branch --</option>
                      {branches.filter(b => b.totalVacant > 0).map(b => (
                        <option key={b._id} value={b._id}>
                          {b.choiceCode} — {b.name} ({b.type}) — Vacant: {b.totalVacant}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Seat Category <span className="required">*</span></label>
                    <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                      {Object.entries(CAT_LABELS).filter(([k]) => k !== 'EWS').map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Seat Type <span className="required">*</span></label>
                    <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                      <option value="general">General (G)</option>
                      <option value="ladies">Ladies (L)</option>
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <button
                      className="btn btn-primary btn-lg btn-block"
                      onClick={handleManualAllocate}
                      disabled={allocating || !selectedStudent || !selectedBranch}
                    >
                      {allocating ? 'Allocating...' : '✅ Allocate Seat'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <h2>Automated Allocation (MHT-CET Rules)</h2>
              </div>
              <div className="card-body">
                <div className="alert alert-info">
                  Auto allocation follows MHT-CET spot round rules:<br />
                  • Students are sorted by <strong>MHT-CET percentile</strong> (highest first)<br />
                  • Each student is allocated to their <strong>category-specific seat</strong> first<br />
                  • If no category seat available, tries <strong>OPEN seats</strong><br />
                  • <strong>Ladies quota</strong> is respected for female candidates<br />
                  • <strong>PWD, DEF, Minority, Orphan</strong> special pools are checked<br />
                  • Allocation stops when no more seats or students remain
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div className="stat-card">
                    <div className="stat-value">{pendingStudents.length}</div>
                    <div className="stat-label">Pending Students</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{totalVacant}</div>
                    <div className="stat-label">Available Seats</div>
                  </div>
                </div>

                <button
                  className="btn btn-success btn-lg btn-block"
                  onClick={handleAutoAllocate}
                  disabled={allocating || pendingStudents.length === 0 || totalVacant === 0}
                >
                  {allocating ? '🔄 Running Auto Allocation...' : '🤖 Run Auto Allocation for All Pending Students'}
                </button>

                {pendingStudents.length === 0 && (
                  <div className="alert alert-warning" style={{ marginTop: '12px' }}>No pending students to allocate.</div>
                )}
                {totalVacant === 0 && (
                  <div className="alert alert-error" style={{ marginTop: '12px' }}>No vacant seats available.</div>
                )}
              </div>
            </div>
          )}

          {/* ── Branch Upgrade Panel ── */}
          {allocMode === 'upgrade' && (
            <div className="card">
              <div className="card-header">
                <h2>🔄 Branch Upgrade</h2>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>CAP → Spot Round upgrade</span>
              </div>
              <div className="card-body">
                <div className="alert alert-info" style={{ marginBottom: '20px' }}>
                  <strong>How Branch Upgrade works:</strong><br />
                  Student already holds a CAP-allotted seat in Branch A and wants to upgrade to Branch B in the Spot Round.<br />
                  • <strong>FROM branch</strong> seat → <strong>+1</strong> (returned to pool, visible live to all students)<br />
                  • <strong>TO branch</strong> seat → <strong>-1</strong> (new spot allocation)<br />
                  Both changes broadcast <strong>in real-time</strong> to all connected users.
                </div>

                <div className="form-grid">
                  {/* Student Selector */}
                  <div className="form-group full-width">
                    <label>Select Student <span className="required">*</span></label>
                    <select value={upgradeStudent} onChange={e => setUpgradeStudent(e.target.value)}>
                      <option value="">-- Select any student --</option>
                      {students.map(s => (
                        <option key={s._id} value={s._id}>
                          {s.applicationId} — {s.fullName} ({s.mhtCetPercentile}%ile, {CAT_LABELS[s.category]}, {s.gender})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* FROM branch */}
                  <div className="form-group full-width" style={{ background: 'var(--error-bg,#fff5f5)', borderRadius: '8px', padding: '16px', border: '1.5px solid var(--danger,#dc2626)' }}>
                    <label style={{ color: 'var(--danger,#dc2626)', fontWeight: 700 }}>🏫 FROM Branch (Current CAP seat — will be FREED)</label>
                    <select value={upgradeFromBranch} onChange={e => setUpgradeFromBranch(e.target.value)} style={{ marginBottom: '10px' }}>
                      <option value="">-- Select current branch --</option>
                      {branches.map(b => (
                        <option key={b._id} value={b._id}>{b.choiceCode} — {b.name} ({b.type})</option>
                      ))}
                    </select>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label>From Category</label>
                        <select value={upgradeFromCat} onChange={e => setUpgradeFromCat(e.target.value)}>
                          {Object.entries(CAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label>From Seat Type</label>
                        <select value={upgradeFromType} onChange={e => setUpgradeFromType(e.target.value)}>
                          <option value="general">General (G)</option>
                          <option value="ladies">Ladies (L)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="form-group full-width" style={{ textAlign: 'center', fontSize: '28px', padding: '4px 0' }}>⬇️</div>

                  {/* TO branch */}
                  <div className="form-group full-width" style={{ background: 'var(--success-bg,#f0fdf4)', borderRadius: '8px', padding: '16px', border: '1.5px solid var(--success,#16a34a)' }}>
                    <label style={{ color: 'var(--success,#16a34a)', fontWeight: 700 }}>🎯 TO Branch (Upgrade Target — seat will be ALLOCATED)</label>
                    <select value={upgradeToBranch} onChange={e => setUpgradeToBranch(e.target.value)} style={{ marginBottom: '10px' }}>
                      <option value="">-- Select target branch --</option>
                      {branches.filter(b => b._id !== upgradeFromBranch).map(b => (
                        <option key={b._id} value={b._id}>
                          {b.choiceCode} — {b.name} ({b.type}) — Vacant: {b.totalVacant || 0}
                        </option>
                      ))}
                    </select>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label>To Category</label>
                        <select value={upgradeToCat} onChange={e => setUpgradeToCat(e.target.value)}>
                          {Object.entries(CAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label>To Seat Type</label>
                        <select value={upgradeToType} onChange={e => setUpgradeToType(e.target.value)}>
                          <option value="general">General (G)</option>
                          <option value="ladies">Ladies (L)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Summary preview */}
                  {upgradeFromBranch && upgradeToBranch && (
                    <div className="form-group full-width">
                      <div style={{ background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: '8px', padding: '14px', fontSize: '13px' }}>
                        <strong>📋 Upgrade Summary:</strong><br />
                        <span style={{ color: '#dc2626' }}>FROM: {branches.find(b => b._id === upgradeFromBranch)?.name} ({upgradeFromCat} / {upgradeFromType === 'ladies' ? 'Ladies' : 'General'}) → seat +1 freed</span><br />
                        <span style={{ color: '#16a34a' }}>TO: {branches.find(b => b._id === upgradeToBranch)?.name} ({upgradeToCat} / {upgradeToType === 'ladies' ? 'Ladies' : 'General'}) → seat -1 allocated</span><br />
                        <span style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>Changes will be live for all students instantly via WebSocket.</span>
                      </div>
                    </div>
                  )}

                  <div className="form-group full-width">
                    <button
                      className="btn btn-primary btn-lg btn-block"
                      onClick={handleBranchUpgrade}
                      disabled={upgrading || !upgradeStudent || !upgradeFromBranch || !upgradeToBranch}
                      style={{ background: upgrading ? undefined : 'linear-gradient(135deg, #8B1A1A, #c0392b)' }}
                    >
                      {upgrading ? '🔄 Processing Upgrade...' : '🔄 Confirm Branch Upgrade'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ===== ROUND MANAGEMENT TAB ===== */}
      {tab === 'round' && (
        <>
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header">
              <h2>Current Round</h2>
              <span className={`badge badge-${round?.status || 'demo'}`}>{(round?.status || 'demo').toUpperCase()}</span>
            </div>
            <div className="card-body">
              <div className="round-status">
                <div>
                  <div className="status-label">Round Name</div>
                  <div style={{ fontWeight: 600 }}>{round?.name || 'Spot Round'}</div>
                </div>
                <div>
                  <div className="status-label">Mode</div>
                  <div style={{ fontWeight: 600 }}>{round?.isDemo ? '🧪 Demo' : '🔴 Live'}</div>
                </div>
                <div>
                  <div className="status-label">Status</div>
                  <div style={{ fontWeight: 600 }}>{round?.status?.toUpperCase()}</div>
                </div>
              </div>

              <div className="round-controls">
                <button className="btn btn-warning" onClick={() => handleRoundAction('initialize')}>
                  🔄 Initialize New Round
                </button>
                {round?.status === 'setup' && (
                  <button className="btn btn-success" onClick={() => handleRoundAction('start')}>
                    ▶️ Start Round
                  </button>
                )}
                {round?.status === 'active' && (
                  <button className="btn btn-warning" onClick={() => handleRoundAction('pause')}>
                    ⏸️ Pause Round
                  </button>
                )}
                {(round?.status === 'active' || round?.status === 'paused') && (
                  <button className="btn btn-danger" onClick={() => handleRoundAction('end')}>
                    ⏹️ End Round
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2>How Round Management Works</h2>
            </div>
            <div className="card-body" style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '2' }}>
              <ol>
                <li><strong>Demo Mode (current):</strong> Uses sample data for testing. No actual allocations.</li>
                <li><strong>Initialize New Round:</strong> Resets ALL seat counts to 0 and cancels all allocations. Use this when the actual spot round begins.</li>
                <li><strong>Setup Mode:</strong> After initialization, go to "Seat Management" tab and enter the actual vacant seat data from MHT-CET portal.</li>
                <li><strong>Start Round:</strong> Once actual data is entered, start the round to enable allocations.</li>
                <li><strong>Allocate:</strong> Use the "Allocation" tab for manual or auto allocation.</li>
                <li><strong>End Round:</strong> Mark the round as completed when all seats are filled or round ends.</li>
              </ol>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

export default AdminDashboard;
