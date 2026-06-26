// src/Components/Filter.jsx
import React from 'react';
import { TrashIcon } from './icons.jsx';

export const LLC_REGEX = /\bllc\b|l\.l\.c\.?/i;
export const INC_REGEX = /\binc\b|i\.n\.c\.?/i;

export function applyFilters(leads, filterLLC, filterINC) {
  return leads.filter((l) => {
    const c = l.correspondent || '';
    if (filterLLC && filterINC) return LLC_REGEX.test(c) || INC_REGEX.test(c);
    if (filterLLC) return LLC_REGEX.test(c);
    if (filterINC) return INC_REGEX.test(c);
    return true;
  });
}

export function FilterChip({ label, active, count, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '4px 11px',
        borderRadius: '20px',
        border: `1px solid ${active ? color : '#1e293b'}`,
        background: active ? color + '22' : 'transparent',
        color: active ? color : '#475569',
        cursor: 'pointer',
        fontSize: '11px',
        fontWeight: 600,
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = color + '55';
          e.currentTarget.style.color = color + 'aa';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = '#1e293b';
          e.currentTarget.style.color = '#475569';
        }
      }}
    >
      {label}
      <span
        style={{
          padding: '1px 5px',
          borderRadius: '8px',
          fontSize: '10px',
          background: active ? color + '33' : '#ffffff08',
          color: active ? color : '#334155',
        }}
      >
        {count}
      </span>
    </button>
  );
}

// LLC / INC toggle row, shows match counts and a "Clear" button
export function FilterBar({ leads, filterLLC, setFilterLLC, filterINC, setFilterINC, filteredCount }) {
  const llcCount = leads.filter((l) => LLC_REGEX.test(l.correspondent || '')).length;
  const incCount = leads.filter((l) => INC_REGEX.test(l.correspondent || '')).length;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        borderBottom: '1px solid #1e293b',
        background: '#0a1628',
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
      </svg>
      <span
        style={{
          fontSize: '10px',
          color: '#475569',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginRight: '4px',
        }}
      >
        Filter
      </span>
      <FilterChip label="LLC" active={filterLLC} count={llcCount} color="#a78bfa" onClick={() => setFilterLLC((v) => !v)} />
      <FilterChip label="INC" active={filterINC} count={incCount} color="#38bdf8" onClick={() => setFilterINC((v) => !v)} />
      {(filterLLC || filterINC) && (
        <>
          <div style={{ width: '1px', height: '16px', background: '#1e293b', margin: '0 4px' }} />
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Showing <strong style={{ color: '#e2e8f0' }}>{filteredCount}</strong> of {leads.length}
          </span>
          <button
            onClick={() => {
              setFilterLLC(false);
              setFilterINC(false);
            }}
            style={{
              marginLeft: 'auto',
              padding: '3px 9px',
              borderRadius: '6px',
              border: '1px solid #1e293b',
              background: 'transparent',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: '10px',
            }}
          >
            Clear
          </button>
        </>
      )}
    </div>
  );
}

// Bulk action bar shown when one or more rows are selected
export function BulkActionBar({ selectedCount, totalFiltered, onDelete, onCancel }) {
  if (selectedCount === 0) return null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 16px',
        background: '#1e293b',
        borderBottom: '1px solid #334155',
      }}
    >
      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
        <strong style={{ color: '#e2e8f0' }}>{selectedCount}</strong> selected
      </span>
      <button
        onClick={onDelete}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 12px',
          borderRadius: '6px',
          border: 'none',
          background: '#ef444422',
          color: '#ef4444',
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: 600,
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#ef444433')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#ef444422')}
      >
        <TrashIcon size={12} />
        Delete {selectedCount === totalFiltered ? 'All' : 'Selected'}
      </button>
      <button
        onClick={onCancel}
        style={{
          padding: '4px 10px',
          borderRadius: '6px',
          border: '1px solid #334155',
          background: 'transparent',
          color: '#64748b',
          cursor: 'pointer',
          fontSize: '11px',
        }}
      >
        Cancel
      </button>
    </div>
  );
}
