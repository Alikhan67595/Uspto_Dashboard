// src/hooks/useLeadData.js
import { useEffect, useState } from 'react';
import { subscribe, getStatus, deleteLeads as bridgeDelete } from '../lib/extensionBridge.js';

export const LEAD_TYPES = [
  { key: 'deadAbandoned', label: 'Dead Abandoned', color: '#ef4444', badge: 'DA' },
  { key: 'deadCancelled', label: 'Dead Cancelled', color: '#f97316', badge: 'DC' },
  { key: 'livePending',   label: 'Live Pending',   color: '#3b82f6', badge: 'LP' },
  { key: 'liveRegister',  label: 'Live Register',  color: '#22c55e', badge: 'LR' },
];

export const DATE_LABELS = {
  deadAbandoned: 'Date Abandoned',
  deadCancelled: 'Date Cancelled',
  livePending:   'Filing Date',
  liveRegister:  'Registration Date',
};

const getValidKey   = (type) => `leads_${type}`;
const getMissingKey = (type) => `leads_missing_${type}`;

// type === null  -> sirf allCounts chahiye (Sidebar/Overview ke liye)
// type + subType -> us lead-type ki specific list (valid ya missing)
export function useLeadData(type, subType) {
  const [leads, setLeads] = useState([]);
  const [allCounts, setAllCounts] = useState({});
  const [status, setStatus] = useState(getStatus());

  useEffect(() => {
    const unsub = subscribe((snapshot, connStatus) => {
      setStatus(connStatus);

      const counts = {};
      LEAD_TYPES.forEach((t) => {
        counts[t.key] = {
          valid:   (snapshot[getValidKey(t.key)]   || []).length,
          missing: (snapshot[getMissingKey(t.key)] || []).length,
        };
      });
      setAllCounts(counts);

      if (type) {
        const key = subType === 'valid' ? getValidKey(type) : getMissingKey(type);
        setLeads(snapshot[key] || []);
      }
    });
    return unsub;
  }, [type, subType]);

  return { leads, allCounts, status };
}

// Delete extension ke background.js ko message bhej kar hota hai
// (website chrome.storage ko directly touch nahi kar sakti).
// background.js storage update karke naya snapshot push kar dega,
// jo upar wale subscribe() ke zariye UI mein khud-ba-khud reflect ho jayega.
export function deleteSingleLead(type, subType, serial, callback) {
  bridgeDelete(type, subType, [serial]);
  callback && callback();
}

export function deleteMultipleLeads(type, subType, serials, callback) {
  bridgeDelete(type, subType, serials);
  callback && callback();
}
