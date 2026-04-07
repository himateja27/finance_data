import React, { createContext, useContext, useState } from "react";

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const value = {
    refreshTrigger,
    triggerRefresh,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
