// src/Components/OverView.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LEAD_TYPES } from '../hooks/useLeadData.js';
import { useDashboard } from '../context/DashboardContext.jsx';

const ROUTE_OF = {
  deadAbandoned: 'deadabandoned',
  deadCancelled: 'deadcancelled',
  livePending: 'livepending',
  liveRegister: 'liveregister',
};

const OverView = () => {
  const navigate = useNavigate();
  const { allCounts } = useDashboard();

  return (
    <div style={{ padding: '32px' }}>
      <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
        Leads Overview
      </h2>
      <p style={{ margin: '0 0 28px', color: '#475569', fontSize: '13px' }}>
        Real-time summary across all trademark lead types
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
        {LEAD_TYPES.map((type) => {
          const c = allCounts[type.key] || { valid: 0, missing: 0 };
          return (
            <div
              key={type.key}
              onClick={() => navigate(`/${ROUTE_OF[type.key]}`)}
              style={{
                background: '#0f172a',
                border: `1px solid ${type.color}33`,
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = type.color + '88';
                e.currentTarget.style.background = '#111827';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = type.color + '33';
                e.currentTarget.style.background = '#0f172a';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: type.color + '22',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: type.color,
                    fontSize: '10px',
                    fontWeight: 800,
                  }}
                >
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
                  <div style={{ fontSize: '20px', fontWeight: 800, color: type.color, lineHeight: 1 }}>
                    {c.valid + c.missing}
                  </div>
                  <div style={{ fontSize: '10px', color: '#475569', marginTop: '3px' }}>Total</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OverView;
