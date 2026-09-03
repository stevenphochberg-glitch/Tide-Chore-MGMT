import React, { createContext, useContext, useState, useEffect } from 'react';

interface FlowSettingsContextType {
  flowGamification: boolean;
  setFlowGamification: (enabled: boolean) => void;
  toggleFlowGamification: () => void;
}

const FlowSettingsContext = createContext<FlowSettingsContextType | undefined>(undefined);

export const FLOW_GAMIFICATION_STORAGE_KEY = 'tide_flow_gamification';

export const FlowSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default is ON (true) as specified in Phase 4 directives
  const [flowGamification, setFlowGamificationState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(FLOW_GAMIFICATION_STORAGE_KEY);
      if (saved !== null) {
        return saved === 'true';
      }
    } catch (e) {
      console.warn('Unable to access localStorage for flow gamification setting:', e);
    }
    return true; // Default ON
  });

  const setFlowGamification = (enabled: boolean) => {
    setFlowGamificationState(enabled);
    try {
      localStorage.setItem(FLOW_GAMIFICATION_STORAGE_KEY, String(enabled));
    } catch (e) {
      console.warn('Unable to save flow gamification to localStorage:', e);
    }
  };

  const toggleFlowGamification = () => {
    setFlowGamification(!flowGamification);
  };

  return (
    <FlowSettingsContext.Provider
      value={{
        flowGamification,
        setFlowGamification,
        toggleFlowGamification,
      }}
    >
      {children}
    </FlowSettingsContext.Provider>
  );
};

export const useFlowSettings = (): FlowSettingsContextType => {
  const context = useContext(FlowSettingsContext);
  if (!context) {
    throw new Error('useFlowSettings must be used within a FlowSettingsProvider');
  }
  return context;
};
