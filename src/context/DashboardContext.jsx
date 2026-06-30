// src/context/DashboardContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useLeadData } from '../hooks/useLeadData.js';

const DashboardContext = createContext({
  allCounts: {},
  status: 'connecting',
  clickedSerials: new Set(),
  markClicked: () => {},
});

export function DashboardProvider({ children }) {
  const { allCounts, status } = useLeadData(null, null);

  // Click hue serials ko track karte hain — yeh Provider-level state hai isliye
  // tab switch (NavLink se Valid <-> Missing) karne par bhi yeh persist rehta
  // hai (kyunke Provider unmount nahi hota). Page ko F5/reload karne par yeh
  // naturally khali ho jata hai (sirf in-memory React state hai, koi storage
  // use nahi hota).
  const [clickedSerials, setClickedSerials] = useState(new Set());

  const markClicked = useCallback((serial) => {
    setClickedSerials((prev) => {
      if (prev.has(serial)) return prev;
      const next = new Set(prev);
      next.add(serial);
      return next;
    });
  }, []);

  return (
    <DashboardContext.Provider value={{ allCounts, status, clickedSerials, markClicked }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  return useContext(DashboardContext);
}

export default DashboardContext;