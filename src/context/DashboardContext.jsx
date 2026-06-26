// src/context/DashboardContext.jsx
import React, { createContext, useContext } from 'react';
import { useLeadData } from '../hooks/useLeadData.js';

const DashboardContext = createContext({ allCounts: {}, status: 'connecting' });

export function DashboardProvider({ children }) {
  const { allCounts, status } = useLeadData(null, null);
  return (
    <DashboardContext.Provider value={{ allCounts, status }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  return useContext(DashboardContext);
}

export default DashboardContext;
