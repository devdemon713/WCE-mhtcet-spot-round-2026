import React, { useMemo, useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import './VacancySummaryTable.css';

// Columns matching the DTE Maharashtra seat matrix format
const COLS = [
  { key: 'OPEN',   label: 'OPEN',    color: '#1a7f37' },
  { key: 'ORPHAN', label: 'ORPHAN',  color: '#e88c00' },
  { key: 'SC',     label: 'SC',      color: '#444' },
  { key: 'ST',     label: 'ST',      color: '#444' },
  { key: 'VJ_DT',  label: 'VJ/DT',  color: '#444' },
  { key: 'NTB',    label: 'NTB/NT1', color: '#444' },
  { key: 'NTC',    label: 'NTC/NT2', color: '#444' },
  { key: 'NTD',    label: 'NTD/NT3', color: '#444' },
  { key: 'OBC',    label: 'OBC',     color: '#444' },
  { key: 'PWCR',   label: 'PWCR',   color: '#7c3aed' },
  { key: 'DEFCR',  label: 'DEFCR',  color: '#7c3aed' },
  { key: 'SEBC',   label: 'SEBC',   color: '#444' },
];

function getSeat(branch, colKey, quota) {
  const pool = branch.stateLevel || {};
  if (colKey === 'ORPHAN') return quota === 'nonSponsored' ? (branch.orphanSeats || 0) : 0;
  if (colKey === 'PWCR')   return quota === 'nonSponsored' ? (branch.pwdCommonReserved || 0) : 0;
  if (colKey === 'DEFCR')  return quota === 'nonSponsored' ? (branch.defCommonReserved || 0) : 0;
  const catData = pool[colKey] || {};
  if (quota === 'nonSponsored') return catData.general || 0;
  if (quota === 'sponsored')    return catData.ladies  || 0;
  return 0;
}

function rowTotal(branch, quota) {
  return COLS.reduce((s, c) => s + getSeat(branch, c.key, quota), 0);
}

function grandTotal(branch) {
  return rowTotal(branch, 'nonSponsored') + rowTotal(branch, 'sponsored');
}

function VacancySummaryTable({ branches: initialBranches = [] }) {
  const { socket } = useSocket();
  const [branches, setBranches] = useState(initialBranches);
  const [flashIds, setFlashIds] = useState(new Set());

  // Keep in sync when parent re-fetches (e.g. initial load)
  useEffect(() => {
    setBranches(initialBranches);
  }, [initialBranches]);

  // Real-time seat-update socket listener
  useEffect(() => {
    if (!socket) return;

    const handleSeatUpdate = (data) => {
      setBranches(prev =>
        prev.map(b => b._id === data.branchId ? { ...data.branch } : b)
      );
      // Flash the updated row
      setFlashIds(prev => new Set([...prev, data.branchId]));
      setTimeout(() => {
        setFlashIds(prev => {
          const next = new Set(prev);
          next.delete(data.branchId);
          return next;
        });
      }, 1200);
    };

    const handleSeatsReset = (data) => {
      if (data.branches) setBranches(data.branches);
    };

    socket.on('seat-update', handleSeatUpdate);
    socket.on('seats-reset', handleSeatsReset);

    return () => {
      socket.off('seat-update', handleSeatUpdate);
      socket.off('seats-reset', handleSeatsReset);
    };
  }, [socket]);

  // Column totals across all branches
  const colTotals = useMemo(() => {
    const totals = { nonSponsored: {}, sponsored: {} };
    COLS.forEach(c => {
      totals.nonSponsored[c.key] = branches.reduce((s, b) => s + getSeat(b, c.key, 'nonSponsored'), 0);
      totals.sponsored[c.key]    = branches.reduce((s, b) => s + getSeat(b, c.key, 'sponsored'),    0);
    });
    return totals;
  }, [branches]);

  const totalNS       = COLS.reduce((s, c) => s + (colTotals.nonSponsored[c.key] || 0), 0);
  const totalSP       = COLS.reduce((s, c) => s + (colTotals.sponsored[c.key]    || 0), 0);
  const grandTotalAll = branches.reduce((s, b) => s + grandTotal(b), 0);

  if (!branches.length) return null;

  return (
    <div className="vsmt-wrapper">
      <div className="vsmt-title-row">
        <span className="vsmt-title">📋 Vacant Seat Summary — Category-wise</span>
        <span className="vsmt-subtitle">Combined (Non-Sponsored + Sponsored) · Live Real-Time</span>
      </div>

      <div className="vsmt-scroll">
        <table className="vsmt-table">
          <thead>
            <tr className="vsmt-head-top">
              <th className="vsmt-th vsmt-th-num">#</th>
              <th className="vsmt-th vsmt-th-course">COURSE / SPECIALIZATION</th>
              <th className="vsmt-th vsmt-th-quota">QUOTA</th>
              {COLS.map(c => (
                <th key={c.key} className="vsmt-th vsmt-th-cat" style={{ color: c.color }}>
                  {c.label}
                </th>
              ))}
              <th className="vsmt-th vsmt-th-total">TOTAL</th>
              <th className="vsmt-th vsmt-th-grand">GRAND<br/>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((branch, idx) => {
              const isFlash = flashIds.has(branch._id);
              const nsTotal = rowTotal(branch, 'nonSponsored');
              const spTotal = rowTotal(branch, 'sponsored');
              const gt      = nsTotal + spTotal;
              return (
                <React.Fragment key={branch._id}>
                  {/* Non-Sponsored row */}
                  <tr className={`vsmt-row vsmt-row-ns ${isFlash ? 'vsmt-flash' : ''}`}>
                    <td className="vsmt-td vsmt-td-num" rowSpan={2}>{idx + 1}</td>
                    <td className="vsmt-td vsmt-td-course" rowSpan={2}>
                      <span className="vsmt-branch-name">{branch.name}</span>
                      <span className="vsmt-branch-type">
                        {branch.type === 'Aided' ? 'Govt-Aided' : 'Un-Aided'}
                      </span>
                    </td>
                    <td className="vsmt-td vsmt-td-quota">Non-Sponsored</td>
                    {COLS.map(c => {
                      const val = getSeat(branch, c.key, 'nonSponsored');
                      return (
                        <td
                          key={c.key}
                          className={`vsmt-td vsmt-td-val ${val > 0 ? 'vsmt-val-pos' : 'vsmt-val-zero'}`}
                          style={val > 0 ? { color: c.color, fontWeight: 700 } : {}}
                        >
                          {val > 0 ? val : 0}
                        </td>
                      );
                    })}
                    <td className="vsmt-td vsmt-td-rowtotal">{nsTotal}</td>
                    <td className="vsmt-td vsmt-td-grandrow" rowSpan={2}>{gt}</td>
                  </tr>

                  {/* Sponsored row */}
                  <tr className={`vsmt-row vsmt-row-sp ${isFlash ? 'vsmt-flash' : ''}`}>
                    <td className="vsmt-td vsmt-td-quota">Sponsored</td>
                    {COLS.map(c => {
                      const val = getSeat(branch, c.key, 'sponsored');
                      return (
                        <td
                          key={c.key}
                          className={`vsmt-td vsmt-td-val ${val > 0 ? 'vsmt-val-pos' : 'vsmt-val-zero'}`}
                          style={val > 0 ? { color: c.color, fontWeight: 700 } : {}}
                        >
                          {val > 0 ? val : 0}
                        </td>
                      );
                    })}
                    <td className="vsmt-td vsmt-td-rowtotal">{spTotal}</td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>

          {/* Footer totals */}
          <tfoot>
            <tr className="vsmt-foot">
              <td colSpan={2} className="vsmt-td vsmt-foot-label">TOTAL VACANT SEATS:</td>
              <td className="vsmt-td vsmt-foot-combined">COMBINED</td>
              {COLS.map(c => {
                const val = (colTotals.nonSponsored[c.key] || 0) + (colTotals.sponsored[c.key] || 0);
                return (
                  <td
                    key={c.key}
                    className={`vsmt-td vsmt-foot-val ${val > 0 ? 'vsmt-val-pos' : ''}`}
                    style={val > 0 ? { color: c.color } : {}}
                  >
                    {val}
                  </td>
                );
              })}
              <td className="vsmt-td vsmt-foot-total">{totalNS + totalSP}</td>
              <td className="vsmt-td vsmt-foot-grand">{grandTotalAll}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default VacancySummaryTable;
