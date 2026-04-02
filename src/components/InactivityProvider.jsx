import React, { createContext, useContext, useEffect } from 'react';
import { useInactivityTimeout } from '../hooks/useInactivityTimeout';

const InactivityContext = createContext();

/**
 * InactivityProvider Component
 * Wraps the app to provide 30-minute inactivity timeout
 * Logs out user if inactive for more than 30 minutes
 */
export const InactivityProvider = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('authToken');

  const { resetTimer, getTimeSinceLastActivity } = useInactivityTimeout({
    inactivityDuration: 30 * 60 * 1000, // 30 minutes
    warningDuration: 1 * 60 * 1000, // Show warning 1 minute before
    enabled: isAuthenticated, // Only enable when logged in
  });

  return (
    <InactivityContext.Provider value={{ resetTimer, getTimeSinceLastActivity }}>
      {children}
    </InactivityContext.Provider>
  );
};

export const useInactivity = () => {
  const context = useContext(InactivityContext);
  if (!context) {
    console.warn('useInactivity must be used within InactivityProvider');
  }
  return context;
};
