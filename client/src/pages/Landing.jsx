import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import SeatMatrix from '../components/SeatMatrix';
import BranchSummaryChart from '../components/BranchSummaryChart';
import LiveNotification from '../components/animations/LiveNotification';
import TeaBreakOverlay from '../components/animations/TeaBreakOverlay';
import LunchBreakOverlay from '../components/animations/LunchBreakOverlay';
import { playBreakBell, playNotificationSound, playUrgentSound } from '../components/animations/portalSounds';

const youtubeVideoId = import.meta.env.VITE_YOUTUBE_VIDEO_ID || 'e1628RDUFFs';

function Landing() {
  const [branches, setBranches] = useState([]);
  const [round, setRound] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [flashId, setFlashId] = useState(null);
  const [liveAlert, setLiveAlert] = useState(null); // { message, type, sentBy }
  const [breakType, setBreakType] = useState(null); // 'tea' | 'lunch' | null
  const { socket } = useSocket();

  useEffect(() => {
    fetchData();
  }, []);

  // ── Polling fallback: re-fetch round every 5s ────────────────────────────────
  // Syncs break state + seat data even when socket is disconnected.
  // 5s is fast enough to catch a break within one polling cycle.
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [branchRes, roundRes] = await Promise.all([
          axios.get('/api/branches'),
          axios.get('/api/round/current')
        ]);
        setBranches(branchRes.data);
        setRound(roundRes.data);
        // Sync break state via polling (works even when socket is not connected)
        setBreakType(roundRes.data?.breakType || null);
      } catch (_) {}
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    const onSeatUpdate = (data) => {
      setBranches(prev => prev.map(b => b._id === data.branchId ? data.branch : b));
      setFlashId(data.branchId);
      setTimeout(() => setFlashId(null), 1000);
    };
    const onSeatsReset = (data) => { setBranches(data.branches); };
    const onRoundUpdate = (data) => {
      setRound(data.round);
      // Sync break state from round doc (fallback when polling catches it)
      if (data.round?.breakType) { setBreakType(data.round.breakType); }
      else if (data.round) { setBreakType(null); }
    };
    const onAnnouncementUpdate = (data) => { setRound(data.round); };
    const onAdminAlert = (data) => {
      setLiveAlert(data);
      if (data.type === 'urgent') { playUrgentSound(); } else { playNotificationSound(); }
      setTimeout(() => setLiveAlert(null), 7000);
    };
    const onBreakStart = (data) => { setBreakType(data.type); playBreakBell(); };
    const onBreakEnd = () => { setBreakType(null); };

    socket.on('seat-update',         onSeatUpdate);
    socket.on('seats-reset',         onSeatsReset);
    socket.on('round-update',        onRoundUpdate);
    socket.on('announcement-update', onAnnouncementUpdate);
    socket.on('admin-alert',         onAdminAlert);
    socket.on('break-start',         onBreakStart);
    socket.on('break-end',           onBreakEnd);

    return () => {
      socket.off('seat-update',         onSeatUpdate);
      socket.off('seats-reset',         onSeatsReset);
      socket.off('round-update',        onRoundUpdate);
      socket.off('announcement-update', onAnnouncementUpdate);
      socket.off('admin-alert',         onAdminAlert);
      socket.off('break-start',         onBreakStart);
      socket.off('break-end',           onBreakEnd);
    };
  }, [socket]);

  const fetchData = async () => {
    try {
      const [branchRes, roundRes] = await Promise.all([
        axios.get('/api/branches'),
        axios.get('/api/round/current')
      ]);
      setBranches(branchRes.data);
      setRound(roundRes.data);
      // Sync break state from DB on initial load (covers page refresh during a break)
      if (roundRes.data?.breakType) { setBreakType(roundRes.data.breakType); }
      else { setBreakType(null); }
    } catch (err) {
      console.error('Fetch error:', err);
    }
    setLoading(false);
  };

  const filteredBranches = branches.filter(b => {
    if (filter === 'all') return true;
    return b.type === filter;
  });

  const totalVacant = branches.reduce((sum, b) => sum + (b.totalVacant || 0), 0);
  const aidedCount = branches.filter(b => b.type === 'Aided').length;
  const unaidedCount = branches.filter(b => b.type === 'Unaided').length;

  if (loading) {
    return (
      <>
        {/* Show overlays even during loading — break/alert must work immediately */}
        <LiveNotification alert={liveAlert} onDismiss={() => setLiveAlert(null)} />
        <TeaBreakOverlay isActive={breakType === 'tea'} />
        <LunchBreakOverlay isActive={breakType === 'lunch'} />
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading seat data...</p>
        </div>
      </>
    );
  }

  return (
    <>
      {/* ── Premium Live Notification ── */}
      <LiveNotification alert={liveAlert} onDismiss={() => setLiveAlert(null)} />

      {/* ── Break Overlays ── */}
      <TeaBreakOverlay isActive={breakType === 'tea'} />
      <LunchBreakOverlay isActive={breakType === 'lunch'} />

      {/* Sub Header */}
      <div className="sub-header">
        <div className="sub-header-content">
          <img src="/wce-logo.png" alt="Walchand College of Engineering Sangli Logo" className="sub-header-logo" />
          <div className="sub-header-text">
            <h1>Walchand College of Engineering, Sangli</h1>
            <div className="portal-label">
              ACAP ROUND · ADMISSION REGISTRATION PORTAL
            </div>
            <div className="institute-type">A Government Aided Autonomous Institute</div>
          </div>
        </div>
      </div>

      {/* Round Status Banner */}
      {(() => {
        if (!round) return null;
        
        const bannerText = breakType === 'tea'
          ? '☕ TEA BREAK IN PROGRESS — Please relax, we will resume shortly. ☕ TEA BREAK IN PROGRESS — Please relax, we will resume shortly.'
          : breakType === 'lunch'
            ? '🍱 LUNCH BREAK IN PROGRESS — Enjoy your meal, the round will resume after lunch. 🍱 LUNCH BREAK IN PROGRESS — Enjoy your meal, the round will resume after lunch.'
            : (round.announcementText || `THIS FORM IS ONLY FOR STUDENTS APPLYING FOR 1ST YEAR ACAP ROUND REGISTRATION - ${round.name}`);
        
        // Base 18s duration + 0.15s per character to slow down if text increases
        const animationDuration = `${Math.max(18, bannerText.length * 0.15)}s`;

        return (
          <div className={`banner ${round.isDemo ? 'demo-banner' : ''} ${round.announcementEnabled === false ? 'banner-disabled' : ''} ${breakType ? `break-banner-${breakType}` : ''}`}>
            {round.announcementEnabled !== false && (
              <div 
                className={`announcement-track announcement-${round.announcementDirection || 'ltr'}`}
                style={{ animationDuration }}
              >
                <span>{bannerText} </span>
              </div>
            )}
          </div>
        );
      })()}

      <main className="main-content">
        {/* Live Branch Vacancy Summary Chart */}
        <BranchSummaryChart branches={filteredBranches} flashId={flashId} />

        {/* Instructions */}
        <div className="instructions-card">
          <h3>Read Before You Begin — Candidate Instructions</h3>
          <ol>
            <li>Only candidates whose names appear in the MHT-CET Final Merit List are eligible to register through this portal.</li>
            <li>This registration portal is applicable only to candidates who have appeared for either the MHT-CET or JEE examination.</li>
            <li>Candidates who completed their CET registration after the declaration of the Final Merit List are also eligible to register through this portal.</li>
            <li>Candidates who did not complete CET registration after the declaration of the Final Merit List but have appeared for either the MHT-CET or JEE examination must select the "NON-CAP" option during registration.</li>
            <li>Candidates are advised to carefully verify all the details fetched from the CET/JEE database. If any discrepancy is found, please contact the WCE Admission Cell immediately before proceeding further.</li>
            <li>Enter your personal details, including your Email ID, Mobile Number, and other required information.</li>
            <li>Seat availability shown below updates in <strong>real-time</strong> as allocations are made.</li>
          </ol>
        </div>

        {/* Stats Summary */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>🎓</div>
            <div className="stat-value">{branches.length}</div>
            <div className="stat-label">Total Branches</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>💺</div>
            <div className="stat-value">{totalVacant}</div>
            <div className="stat-label">Total Vacant Seats</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--info-light)', color: 'var(--info)' }}>🏛️</div>
            <div className="stat-value">{aidedCount}</div>
            <div className="stat-label">Aided Branches</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>🏢</div>
            <div className="stat-value">{unaidedCount}</div>
            <div className="stat-label">Unaided Branches</div>
          </div>
        </div>

        {/* Filter + CTA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div className="toggle-wrapper">
            <button
              className={`toggle-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >All Branches</button>
            <button
              className={`toggle-btn ${filter === 'Aided' ? 'active' : ''}`}
              onClick={() => setFilter('Aided')}
            >Aided</button>
            <button
              className={`toggle-btn ${filter === 'Unaided' ? 'active' : ''}`}
              onClick={() => setFilter('Unaided')}
            >Unaided</button>
          </div>
          {/* <Link to="/register" className="btn btn-primary">
            Register for ACAP Round →
        </Link> */}
        </div>

        {/* Seat Matrices */}
        {filteredBranches.map(branch => (
          <SeatMatrix key={branch._id} branch={branch} flashId={flashId} />
        ))}

        {filteredBranches.length === 0 && (
          <div className="alert alert-info">No branches found for the selected filter.</div>
        )}



        {/* Legend */}
        {/* <div className="card" style={{ marginTop: '20px' }}>
          <div className="card-body" style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.8' }}>
            <strong>F:</strong> Only For Female, <strong>K:</strong> Konkan Seats, <strong>HU:</strong> Home University,
            <strong> OHU:</strong> Other than Home University, <strong>Common Reserved:</strong> Combined Common for All Reserved Categories
            <br />
            <strong>Note:</strong> Vacancy position may vary. Candidates are advised to fill all eligible Choice Code of their choice irrespective of vacancy position.
            <br /><br />
            <em>STATE CET CELL, Mumbai</em>
          </div>
        </div>
        <div> */}
        {/* Live WCE Tilak Hall video */}
        <section className="video-section card" aria-labelledby="video-title">
          <div className="video-section-copy">
            <span className="video-eyebrow">📡 Live from Campus</span>
            <h2 id="video-title">🎥 Watch Live — WCE Tilak Hall ACAP Round</h2>
            <p>Tune in to the live stream straight from the Tilak Hall — witness the ACAP round action as it happens! 🔥</p>
          </div>
          <div className="youtube-player">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeVideoId}?rel=0`}
              title="ACAP round admission guidance"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </section>
      </main>
    </>
  );
}

export default Landing;
