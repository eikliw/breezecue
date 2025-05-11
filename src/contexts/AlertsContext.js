import React, { createContext, useContext, useState } from 'react';

const AlertsContext = createContext();

export const useAlerts = () => useContext(AlertsContext);

export const AlertsProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [errorAlerts, setErrorAlerts] = useState(null);

  // In a real app, you might fetch alerts here or pass down setters from App.js
  const value = {
    alerts,
    setAlerts, // Allow App.js to set these
    loadingAlerts,
    setLoadingAlerts,
    errorAlerts,
    setErrorAlerts,
  };

  return (
    <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>
  );
}; 