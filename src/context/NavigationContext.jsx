/* eslint-disable react-refresh/only-export-components */
import { createContext, useState } from 'react';

export const NavigationContext = createContext(null);

export const NavigationProvider = ({ children }) => {
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'wheel' | 'faq' | 'history'
  const [activeWheelId, setActiveWheelId] = useState(null);
  const [wheelStack, setWheelStack] = useState([]);
  const [autoSpinActive, setAutoSpinActive] = useState(false);
  const [nestedResult, setNestedResult] = useState(null);
  const [flamesActive, setFlamesActive] = useState(false);
  const [flameCount, setFlameCount] = useState(24);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('kobspin_onboarded');
  });
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [allWheelsResetOpen, setAllWheelsResetOpen] = useState(false);
  const [exportWheelData, setExportWheelData] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const goBackHome = () => {
    setActiveWheelId(null);
    setCurrentView('home');
    setWheelStack([]);
  };

  return (
    <NavigationContext.Provider value={{
      currentView,
      setCurrentView,
      activeWheelId,
      setActiveWheelId,
      wheelStack,
      setWheelStack,
      autoSpinActive,
      setAutoSpinActive,
      nestedResult,
      setNestedResult,
      flamesActive,
      setFlamesActive,
      flameCount,
      setFlameCount,
      isSettingsOpen,
      setIsSettingsOpen,
      showOnboarding,
      setShowOnboarding,
      onboardingStep,
      setOnboardingStep,
      allWheelsResetOpen,
      setAllWheelsResetOpen,
      exportWheelData,
      setExportWheelData,
      importModalOpen,
      setImportModalOpen,
      goBackHome
    }}>
      {children}
    </NavigationContext.Provider>
  );
};
