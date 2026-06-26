// src/Layout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Components/Sidebar.jsx';
import { DashboardProvider } from './context/DashboardContext.jsx';

const Layout = () => {
  return (
    <DashboardProvider>
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          background: '#020817',
          color: '#e2e8f0',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          * { box-sizing: border-box; }
          ::-webkit-scrollbar { width: 4px; height: 4px; }
          ::-webkit-scrollbar-track { background: #0f172a; }
          ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        `}</style>
        <Sidebar />
        <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
          <Outlet />
        </main>
      </div>
    </DashboardProvider>
  );
};

export default Layout;
