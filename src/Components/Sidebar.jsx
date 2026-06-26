// src/Components/Sidebar.jsx
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LEAD_TYPES } from '../hooks/useLeadData.js';
import { useDashboard } from '../context/DashboardContext.jsx';
import logo from "../assets/icon128.png"

const STATUS_INFO = {
  connected:    { label: 'Connected to extension', color: '#4ade80' },
  connecting:   { label: 'Connecting...',           color: '#fbbf24' },
  disconnected: { label: 'Extension not found',     color: '#ef4444' },
  unsupported:  { label: 'Open in Chrome to sync',  color: '#ef4444' },
};

const Sidebar = () => {
  const location = useLocation();
  const { allCounts, status } = useDashboard();
  const statusInfo = STATUS_INFO[status] || STATUS_INFO.connecting;

  return (
    <div
      style={{
        width: '220px',
        flexShrink: 0,
        background: '#070d15',
        borderRight: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
      }}
    >
      <div style={{ padding: '18px 16px', borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '35px',
              height: '35px',
              // background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              borderRadius: '7px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img src={logo} alt="Logo" />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9', lineHeight: 1 }}>USPTO Leads</div>
            <div style={{ fontSize: '9px', color: '#475569', marginTop: '2px' }}>Dashboard</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        <NavLink
          to="/"
          end
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 10px',
            borderRadius: '8px',
            marginBottom: '4px',
            textDecoration: 'none',
            fontSize: '12px',
            fontWeight: 500,
            background: isActive ? '#1e293b' : 'transparent',
            color: isActive ? '#e2e8f0' : '#475569',
            transition: 'all 0.15s',
          })}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          Overview
        </NavLink>

        <div style={{ margin: '8px 4px', borderTop: '1px solid #1e293b' }} />
        <div
          style={{
            fontSize: '9px',
            color: '#334155',
            padding: '0 10px 6px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Lead Types
        </div>

        {LEAD_TYPES.map((type) => {
          const c = allCounts[type.key] || { valid: 0, missing: 0 };
          const isActive = location.pathname.startsWith(`/${routeOf(type.key)}`);
          return (
            <div key={type.key} style={{ marginBottom: '2px' }}>
              <NavLink
                to={`/${routeOf(type.key)}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '12px',
                  fontWeight: 500,
                  background: isActive ? type.color + '18' : 'transparent',
                  color: isActive ? type.color : '#475569',
                  transition: 'all 0.15s',
                  border: isActive ? `1px solid ${type.color}33` : '1px solid transparent',
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: type.color,
                    flexShrink: 0,
                    boxShadow: isActive ? `0 0 6px ${type.color}` : 'none',
                  }}
                />
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {type.label}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 5px',
                    borderRadius: '8px',
                    background: '#ffffff0a',
                    color: '#475569',
                  }}
                >
                  {c.valid + c.missing}
                </span>
              </NavLink>
            </div>
          );
        })}
      </nav>

      <div style={{ padding: '12px 16px', borderTop: '1px solid #1e293b' }}>
        <div style={{ fontSize: '10px', color: '#334155' }}>Live sync via extension</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: statusInfo.color,
              animation: status === 'connected' ? 'pulse 2s infinite' : 'none',
            }}
          />
          <span style={{ fontSize: '10px', color: statusInfo.color }}>{statusInfo.label}</span>
        </div>
      </div>
    </div>
  );
};

// route slugs match App.jsx paths
function routeOf(typeKey) {
  const map = {
    deadAbandoned: 'deadabandoned',
    deadCancelled: 'deadcancelled',
    livePending: 'livepending',
    liveRegister: 'liveregister',
  };
  return map[typeKey];
}

export default Sidebar;
