// src/Components/LeadsTable.jsx
import React, { useState, useEffect } from 'react';
import { LEAD_TYPES, DATE_LABELS, deleteSingleLead, deleteMultipleLeads } from '../hooks/useLeadData.js';
import { TrashIcon, Checkbox } from './icons.jsx';
import { FilterBar, BulkActionBar, applyFilters, highlight, searchRegex, LLC_INC_DISPLAY_REGEX } from './Filter.jsx';
import { useDashboard } from '../context/DashboardContext.jsx';

export { TrashIcon, Checkbox } from './icons.jsx';

// Row wrapper that reveals the checkbox on hover or when selected
function RowWithCheckbox({ children, isSelected, isDeleting, isClicked, accentColor, onToggle }) {
  const [rowHovered, setRowHovered] = useState(false);
  const showCheckbox = rowHovered || isSelected;

  return (
    <tr
      style={{
        borderBottom: '1px solid #1e293b',
        borderLeft: isClicked ? `3px solid ${accentColor}` : '3px solid transparent',
        background: isSelected ? '#1e3a5f33' : 'transparent',
        opacity: isDeleting ? 0.4 : 1,
        transition: 'background 0.1s, opacity 0.2s, border-left-color 0.2s',
      }}
      onMouseEnter={() => setRowHovered(true)}
      onMouseLeave={() => setRowHovered(false)}
    >
      <td style={{ padding: '10px 14px', width: '36px' }} onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            opacity: showCheckbox ? 1 : 0,
            transform: showCheckbox ? 'scale(1)' : 'scale(0.7)',
            transition: 'opacity 0.15s, transform 0.15s',
            pointerEvents: showCheckbox ? 'auto' : 'none',
          }}
        >
          <Checkbox checked={isSelected} onChange={onToggle} />
        </div>
      </td>
      {children}
    </tr>
  );
}

const COLUMNS = ['#', 'Serial', 'Mark', 'Date', 'Correspondent', 'Phone', 'Email', ''];

// Highlights search-query matches in blue — used on Serial, Mark, Date, Phone, Email
function searchHighlight(text, searchQuery) {
  return searchQuery ? highlight(text, searchRegex(searchQuery), { bg: '#3b82f633', color: '#60a5fa' }) : text;
}

// Correspondent column needs BOTH highlights layered: LLC/INC (violet) first,
// then search-query (blue) scanned only over what LLC/INC left untouched —
// so typing a search term still highlights even inside an LLC/INC match.
function correspondentHighlight(text, filterLLC, filterINC, searchQuery) {
  let content = text;
  if (filterLLC || filterINC) {
    content = highlight(content, LLC_INC_DISPLAY_REGEX, { bg: '#7c3aed33', color: '#a78bfa' });
  }
  if (searchQuery) {
    content = highlight(content, searchRegex(searchQuery), { bg: '#3b82f633', color: '#60a5fa' });
  }
  return content;
}

// type: lead type key (e.g. 'deadAbandoned')
// subType: 'valid' | 'missing'
// leads: array passed down from the page component (already fetched via useLeadData)
export default function LeadsTable({ leads, type, subType }) {
  const [selected, setSelected] = useState(new Set());
  const [deletingId, setDeletingId] = useState(null);
  const [filterLLC, setFilterLLC] = useState(false);
  const [filterINC, setFilterINC] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  // Click hue lead ke serials ab Dashboard-level Context se aate hain — taake
  // Valid/Missing tab switch karne par yeh persist rahe, lekin full page
  // reload par naturally reset ho jaye (Context bhi sirf in-memory hai).
  const { clickedSerials, markClicked } = useDashboard();

  const dateLabel = DATE_LABELS[type] || 'Date';
  const accentColor = LEAD_TYPES.find((t) => t.key === type)?.color || '#3b82f6';

  const filteredLeads = applyFilters(leads, filterLLC, filterINC, searchQuery, dateFrom, dateTo);

  useEffect(() => {
    setSelected(new Set());
  }, [leads, filterLLC, filterINC, searchQuery, dateFrom, dateTo]);

  const allChecked = filteredLeads.length > 0 && selected.size === filteredLeads.length;
  const someChecked = selected.size > 0 && selected.size < filteredLeads.length;

  const toggleAll = () => {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(filteredLeads.map((l) => l.serial)));
  };

  const toggleOne = (serial) => {
    setSelected((prev) => {
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
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '300px',
          gap: '12px',
          color: '#475569',
        }}
      >
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
        </svg>
        <span style={{ fontSize: '14px', fontWeight: 500 }}>
          No {subType === 'valid' ? 'valid' : 'missing phone'} leads yet
        </span>
  
      </div>
    );
  }

  return (
    <div>
      <FilterBar
        leads={leads}
        filterLLC={filterLLC}
        setFilterLLC={setFilterLLC}
        filterINC={filterINC}
        setFilterINC={setFilterINC}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        filteredCount={filteredLeads.length}
      />

      <BulkActionBar
        selectedCount={selected.size}
        totalFiltered={filteredLeads.length}
        onDelete={handleDeleteSelected}
        onCancel={() => setSelected(new Set())}
      />

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12px',
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          }}
        >
          <thead>
            <tr style={{ borderBottom: `2px solid ${accentColor}33` }}>
              <th style={{ padding: '10px 14px', width: '36px' }}>
                <div style={{ opacity: someChecked || allChecked ? 1 : 0.25, transition: 'opacity 0.15s' }}>
                  <Checkbox checked={allChecked} indeterminate={someChecked} onChange={toggleAll} />
                </div>
              </th>
              {COLUMNS.map((h, i) => (
                <th
                  key={i}
                  style={{
                    padding: '10px 14px',
                    textAlign: 'left',
                    color: '#475569',
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  {h === 'Date' ? dateLabel : h}
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
            ) : (
              filteredLeads.map((lead, i) => {
                const isSelected = selected.has(lead.serial);
                const isDeleting = deletingId === lead.serial;
                const isClicked = clickedSerials.has(lead.serial);
                return (
                  <RowWithCheckbox
                    key={`${lead.serial}-${i}`}
                    isSelected={isSelected}
                    isDeleting={isDeleting}
                    isClicked={isClicked}
                    accentColor={accentColor}
                    onToggle={() => toggleOne(lead.serial)}
                  >
                    <td style={{ padding: '10px 14px', color: '#334155', fontSize: '11px' }}>{i + 1}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <a
                        href={`https://tsdr.uspto.gov/#caseNumber=${lead.serial}&caseType=SERIAL_NO&searchType=documentSearch`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => markClicked(lead.serial)}
                        style={{ color: accentColor, textDecoration: 'none', fontWeight: 600 }}
                        onMouseEnter={(e) => (e.target.style.textDecoration = 'underline')}
                        onMouseLeave={(e) => (e.target.style.textDecoration = 'none')}
                      >
                        {searchHighlight(lead.serial, searchQuery)}
                      </a>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#e2e8f0', maxWidth: '200px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{searchHighlight(lead.mark, searchQuery)}</div>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{searchHighlight(lead.leadDate, searchQuery)}</td>
                    <td style={{ padding: '10px 14px', color: '#cbd5e1', maxWidth: '180px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {correspondentHighlight(lead.correspondent, filterLLC, filterINC, searchQuery)}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      {lead.phone ? (
                        <a href={`tel:${lead.phone}`} style={{ color: '#4ade80', textDecoration: 'none' }}>
                          {searchHighlight(lead.phone, searchQuery)}
                        </a>
                      ) : (
                        <span style={{ color: '#ef4444', fontSize: '11px' }}>MISSING</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', maxWidth: '200px' }}>
                      {lead.email && lead.email !== 'N/A' ? (
                        <a href={`mailto:${lead.email}`} style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '11px' }}>
                          {searchHighlight(lead.email, searchQuery)}
                        </a>
                      ) : (
                        <span style={{ color: '#475569', fontSize: '11px' }}>N/A</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleDeleteOne(lead.serial)}
                        disabled={isDeleting}
                        title="Delete lead"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '26px',
                          height: '26px',
                          borderRadius: '6px',
                          border: '1px solid #1e293b',
                          background: 'transparent',
                          color: '#475569',
                          cursor: isDeleting ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#ef444422';
                          e.currentTarget.style.color = '#ef4444';
                          e.currentTarget.style.borderColor = '#ef444444';
                        }}
                        onMouseLeave={(e) => {
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
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}