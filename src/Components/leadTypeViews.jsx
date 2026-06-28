// src/Components/leadTypeViews.jsx
//
// Dashboard.jsx mein "LeadTypeView" ek hi component tha jo type ke hisaab se
// reuse hota tha. Yahan hum usi logic ko ek factory bana ke 4 baar duplicate
// karne se bachte hain — har named file (DeadAbandoned.jsx, DeadAbanValid.jsx,
// DeadAbanMissing.jsx, ...) sirf 3 lines ka thin wrapper hai jo yahan se
// component banwata hai. Look & feel Dashboard.jsx se 100% match karta hai.

import React, { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useDashboard } from '../context/DashboardContext.jsx';
import { useLeadData, LEAD_TYPES } from '../hooks/useLeadData.js';
import LeadsTable from './LeadsTable.jsx';

const ROUTE_OF = {
  deadAbandoned: 'deadabandoned',
  deadCancelled: 'deadcancelled',
  livePending: 'livepending',
  liveRegister: 'liveregister',
};

// Sidebar ki width — agar aapka actual Sidebar component isse different
// width use karta hai to yahan update kar dein, fixed header isi se align hota hai.
const SIDEBAR_WIDTH = '220px';

// ── Parent wrapper: header + Valid/Missing tabs + <Outlet/> ──────────────
export function createTypeWrapper(typeKey) {
  const TypeWrapper = () => {
    const { allCounts } = useDashboard();
    const location = useLocation();
    const typeInfo = LEAD_TYPES.find((t) => t.key === typeKey);
    const counts = allCounts[typeKey] || { valid: 0, missing: 0 };
    const base = `/${ROUTE_OF[typeKey]}`;
    const isMissing = location.pathname.endsWith('/missing');

    // Header ki real height measure karte hain taake neeche wala content
    // (Outlet) usi amount se push ho jaye, aur LeadsTable ki sticky filter
    // bar bhi isi height par stick ho sake.
    const headerRef = useRef(null);
    useEffect(() => {
      const el = headerRef.current;
      if (!el) return;
      const updateHeight = () => {
        document.documentElement.style.setProperty('--leadtype-header-h', `${el.offsetHeight}px`);
      };
      updateHeight();
      const ro = new ResizeObserver(updateHeight);
      ro.observe(el);
      return () => ro.disconnect();
    }, [typeKey]);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div
          ref={headerRef}
          style={{
            position: 'fixed',
            top: 0,
            left: SIDEBAR_WIDTH,
            right: 0,
            zIndex: 20,
            padding: '20px 24px 0',
            borderBottom: '1px solid #1e293b',
            flexShrink: 0,
            background: '#020817',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: typeInfo?.color,
                boxShadow: `0 0 8px ${typeInfo?.color}`,
              }}
            />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
              {typeInfo?.label}
            </h2>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
              <span
                style={{
                  fontSize: '11px',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  background: '#16a34a22',
                  color: '#4ade80',
                  border: '1px solid #16a34a44',
                }}
              >
                ✅ {counts.valid} valid
              </span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  background: '#d9770622',
                  color: '#fbbf24',
                  border: '1px solid #d9770644',
                }}
              >
                ⚠️ {counts.missing} missing
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0' }}>
            {[
              { to: base, end: true, label: 'Valid Leads', count: counts.valid, accent: '#4ade80' },
              { to: `${base}/missing`, end: false, label: 'Missing Phone', count: counts.missing, accent: '#fbbf24' },
            ].map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                style={({ isActive }) => ({
                  padding: '8px 18px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  transition: 'all 0.15s',
                  textDecoration: 'none',
                  display: 'inline-block',
                  borderBottom: isActive ? `2px solid ${tab.accent}` : '2px solid transparent',
                  color: isActive ? tab.accent : '#475569',
                  background: 'transparent',
                })}
              >
                {tab.label}
                <span
                  style={{
                    marginLeft: '6px',
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: (tab.end ? !isMissing : isMissing) ? '#ffffff15' : '#ffffff08',
                    color: '#94a3b8',
                  }}
                >
                  {tab.count}
                </span>
              </NavLink>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingTop: 'var(--leadtype-header-h, 0px)' }}>
          <Outlet />
        </div>
      </div>
    );
  };

  return TypeWrapper;
}

// ── Leaf views: just fetch the right slice and hand it to LeadsTable ─────
export function createValidView(typeKey) {
  const ValidView = () => {
    const { leads } = useLeadData(typeKey, 'valid');
    return <LeadsTable leads={leads} type={typeKey} subType="valid" />;
  };
  return ValidView;
}

export function createMissingView(typeKey) {
  const MissingView = () => {
    const { leads } = useLeadData(typeKey, 'missing');
    return <LeadsTable leads={leads} type={typeKey} subType="missing" />;
  };
  return MissingView;
}