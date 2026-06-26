// src/Components/icons.jsx
import React, { useState } from 'react';

export function TrashIcon({ size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}

export function Checkbox({ checked, indeterminate, onChange }) {
  const [hovered, setHovered] = useState(false);
  const active = checked || indeterminate;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onChange && onChange(e);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '15px',
        height: '15px',
        borderRadius: '4px',
        flexShrink: 0,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
          <polyline points="1,3.5 3.5,6 8,1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </div>
  );
}
