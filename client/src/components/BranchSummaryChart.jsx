import React from 'react';

const CATEGORIES = ['OPEN', 'SC', 'ST', 'VJ_DT', 'NTB', 'NTC', 'NTD', 'OBC', 'SEBC'];

function getPwdTotal(branch) {
  return CATEGORIES.reduce((s, c) =>
    s + (branch.pwd?.[c]?.general || 0) + (branch.pwd?.[c]?.ladies || 0), 0
  ) + (branch.pwdCommonReserved || 0);
}

function getDefTotal(branch) {
  return CATEGORIES.reduce((s, c) =>
    s + (branch.def?.[c]?.general || 0) + (branch.def?.[c]?.ladies || 0), 0
  ) + (branch.defCommonReserved || 0);
}

function BranchSummaryChart({ branches, flashId }) {
  if (!branches || branches.length === 0) return null;

  const grandTotal = branches.reduce((s, b) => s + (b.totalVacant || 0), 0);

  return (
    <section aria-labelledby="branch-chart-title" style={{ marginBottom: '24px', maxWidth: '880px', margin: '0 auto 24px' }}>
      {/* Header bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '10px', flexWrap: 'wrap', gap: '8px'
      }}>
        <div>
          <h2 id="branch-chart-title" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            📊 Live Vacancy Summary — All Branches
          </h2>
        </div>
        <div style={{
          background: '#FFFF00', color: '#000', fontWeight: 800, fontSize: '13px',
          padding: '5px 16px', borderRadius: '3px', border: '1.5px solid #ccc', whiteSpace: 'nowrap'
        }}>
          Total Vacant CAP Seats: {grandTotal}
        </div>
      </div>

      {/* Scrollable table wrapper */}
      <div style={{
        overflowX: 'auto', WebkitOverflowScrolling: 'touch',
        borderRadius: '8px', border: '1px solid #D0D0D0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <table style={{
          width: '100%', borderCollapse: 'collapse', fontSize: '12px',
          background: '#fff', tableLayout: 'fixed'
        }}>
          <colgroup>
            <col style={{ width: '38px' }} />
            <col />
            <col style={{ width: '105px' }} />
            <col style={{ width: '105px' }} />
          </colgroup>
          <thead>
            {/* College header */}
            <tr>
              <td colSpan={4} style={{
                background: '#fff', padding: '10px 14px',
                borderBottom: '2px solid #8B1A1A', fontSize: '13px'
              }}>
                <span style={{ fontWeight: 800, color: '#8B1A1A' }}>
                  06007 — Walchand College of Engineering, Sangli
                </span>
                <span style={{
                  marginLeft: '14px', fontSize: '11px', color: '#666', fontWeight: 400
                }}>
                  Government-Aided Autonomous &nbsp;|&nbsp; State CET Cell — ACAP Round Vacancy
                </span>
              </td>
            </tr>

            {/* Column headers */}
            <tr style={{ background: '#F0F0F0' }}>
              <th style={{ ...th, width: '38px', padding: '8px 4px' }}>#</th>
              <th style={{ ...th, textAlign: 'left', paddingLeft: '14px', whiteSpace: 'nowrap' }}>BRANCH / COURSE</th>
              <th style={{ ...th, width: '105px' }}>TYPE</th>
              <th style={{ ...th, background: '#FFFF00', color: '#000', width: '105px', fontSize: '13px' }}>VACANT</th>
            </tr>
          </thead>

          <tbody>
            {branches.map((branch, idx) => {
              const isFlash = flashId === branch._id;
              const vacant   = branch.totalVacant || 0;
              const isAided  = branch.type === 'Aided';

              return (
                <tr
                  key={branch._id}
                  className={isFlash ? 'seat-flash' : ''}
                  style={{
                    background: idx % 2 === 0 ? '#fff' : '#FAFAFA',
                    borderBottom: '1px solid #E8E8E8',
                    transition: 'background 0.3s'
                  }}
                >
                  {/* # */}
                  <td style={{ ...td, color: '#999', fontSize: '11px', fontWeight: 600, padding: '8px 4px' }}>{idx + 1}</td>

                  {/* Branch name */}
                  <td style={{ ...td, textAlign: 'left', fontWeight: 700, paddingLeft: '14px', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                    {branch.name}
                  </td>

                  {/* Type */}
                  <td style={{ ...td }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: '12px',
                      fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap',
                      background: isAided ? 'rgba(37,99,235,0.1)' : 'rgba(217,119,6,0.1)',
                      color: isAided ? '#2563EB' : '#D97706'
                    }}>{branch.type}</span>
                  </td>

                  {/* Overall Vacant + PWD/DEF breakdown */}
                  {(() => {
                    const pwdT = getPwdTotal(branch);
                    const defT = getDefTotal(branch);
                    return (
                      <td style={{
                        ...td,
                        background: vacant > 0 ? '#F0FDF4' : '#FFF5F5',
                        fontWeight: 900, fontSize: '17px',
                        color: vacant > 0 ? '#059669' : '#DC2626',
                        letterSpacing: '-0.5px',
                        verticalAlign: 'middle',
                        lineHeight: 1.1,
                        padding: '8px 6px'
                      }}>
                        {vacant}
                        {(pwdT > 0 || defT > 0) && (
                          <div style={{
                            marginTop: '5px',
                            paddingTop: '4px',
                            borderTop: '1px solid rgba(0,0,0,0.08)',
                            display: 'flex',
                            gap: '3px',
                            justifyContent: 'center',
                            flexWrap: 'wrap'
                          }}>
                            {pwdT > 0 && (
                              <span style={{
                                fontSize: '9px', fontWeight: 800, letterSpacing: 0,
                                background: '#DC2626', color: '#fff',
                                borderRadius: '3px', padding: '1px 5px',
                                display: 'inline-block', whiteSpace: 'nowrap'
                              }}>PWD:{pwdT}</span>
                            )}
                            {defT > 0 && (
                              <span style={{
                                fontSize: '9px', fontWeight: 800, letterSpacing: 0,
                                background: '#D97706', color: '#fff',
                                borderRadius: '3px', padding: '1px 5px',
                                display: 'inline-block', whiteSpace: 'nowrap'
                              }}>DEF:{defT}</span>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })()}

                </tr>
              );
            })}
          </tbody>

        </table>
      </div>
    </section>
  );
}

// ── Style tokens ─────────────────────────────────────────────────────────────
const th = {
  padding: '8px 10px',
  border: '1px solid #D0D0D0',
  textAlign: 'center',
  fontWeight: 700,
  fontSize: '11px',
  color: '#333',
  textTransform: 'uppercase',
  letterSpacing: '0.3px',
  whiteSpace: 'nowrap'
};

const td = {
  padding: '8px 10px',
  border: '1px solid #E0E0E0',
  textAlign: 'center',
  fontSize: '12px',
  color: '#333',
  verticalAlign: 'middle'
};

export default BranchSummaryChart;
