import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';

// ─── Constants ───────────────────────────────────────────────
const LEAD_TYPES = [
  { key: 'deadAbandoned', label: 'Dead Abandoned', color: '#ef4444', badge: 'DA' },
  { key: 'deadCancelled', label: 'Dead Cancelled', color: '#f97316', badge: 'DC' },
  { key: 'livePending',   label: 'Live Pending',   color: '#3b82f6', badge: 'LP' },
  { key: 'liveRegister',  label: 'Live Register',  color: '#22c55e', badge: 'LR' },
];

const DATE_LABELS = {
  deadAbandoned: 'Date Abandoned',
  deadCancelled: 'Date Cancelled',
  livePending:   'Filing Date',
  liveRegister:  'Registration Date',
};

const getValidKey   = (type) => `leads_${type}`;
const getMissingKey = (type) => `leads_missing_${type}`;

// ─── Hook: real-time storage listener ────────────────────────
function useLeadData(type, subType) {
  const [leads, setLeads] = useState([]);
  const [allCounts, setAllCounts] = useState({});

  const loadAllCounts = (res) => {
    const c = {};
    LEAD_TYPES.forEach(t => {
      c[t.key] = {
        valid:   (res[getValidKey(t.key)]   || []).length,
        missing: (res[getMissingKey(t.key)] || []).length,
      };
    });
    setAllCounts(c);
  };

  useEffect(() => {
    const allKeys = LEAD_TYPES.flatMap(t => [getValidKey(t.key), getMissingKey(t.key)]);

    const load = () => {
      chrome.storage.local.get(allKeys, (res) => {
        loadAllCounts(res);
        if (type) {
          const key = subType === 'valid' ? getValidKey(type) : getMissingKey(type);
          setLeads(res[key] || []);
        }
      });
    };

    load();

    const onChange = (changes, area) => {
      if (area !== 'local') return;
      const relevant = allKeys.some(k => changes[k]);
      if (relevant) load();
    };

    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, [type, subType]);

  return { leads, allCounts };
}

// ─── Delete helpers ───────────────────────────────────────────
function deleteSingleLead(type, subType, serial, callback) {
  const key = subType === 'valid' ? getValidKey(type) : getMissingKey(type);
  chrome.storage.local.get([key], (res) => {
    const updated = (res[key] || []).filter(l => l.serial !== serial);
    chrome.storage.local.set({ [key]: updated }, callback);
  });
}

function deleteMultipleLeads(type, subType, serials, callback) {
  const key = subType === 'valid' ? getValidKey(type) : getMissingKey(type);
  const set = new Set(serials);
  chrome.storage.local.get([key], (res) => {
    const updated = (res[key] || []).filter(l => !set.has(l.serial));
    chrome.storage.local.set({ [key]: updated }, callback);
  });
}

// ─── Trash Icon ───────────────────────────────────────────────
function TrashIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
    </svg>
  );
}

// ─── Custom Checkbox ──────────────────────────────────────────
function Checkbox({ checked, indeterminate, onChange }) {
  const [hovered, setHovered] = React.useState(false);
  const active = checked || indeterminate;

  return (
    <div
      onClick={e => { e.stopPropagation(); onChange && onChange(e); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '15px', height: '15px', borderRadius: '4px', flexShrink: 0,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1.5px solid ${active ? '#3b82f6' : hovered ? '#475569' : '#2d3f55'}`,
        background: active ? '#3b82f6' : hovered ? '#1e293b' : '#0f172a',
        transition: 'all 0.12s ease',
        boxShadow: active ? '0 0 0 3px #3b82f620' : hovered ? '0 0 0 3px #3b82f610' : 'none',
        userSelect: 'none',
      }}
    >
      {indeterminate && !checked ? (
        <div style={{ width: '7px', height: '1.5px', background: '#fff', borderRadius: '1px' }} />
      ) : checked ? (
        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
          <polyline points="1,3.5 3.5,6 8,1" stroke="white" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : null}
    </div>
  );
}

// ─── Filter helpers ──────────────────────────────────────────
const LLC_REGEX = /\bllc\b|l\.l\.c\.?/i;
const INC_REGEX = /\binc\b|i\.n\.c\.?/i;

function applyFilters(leads, filterLLC, filterINC) {
  return leads.filter(l => {
    const c = l.correspondent || '';
    if (filterLLC && filterINC) return LLC_REGEX.test(c) || INC_REGEX.test(c);
    if (filterLLC) return LLC_REGEX.test(c);
    if (filterINC) return INC_REGEX.test(c);
    return true;
  });
}

// ─── Filter Toggle Button ─────────────────────────────────────
function FilterChip({ label, active, count, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '4px 11px', borderRadius: '20px', border: `1px solid ${active ? color : '#1e293b'}`,
        background: active ? color + '22' : 'transparent',
        color: active ? color : '#475569',
        cursor: 'pointer', fontSize: '11px', fontWeight: 600,
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = color + '55'; e.currentTarget.style.color = color + 'aa'; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.color = '#475569'; } }}
    >
      {label}
      <span style={{
        padding: '1px 5px', borderRadius: '8px', fontSize: '10px',
        background: active ? color + '33' : '#ffffff08',
        color: active ? color : '#334155',
      }}>
        {count}
      </span>
    </button>
  );
}

// ─── Row with hover-revealed checkbox ────────────────────────
function RowWithCheckbox({ children, isSelected, isDeleting, onToggle }) {
  const [rowHovered, setRowHovered] = React.useState(false);
  const showCheckbox = rowHovered || isSelected;

  return (
    <tr
      style={{
        borderBottom: '1px solid #1e293b',
        background: isSelected ? '#1e3a5f33' : 'transparent',
        opacity: isDeleting ? 0.4 : 1,
        transition: 'background 0.1s, opacity 0.2s',
      }}
      onMouseEnter={() => setRowHovered(true)}
      onMouseLeave={() => setRowHovered(false)}
    >
      {/* Checkbox cell — visible on hover or when selected */}
      <td style={{ padding: '10px 14px', width: '36px' }} onClick={e => e.stopPropagation()}>
        <div style={{
          opacity: showCheckbox ? 1 : 0,
          transform: showCheckbox ? 'scale(1)' : 'scale(0.7)',
          transition: 'opacity 0.15s, transform 0.15s',
          pointerEvents: showCheckbox ? 'auto' : 'none',
        }}>
          <Checkbox checked={isSelected} onChange={onToggle} />
        </div>
      </td>
      {children}
    </tr>
  );
}

// ─── Table Component ─────────────────────────────────────────
function LeadsTable({ leads, type, subType }) {
  const [selected, setSelected] = useState(new Set());
  const [deletingId, setDeletingId] = useState(null);
  const [filterLLC, setFilterLLC] = useState(false);
  const [filterINC, setFilterINC] = useState(false);
  const dateLabel = DATE_LABELS[type] || 'Date';
  const accentColor = LEAD_TYPES.find(t => t.key === type)?.color || '#3b82f6';

  // Filtered leads
  const filteredLeads = applyFilters(leads, filterLLC, filterINC);

  // Counts for filter chips
  const llcCount = leads.filter(l => LLC_REGEX.test(l.correspondent || '')).length;
  const incCount = leads.filter(l => INC_REGEX.test(l.correspondent || '')).length;
  const bothCount = leads.filter(l => LLC_REGEX.test(l.correspondent || '') || INC_REGEX.test(l.correspondent || '')).length;

  // Reset selection when leads or filters change
  useEffect(() => { setSelected(new Set()); }, [leads, filterLLC, filterINC]);

  const allChecked  = filteredLeads.length > 0 && selected.size === filteredLeads.length;
  const someChecked = selected.size > 0 && selected.size < filteredLeads.length;

  const toggleAll = () => {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(filteredLeads.map(l => l.serial)));
  };

  const toggleOne = (serial) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(serial) ? next.delete(serial) : next.add(serial);
      return next;
    });
  };

  const handleDeleteOne = (serial) => {
    setDeletingId(serial);
    deleteSingleLead(type, subType, serial, () => setDeletingId(null));
  };

  const handleDeleteSelected = () => {
    if (selected.size === 0) return;
    const serials = [...selected];
    deleteMultipleLeads(type, subType, serials, () => setSelected(new Set()));
  };

  if (leads.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '300px', gap: '12px', color: '#475569'
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
          <rect x="9" y="3" width="6" height="4" rx="1"/>
        </svg>
        <span style={{ fontSize: '14px', fontWeight: 500 }}>
          No {subType === 'valid' ? 'valid' : 'missing phone'} leads yet
        </span>
        <span style={{ fontSize: '12px', color: '#334155' }}>
          Scan leads from the extension popup to populate this table
        </span>
      </div>
    );
  }

  return (
    <div>
      {/* ── Filter bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '10px 16px', borderBottom: '1px solid #1e293b',
        background: '#0a1628',
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>
        <span style={{ fontSize: '10px', color: '#475569', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: '4px' }}>
          Filter
        </span>
        <FilterChip
          label="LLC"
          active={filterLLC}
          count={llcCount}
          color="#a78bfa"
          onClick={() => setFilterLLC(v => !v)}
        />
        <FilterChip
          label="INC"
          active={filterINC}
          count={incCount}
          color="#38bdf8"
          onClick={() => setFilterINC(v => !v)}
        />
        {(filterLLC || filterINC) && (
          <>
            <div style={{ width: '1px', height: '16px', background: '#1e293b', margin: '0 4px' }} />
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Showing <strong style={{ color: '#e2e8f0' }}>{filteredLeads.length}</strong> of {leads.length}
            </span>
            <button
              onClick={() => { setFilterLLC(false); setFilterINC(false); }}
              style={{
                marginLeft: 'auto', padding: '3px 9px', borderRadius: '6px',
                border: '1px solid #1e293b', background: 'transparent',
                color: '#64748b', cursor: 'pointer', fontSize: '10px',
              }}
            >
              Clear
            </button>
          </>
        )}
      </div>

      {/* ── Bulk action bar ── */}
      {selected.size > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '8px 16px', background: '#1e293b',
          borderBottom: '1px solid #334155',
        }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            <strong style={{ color: '#e2e8f0' }}>{selected.size}</strong> selected
          </span>
          <button
            onClick={handleDeleteSelected}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '4px 12px', borderRadius: '6px', border: 'none',
              background: '#ef444422', color: '#ef4444', cursor: 'pointer',
              fontSize: '11px', fontWeight: 600,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#ef444433'}
            onMouseLeave={e => e.currentTarget.style.background = '#ef444422'}
          >
            <TrashIcon size={12} />
            Delete {selected.size === filteredLeads.length ? 'All' : 'Selected'}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            style={{
              padding: '4px 10px', borderRadius: '6px', border: '1px solid #334155',
              background: 'transparent', color: '#64748b', cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            Cancel
          </button>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%', borderCollapse: 'collapse', fontSize: '12px',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
        }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${accentColor}33` }}>
              {/* Checkbox header — always visible so user knows it exists */}
              <th style={{ padding: '10px 14px', width: '36px' }}>
                <div style={{
                  opacity: someChecked || allChecked ? 1 : 0.25,
                  transition: 'opacity 0.15s',
                }}>
                  <Checkbox
                    checked={allChecked}
                    indeterminate={someChecked}
                    onChange={toggleAll}
                  />
                </div>
              </th>
              {['#', 'Serial', 'Mark', dateLabel, 'Correspondent', 'Phone', 'Email', ''].map(h => (
                <th key={h} style={{
                  padding: '10px 14px', textAlign: 'left', color: '#64748b',
                  fontWeight: 600, fontSize: '10px', letterSpacing: '0.08em',
                  textTransform: 'uppercase', whiteSpace: 'nowrap'
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>
                  No leads match the selected filter
                </td>
              </tr>
            ) : filteredLeads.map((lead, i) => {
              const isSelected = selected.has(lead.serial);
              const isDeleting = deletingId === lead.serial;
              return (
                <RowWithCheckbox
                  key={`${lead.serial}-${i}`}
                  isSelected={isSelected}
                  isDeleting={isDeleting}
                  onToggle={() => toggleOne(lead.serial)}
                >

                  <td style={{ padding: '10px 14px', color: '#334155', fontSize: '11px' }}>
                    {i + 1}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <a
                      href={`https://tsdr.uspto.gov/#caseNumber=${lead.serial}&caseType=SERIAL_NO&searchType=statusSearch`}
                      target="_blank" rel="noreferrer"
                      style={{ color: accentColor, textDecoration: 'none', fontWeight: 600 }}
                      onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                      onMouseLeave={e => e.target.style.textDecoration = 'none'}
                    >
                      {lead.serial}
                    </a>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#e2e8f0', maxWidth: '200px' }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lead.mark}
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {lead.leadDate}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#cbd5e1', maxWidth: '180px' }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {(filterLLC || filterINC)
                        ? lead.correspondent?.replace(
                            /(llc|l\.l\.c\.?|inc|i\.n\.c\.?)/gi,
                            m => `<mark style="background:#7c3aed33;color:#a78bfa;border-radius:2px;padding:0 2px">${m}</mark>`
                          )
                          ? <span dangerouslySetInnerHTML={{
                              __html: lead.correspondent.replace(
                                /(llc|l\.l\.c\.?|inc|i\.n\.c\.?)/gi,
                                m => `<mark style="background:#7c3aed33;color:#a78bfa;border-radius:2px;padding:0 2px">${m}</mark>`
                              )
                            }} />
                          : lead.correspondent
                        : lead.correspondent}
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                    {lead.phone ? (
                      <a href={`tel:${lead.phone}`} style={{ color: '#4ade80', textDecoration: 'none' }}>
                        {lead.phone}
                      </a>
                    ) : (
                      <span style={{ color: '#ef4444', fontSize: '11px' }}>MISSING</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px', maxWidth: '200px' }}>
                    {lead.email && lead.email !== 'N/A' ? (
                      <a href={`mailto:${lead.email}`}
                        style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '11px' }}>
                        {lead.email}
                      </a>
                    ) : (
                      <span style={{ color: '#475569', fontSize: '11px' }}>N/A</span>
                    )}
                  </td>

                  {/* Delete button */}
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleDeleteOne(lead.serial)}
                      disabled={isDeleting}
                      title="Delete lead"
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '26px', height: '26px', borderRadius: '6px',
                        border: '1px solid #1e293b', background: 'transparent',
                        color: '#475569', cursor: isDeleting ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = '#ef444422';
                        e.currentTarget.style.color = '#ef4444';
                        e.currentTarget.style.borderColor = '#ef444444';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#475569';
                        e.currentTarget.style.borderColor = '#1e293b';
                      }}
                    >
                      <TrashIcon size={13} />
                    </button>
                  </td>
                </RowWithCheckbox>
              );
            })}
          </tbody>

        </table>
      </div>
    </div>
  );
}

// ─── Lead Type View ───────────────────────────────────────────
function LeadTypeView({ typeKey }) {
  const [subTab, setSubTab] = useState('valid');
  const { leads, allCounts } = useLeadData(typeKey, subTab);
  const typeInfo = LEAD_TYPES.find(t => t.key === typeKey);
  const counts = allCounts[typeKey] || { valid: 0, missing: 0 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '20px 24px 0', borderBottom: '1px solid #1e293b', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: typeInfo?.color, boxShadow: `0 0 8px ${typeInfo?.color}`
          }} />
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
            {typeInfo?.label}
          </h2>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
            <span style={{
              fontSize: '11px', padding: '3px 10px', borderRadius: '20px',
              background: '#16a34a22', color: '#4ade80', border: '1px solid #16a34a44'
            }}>✅ {counts.valid} valid</span>
            <span style={{
              fontSize: '11px', padding: '3px 10px', borderRadius: '20px',
              background: '#d9770622', color: '#fbbf24', border: '1px solid #d9770644'
            }}>⚠️ {counts.missing} missing</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0' }}>
          {[
            { key: 'valid',   label: 'Valid Leads',  count: counts.valid   },
            { key: 'missing', label: 'Missing Phone', count: counts.missing },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSubTab(tab.key)}
              style={{
                padding: '8px 18px', border: 'none', cursor: 'pointer',
                fontSize: '12px', fontWeight: 600, transition: 'all 0.15s',
                borderBottom: subTab === tab.key
                  ? `2px solid ${tab.key === 'valid' ? '#4ade80' : '#fbbf24'}`
                  : '2px solid transparent',
                color: subTab === tab.key
                  ? (tab.key === 'valid' ? '#4ade80' : '#fbbf24')
                  : '#475569',
                background: 'transparent',
              }}
            >
              {tab.label}
              <span style={{
                marginLeft: '6px', fontSize: '10px', padding: '1px 6px',
                borderRadius: '10px',
                background: subTab === tab.key ? '#ffffff15' : '#ffffff08',
                color: subTab === tab.key ? '#e2e8f0' : '#475569',
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <LeadsTable leads={leads} type={typeKey} subType={subTab} />
      </div>
    </div>
  );
}

// ─── Overview ─────────────────────────────────────────────────
function Overview({ allCounts, navigate }) {
  return (
    <div style={{ padding: '32px' }}>
      <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
        Leads Overview
      </h2>
      <p style={{ margin: '0 0 28px', color: '#475569', fontSize: '13px' }}>
        Real-time summary across all trademark lead types
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
        {LEAD_TYPES.map(type => {
          const c = allCounts[type.key] || { valid: 0, missing: 0 };
          return (
            <div
              key={type.key}
              onClick={() => navigate(`/dashboard/${type.key}/valid`)}
              style={{
                background: '#0f172a', border: `1px solid ${type.color}33`,
                borderRadius: '12px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = type.color + '88'; e.currentTarget.style.background = '#111827'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = type.color + '33'; e.currentTarget.style.background = '#0f172a'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: type.color + '22', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: type.color, fontSize: '10px', fontWeight: 800,
                }}>
                  {type.badge}
                </div>
                <span style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '14px' }}>{type.label}</span>
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#4ade80', lineHeight: 1 }}>{c.valid}</div>
                  <div style={{ fontSize: '10px', color: '#475569', marginTop: '3px' }}>Valid</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#fbbf24', lineHeight: 1 }}>{c.missing}</div>
                  <div style={{ fontSize: '10px', color: '#475569', marginTop: '3px' }}>Missing</div>
                </div>
                <div style={{ marginLeft: 'auto', alignSelf: 'flex-end' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: type.color, lineHeight: 1 }}>{c.valid + c.missing}</div>
                  <div style={{ fontSize: '10px', color: '#475569', marginTop: '3px' }}>Total</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────
function Sidebar({ allCounts }) {
  const location = useLocation();
  return (
    <div style={{
      width: '220px', flexShrink: 0, background: '#070d15',
      borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0
    }}>
      <div style={{ padding: '18px 16px', borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
              <path d="M9 12h6M9 16h4"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9', lineHeight: 1 }}>TM Leads</div>
            <div style={{ fontSize: '9px', color: '#475569', marginTop: '2px' }}>Dashboard</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        <NavLink to="/dashboard" end style={({ isActive }) => ({
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 10px', borderRadius: '8px', marginBottom: '4px',
          textDecoration: 'none', fontSize: '12px', fontWeight: 500,
          background: isActive ? '#1e293b' : 'transparent',
          color: isActive ? '#e2e8f0' : '#475569', transition: 'all 0.15s',
        })}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
          Overview
        </NavLink>

        <div style={{ margin: '8px 4px', borderTop: '1px solid #1e293b' }} />
        <div style={{ fontSize: '9px', color: '#334155', padding: '0 10px 6px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Lead Types
        </div>

        {LEAD_TYPES.map(type => {
          const c = allCounts[type.key] || { valid: 0, missing: 0 };
          const isActive = location.pathname.includes(`/dashboard/${type.key}`);
          return (
            <div key={type.key} style={{ marginBottom: '2px' }}>
              <NavLink to={`/dashboard/${type.key}/valid`} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 10px', borderRadius: '8px',
                textDecoration: 'none', fontSize: '12px', fontWeight: 500,
                background: isActive ? type.color + '18' : 'transparent',
                color: isActive ? type.color : '#475569', transition: 'all 0.15s',
                border: isActive ? `1px solid ${type.color}33` : '1px solid transparent',
              }}>
                <div style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: type.color, flexShrink: 0,
                  boxShadow: isActive ? `0 0 6px ${type.color}` : 'none'
                }} />
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {type.label}
                </span>
                <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '8px', background: '#ffffff0a', color: '#475569' }}>
                  {c.valid + c.missing}
                </span>
              </NavLink>
            </div>
          );
        })}
      </nav>

      <div style={{ padding: '12px 16px', borderTop: '1px solid #1e293b' }}>
        <div style={{ fontSize: '10px', color: '#334155' }}>Live sync enabled</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: '10px', color: '#4ade80' }}>Connected to storage</span>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Root ───────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const { allCounts } = useLeadData(null, null);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#020817', color: '#e2e8f0', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>
      <Sidebar allCounts={allCounts} />
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        <Routes>
          <Route index element={<Overview allCounts={allCounts} navigate={navigate} />} />
          {LEAD_TYPES.map(type => (
            <Route key={type.key} path={`${type.key}/:subTab`} element={<LeadTypeView typeKey={type.key} />} />
          ))}
        </Routes>
      </main>
    </div>
  );
};

export default Dashboard;