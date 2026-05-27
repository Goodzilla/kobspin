/* eslint-disable react-refresh/only-export-components */
import { createContext, useState } from 'react';

export const HistoryContext = createContext(null);

export const HistoryProvider = ({ children }) => {
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('kobspin_history') || '[]');
    } catch {
      return [];
    }
  });

  const addHistoryItem = (wheel, winner, eventText, details = {}) => {
    const newItem = {
      id: Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      timestamp: Date.now(),
      wheelName: wheel.name,
      optionName: winner.name,
      optionColor: winner.color,
      isLootbox: !!wheel.isLootbox,
      eventText,
      ...details
    };
    setHistory(prev => {
      const next = [newItem, ...prev];
      localStorage.setItem('kobspin_history', JSON.stringify(next));
      return next;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('kobspin_history');
  };

  return (
    <HistoryContext.Provider value={{
      history,
      addHistoryItem,
      clearHistory
    }}>
      {children}
    </HistoryContext.Provider>
  );
};
