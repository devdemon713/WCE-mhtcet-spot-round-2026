import React from 'react';

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = ['OPEN', 'SC', 'ST', 'VJ_DT', 'NTB', 'NTC', 'NTD', 'OBC', 'SEBC'];

const CAT_LABELS = {
  OPEN: 'OPEN', SC: 'SC', ST: 'ST', VJ_DT: 'VJ/DT',
  NTB: 'NTB', NTC: 'NTC', NTD: 'NTD', OBC: 'OBC', SEBC: 'SEBC',
};

const CAT_COLORS = {
  OPEN:  { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', hd: '#DBEAFE' },
  SC:    { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA', hd: '#FFEDD5' },
  ST:    { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0', hd: '#DCFCE7' },
  VJ_DT: { bg: '#FDF4FF', color: '#7E22CE', border: '#E9D5FF', hd: '#F3E8FF' },
  NTB:   { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A', hd: '#FEF3C7' },
  NTC:   { bg: '#FFF1F2', color: '#BE123C', border: '#FECDD3', hd: '#FFE4E6' },
  NTD:   { bg: '#F0F9FF', color: '#0369A1', border: '#BAE6FD', hd: '#E0F2FE' },
  OBC:   { bg: '#F7FEE7', color: '#4D7C0F', border: '#D9F99D', hd: '#ECFCCB' },
  SEBC:  { bg: '#FDF2F8', color: '#9D174D', border: '#FBCFE8', hd: '#FCE7F3' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
// Sum Male (general) across all pools for a category
const maleOf  = (branch, cat) =>
  (branch.stateLevel?.[cat]?.general || 0) +
  (branch.pwd?.[cat]?.general        || 0) +
  (branch.def?.[cat]?.general        || 0);

// Sum Female (ladies) across all pools for a category
const femaleOf = (branch, cat) =>
  (branch.stateLevel?.[cat]?.ladies  || 0) +
  (branch.pwd?.[cat]?.ladies         || 0) +
  (branch.def?.[cat]?.ladies         || 0);

// ── Component ─────────────────────────────────────────────────────────────────
function BranchSummaryChart({ branches, flashId }) {
  if (!branches || branches.length === 0) return null;

  const grandTotal = branches.reduce((s, b) => s + (b.totalVacant || 0), 0);

  // Total columns: 3 fixed  +  9 cats × 2 (M, F)  +  1 grand total
  const totalCols = 3 + CATEGORIES.length * 2 + 1;


  return (
    <section
      aria-labelledby="branch-chart-title"
      style={{ marginBottom: '24px', width: '100%', boxSizing: 'border-box' }}
    >
      {/* ── Header bar ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '10px', flexWrap: 'wrap', gap: '8px',
      }}>
        <h2 id="branch-chart-title" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          📊 Live Vacancy Summary — All Branches
        </h2>
        <div style={{
          background: '#FFFF00', color: '#000', fontWeight: 800, fontSize: '13px',
          padding: '5px 16px', borderRadius: '3px', border: '1.5px solid #ccc', whiteSpace: 'nowrap',
        }}>
          Total Vacant CAP Seats: {grandTotal}
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{
        width: '100%',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        borderRadius: '8px',
        border: '1px solid #D0D0D0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        boxSizing: 'border-box',
      }}>
        <table style={{
          borderCollapse: 'collapse',
          fontSize: '11px',
          background: '#fff',
          whiteSpace: 'nowrap',
          width: '100%',
          minWidth: 'max-content',
        }}>

          <thead>
            {/* ── College banner ── */}
            <tr>
              <td colSpan={totalCols} style={{
                background: '#fff', padding: '10px 14px',
                borderBottom: '2px solid #8B1A1A', fontSize: '13px',
              }}>
                <span style={{ fontWeight: 800, color: '#8B1A1A' }}>
                  06007 — Walchand College of Engineering, Sangli
                </span>
                <span style={{ marginLeft: '14px', fontSize: '11px', color: '#666', fontWeight: 400 }}>
                  Government-Aided Autonomous &nbsp;|&nbsp; State CET Cell — ACAP Round Vacancy
                </span>
              </td>
            </tr>

            {/* ── Row 1: Category group headers ── */}
            <tr style={{ background: '#F5F5F5' }}>
              <th rowSpan={2} style={TH('#e5e7eb', '#374151', 36)}>#</th>
              <th rowSpan={2} style={{ ...TH('#e5e7eb', '#374151'), textAlign: 'left', paddingLeft: '14px', minWidth: '170px', maxWidth: '220px' }}>
                BRANCH / COURSE
              </th>
              <th rowSpan={2} style={TH('#e5e7eb', '#374151', 80)}>TYPE</th>

              {CATEGORIES.map(cat => {
                const c = CAT_COLORS[cat];
                return (
                  <th
                    key={cat}
                    colSpan={2}
                    style={{ ...TH(c.hd, c.color), borderBottom: `2px solid ${c.border}`, minWidth: '58px' }}
                  >
                    {CAT_LABELS[cat]}
                  </th>
                );
              })}

              <th rowSpan={2} style={{ ...TH('#FFFF00', '#000'), minWidth: '65px', fontSize: '12px', border: '2px solid #bbb' }}>
                TOTAL<br />VACANT
              </th>
            </tr>

            {/* ── Row 2: M / F per category ── */}
            <tr style={{ background: '#fafafa' }}>
              {CATEGORIES.map(cat => {
                const c = CAT_COLORS[cat];
                return (
                  <React.Fragment key={cat}>
                    <th style={TH(c.hd, c.color, 28)}>M</th>
                    <th style={{ ...TH(c.hd, c.color, 28), borderLeft: `2px solid ${c.border}` }}>F</th>
                  </React.Fragment>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {branches.map((branch, idx) => {
              const isFlash    = flashId === branch._id;
              const isAided    = branch.type === 'Aided';
              const totalVacant = branch.totalVacant || 0;
              const rowBg      = idx % 2 === 0 ? '#fff' : '#FAFAFA';

              return (
                <tr
                  key={branch._id}
                  className={isFlash ? 'seat-flash' : ''}
                  style={{ background: rowBg, borderBottom: '1px solid #E8E8E8', transition: 'background 0.3s' }}
                >
                  {/* # */}
                  <td style={{ ...TD, color: '#999', fontSize: '10px', fontWeight: 600, padding: '7px 4px' }}>
                    {idx + 1}
                  </td>

                  {/* Branch name */}
                  <td style={{ ...TD, textAlign: 'left', fontWeight: 700, paddingLeft: '14px', color: 'var(--text-primary)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span title={branch.name}>{branch.name}</span>
                  </td>

                  {/* Type badge */}
                  <td style={TD}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: '10px',
                      fontSize: '9px', fontWeight: 700,
                      background: isAided ? 'rgba(37,99,235,0.1)' : 'rgba(217,119,6,0.1)',
                      color:      isAided ? '#2563EB'              : '#D97706',
                    }}>
                      {branch.type}
                    </span>
                  </td>

                  {/* ── Category columns: M, F ── */}
                  {CATEGORIES.map(cat => {
                    const c    = CAT_COLORS[cat];
                    const m    = maleOf(branch, cat);
                    const f    = femaleOf(branch, cat);
                    const hasM = m > 0;
                    const hasF = f > 0;

                    return (
                      <React.Fragment key={cat}>
                        {/* Male */}
                        <td style={{
                          ...TD,
                          background: hasM ? c.bg    : rowBg,
                          color:      hasM ? c.color : '#ccc',
                          fontWeight: hasM ? 700     : 400,
                          fontSize:   hasM ? '13px'  : '11px',
                        }}>
                          {hasM ? m : '—'}
                        </td>

                        {/* Female */}
                        <td style={{
                          ...TD,
                          borderLeft:  `2px solid ${hasF ? c.border : '#ebebeb'}`,
                          background:  hasF ? c.bg    : rowBg,
                          color:       hasF ? c.color : '#ccc',
                          fontWeight:  hasF ? 700     : 400,
                          fontSize:    hasF ? '13px'  : '11px',
                        }}>
                          {hasF ? f : '—'}
                        </td>
                      </React.Fragment>
                    );
                  })}

                  {/* ── Grand total ── */}
                  <td style={{
                    ...TD,
                    background:    totalVacant > 0 ? '#F0FDF4' : '#FFF5F5',
                    color:         totalVacant > 0 ? '#059669' : '#DC2626',
                    fontWeight:    900,
                    fontSize:      '17px',
                    letterSpacing: '-0.5px',
                    border:        '2px solid #bbb',
                    padding:       '7px 4px',
                  }}>
                    {totalVacant}
                  </td>
                </tr>
              );
            })}

            {/* ── Grand footer / totals row ── */}
            <tr style={{ background: '#F0F0F0', borderTop: '2px solid #aaa' }}>
              <td colSpan={3} style={{ ...TD, fontWeight: 800, fontSize: '12px', textAlign: 'left', paddingLeft: '14px', color: '#333' }}>
                TOTAL (All Branches)
              </td>

              {CATEGORIES.map(cat => {
                const c    = CAT_COLORS[cat];
                const totM = branches.reduce((s, b) => s + maleOf(b, cat),   0);
                const totF = branches.reduce((s, b) => s + femaleOf(b, cat), 0);
                return (
                  <React.Fragment key={cat}>
                    <td style={{ ...TD, fontWeight: 800, color: c.color, background: c.hd, fontSize: '13px' }}>
                      {totM || '—'}
                    </td>
                    <td style={{ ...TD, fontWeight: 800, color: c.color, background: c.hd, fontSize: '13px', borderLeft: `2px solid ${c.border}` }}>
                      {totF || '—'}
                    </td>
                  </React.Fragment>
                );
              })}

              <td style={{ ...TD, background: '#FFFF00', color: '#000', fontWeight: 900, fontSize: '17px', border: '2px solid #aaa' }}>
                {grandTotal}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Legend ── */}
      <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px', fontSize: '10px', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, color: '#555', marginRight: '4px' }}>Categories:</span>
        {CATEGORIES.map(cat => {
          const c = CAT_COLORS[cat];
          return (
            <span key={cat} style={{
              background: c.bg, color: c.color,
              border: `1px solid ${c.border}`,
              borderRadius: '4px', padding: '2px 8px', fontWeight: 700,
            }}>
              {CAT_LABELS[cat]}
            </span>
          );
        })}
        <span style={{ marginLeft: '10px', color: '#888' }}>
          · <b>M</b> = Male &nbsp;· <b>F</b> = Female
          &nbsp;· Includes State Level + PWD + DEF pools
        </span>
      </div>
    </section>
  );
}

// ── Style helpers ─────────────────────────────────────────────────────────────
const TH = (bg, color, width) => ({
  padding:        '5px 4px',
  border:         '1px solid #D0D0D0',
  textAlign:      'center',
  fontWeight:     700,
  fontSize:       '10px',
  color:          color || '#333',
  background:     bg    || '#F0F0F0',
  textTransform:  'uppercase',
  letterSpacing:  '0.3px',
  whiteSpace:     'nowrap',
  verticalAlign:  'middle',
  ...(width ? { width: `${width}px`, minWidth: `${width}px` } : {}),
});

const TD = {
  padding:       '6px 5px',
  border:        '1px solid #E0E0E0',
  textAlign:     'center',
  fontSize:      '11px',
  color:         '#333',
  verticalAlign: 'middle',
};

export default BranchSummaryChart;
