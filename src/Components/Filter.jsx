// src/Components/Filter.jsx
import React from 'react';
import { TrashIcon } from './icons.jsx';

export const LLC_REGEX = /\bllc\b|l\.l\.c\.?/i;
export const INC_REGEX = /\binc\b|i\.n\.c\.?/i;

// Used only for highlighting (display), not filtering — no word boundaries needed here
export const LLC_INC_DISPLAY_REGEX = /llc|l\.l\.c\.?|inc|i\.n\.c\.?/i;

// Wraps regex matches in a styled <mark>. `input` can be a plain string OR an
// already-highlighted array (output of a previous highlight() call) — this lets
// you layer multiple highlights (e.g. LLC/INC color + search-query color) on the
// same cell without one wiping out the other. Only untouched string segments
// get scanned for the next pattern.
export function highlight(input, pattern, { bg = '#3b82f633', color = '#60a5fa' } = {}) {
  const parts = Array.isArray(input) ? input : [input == null ? '' : String(input)];
  if (!pattern) return parts;
  const re = new RegExp(`(${pattern.source})`, pattern.flags.includes('i') ? 'gi' : 'g');
  const out = [];
  parts.forEach((part, i) => {
    if (typeof part !== 'string' || !part) {
      out.push(part);
      return;
    }
    part.split(re).forEach((seg, j) => {
      if (!seg) return;
      if (j % 2 === 1) {
        out.push(
          <mark key={`${i}-${j}`} style={{ background: bg, color, borderRadius: '2px', padding: '0 1px' }}>
            {seg}
          </mark>
        );
      } else {
        out.push(seg);
      }
    });
  });
  return out;
}

// Builds a safe case-insensitive regex from raw search text (escapes regex metacharacters
// so symbols typed by the user, e.g. "(", don't break the match)
export function searchRegex(query) {
  if (!query) return null;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(escaped, 'i');
}

// Parse "Jan. 15, 2024" or "January 15, 2024" to Date object
function parseLeadDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

// Special search syntax: "email=null" / "phone=null" (case-insensitive,
// spaces ignore) — yeh normal text-match nahi karta, balki sirf un leads
// ko dikhata hai jin ka woh field empty/N/A ho. Aage chal kar koi naya
// "<field>=null" support karna ho to bas FIELD_NULL_MAP mein add kar dein.
const FIELD_NULL_MAP = {
  email: (l) => !l.email || l.email === 'N/A',
  phone: (l) => !l.phone || l.phone === 'N/A',
};

function parseNullFieldQuery(query) {
  const match = query.trim().match(/^(\w+)\s*=\s*null$/i);
  if (!match) return null;
  const field = match[1].toLowerCase();
  return FIELD_NULL_MAP[field] ? field : null;
}

export function applyFilters(leads, filterLLC, filterINC, searchQuery, dateFrom, dateTo) {
  const nullField = searchQuery ? parseNullFieldQuery(searchQuery) : null;

  return leads.filter((l) => {
    const c = l.correspondent || '';
    if (filterLLC && filterINC) {
      if (!(LLC_REGEX.test(c) || INC_REGEX.test(c))) return false;
    } else if (filterLLC) {
      if (!LLC_REGEX.test(c)) return false;
    } else if (filterINC) {
      if (!INC_REGEX.test(c)) return false;
    }

    if (nullField) {
      // "email=null" / "phone=null" jaisa special syntax mila —
      // sirf empty/N/A wale leads pass hote hain, baqi sab hat jate hain.
      if (!FIELD_NULL_MAP[nullField](l)) return false;
    } else if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const haystack = [l.serial, l.mark, l.correspondent, l.phone, l.email, l.leadDate].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    if (dateFrom || dateTo) {
      const ld = parseLeadDate(l.leadDate);
      if (!ld) return false;
      if (dateFrom && ld < new Date(dateFrom)) return false;
      if (dateTo && ld > new Date(dateTo + 'T23:59:59')) return false;
    }

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

const dateInputStyle = {
  padding: '4px 8px',
  borderRadius: '6px',
  border: '1px solid #1e293b',
  background: '#0f172a',
  color: '#94a3b8',
  fontSize: '11px',
  cursor: 'pointer',
  outline: 'none',
  fontFamily: 'inherit',
  colorScheme: 'dark', // tells the browser to render the native calendar popup in dark mode
  accentColor: '#3b82f6', // selected-date highlight matches the dashboard's blue accent
};

// LLC/INC chips + date range + search — sab ek hi line mein, shows match count + Clear
export function FilterBar({
  leads,
  filterLLC,
  setFilterLLC,
  filterINC,
  setFilterINC,
  searchQuery,
  setSearchQuery,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  filteredCount,
}) {
  const llcCount = leads.filter((l) => LLC_REGEX.test(l.correspondent || '')).length;
  const incCount = leads.filter((l) => INC_REGEX.test(l.correspondent || '')).length;

  const clearDateFilter = () => {
    setDateFrom('');
    setDateTo('');
  };

  const anyActive = filterLLC || filterINC || dateFrom || dateTo || searchQuery;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 16px',
        borderBottom: '1px solid #1e293b',
        background: '#0a1628',
        flexWrap: 'nowrap',
        overflowX: 'auto',
      }}
    >
      {/* Type filter label + chips */}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" style={{ flexShrink: 0 }}>
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
      </svg>
      <span
        style={{
          fontSize: '10px',
          color: '#475569',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          flexShrink: 0,
        }}
      >
        Filter
      </span>
      <FilterChip label="LLC" active={filterLLC} count={llcCount} color="#a78bfa" onClick={() => setFilterLLC((v) => !v)} />
      <FilterChip label="INC" active={filterINC} count={incCount} color="#38bdf8" onClick={() => setFilterINC((v) => !v)} />

      {/* Divider */}
      <div style={{ width: '1px', height: '18px', background: '#1e293b', margin: '0 2px', flexShrink: 0 }} />

      {/* Date range */}
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" style={{ flexShrink: 0 }}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
      <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} title="From date" style={dateInputStyle} />
      <span style={{ color: '#334155', fontSize: '11px', flexShrink: 0 }}>→</span>
      <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} title="To date" style={dateInputStyle} />
      {(dateFrom || dateTo) && (
        <button
          onClick={clearDateFilter}
          style={{
            padding: '2px 8px',
            borderRadius: '5px',
            border: '1px solid #1e293b',
            background: 'transparent',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: '10px',
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      )}

      {/* Divider */}
      <div style={{ width: '1px', height: '18px', background: '#1e293b', margin: '0 2px', flexShrink: 0 }} />

      {/* Search - takes remaining space, pushed to the right */}
      <div style={{ position: 'relative', flex: 1, minWidth: '110px', maxWidth: '280px', marginLeft: 'auto' }}>
        <svg
          style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#475569"
          strokeWidth="2.5"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '5px 26px 5px 26px',
            background: '#0f172a',
            border: `1px solid ${searchQuery ? '#3b82f6' : '#1e293b'}`,
            borderRadius: '6px',
            color: '#e2e8f0',
            fontSize: '11px',
            outline: 'none',
            fontFamily: 'inherit',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
          onBlur={(e) => (e.target.style.borderColor = searchQuery ? '#3b82f6' : '#1e293b')}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute',
              right: '6px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: '#475569',
              cursor: 'pointer',
              fontSize: '13px',
              lineHeight: 1,
              padding: '0',
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Match count — search/date/LLC/INC sab ke liye combined */}
      {anyActive && (
        <span style={{ fontSize: '10px', color: '#64748b', flexShrink: 0 }}>
          <strong style={{ color: '#e2e8f0' }}>{filteredCount}</strong>/{leads.length}
        </span>
      )}

      {/* Clear all active filters — chip, date, search sab ek saath reset */}
      {anyActive && (
        <button
          onClick={() => {
            setFilterLLC(false);
            setFilterINC(false);
            clearDateFilter();
            setSearchQuery('');
          }}
          style={{
            padding: '2px 9px',
            borderRadius: '6px',
            flexShrink: 0,
            border: '1px solid #1e293b',
            background: 'transparent',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: '10px',
          }}
        >
          Clear
        </button>
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