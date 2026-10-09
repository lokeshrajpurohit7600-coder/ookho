'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface HistoryContextType {
  isHistoryOpen: boolean;
  openHistory: () => void;
  closeHistory: () => void;
  toggleHistory: () => void;
}

const HistoryContext = createContext<HistoryContextType>({
  isHistoryOpen: false,
  openHistory: () => {},
  closeHistory: () => {},
  toggleHistory: () => {},
});

export const useHistory = () => useContext(HistoryContext);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const openHistory = useCallback(() => setIsHistoryOpen(true), []);
  const closeHistory = useCallback(() => setIsHistoryOpen(false), []);
  const toggleHistory = useCallback(() => setIsHistoryOpen((prev) => !prev), []);

  return (
    <HistoryContext.Provider
      value={{
        isHistoryOpen,
        openHistory,
        closeHistory,
        toggleHistory,
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
}
