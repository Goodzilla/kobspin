/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from 'react';
import { getDefaultWheels } from '../utils/defaultWheels';
import { sanitizeWheel, sanitizeWheelsData } from '../utils/sanitization';

export const WheelContext = createContext(null);

export const WheelProvider = ({ children }) => {
  const [wheels, setWheels] = useState(() => {
    const saved = localStorage.getItem('wheelspin_wheels');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return sanitizeWheelsData(parsed);
        }
        return sanitizeWheelsData(getDefaultWheels());
      } catch (e) {
        console.error('Failed to parse saved wheels', e);
        return sanitizeWheelsData(getDefaultWheels());
      }
    } else {
      return sanitizeWheelsData(getDefaultWheels());
    }
  });

  // Auto-persist wheels to localStorage on every state change.
  useEffect(() => {
    localStorage.setItem('wheelspin_wheels', JSON.stringify(wheels));
  }, [wheels]);

  const createWheel = (newWheel) => {
    if (!newWheel) return null;
    const sanitized = sanitizeWheel(newWheel);
    if (!sanitized) return null;
    
    sanitized.id = sanitized.id || 'wheel-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    sanitized.name = sanitized.name || 'Unnamed Wheel';
    
    setWheels(prev => [sanitized, ...prev]);
    return sanitized;
  };

  const deleteWheel = (id) => {
    setWheels(prev => prev.filter(w => w.id !== id));
  };

  const resetWheel = (wheelId) => {
    setWheels(prev => prev.map(w => {
      if (w.id !== wheelId) return w;
      
      const cloned = JSON.parse(JSON.stringify(w.originalOptions));
      const resetLives = (opt) => {
        if (!opt) return;
        opt.currentLives = opt.lives;
        opt.currentShrouds = opt.shrouds || 0;
        opt.currentShields = opt.shields || 0;
        if (opt.subOption) resetLives(opt.subOption);
      };
      cloned.forEach(resetLives);
      
      return { ...w, activeOptions: cloned };
    }));
  };

  const resetAllWheels = () => {
    setWheels(prev => prev.map(w => {
      const cloned = JSON.parse(JSON.stringify(w.originalOptions));
      const resetLives = (opt) => {
        if (!opt) return;
        opt.currentLives = opt.lives;
        opt.currentShrouds = opt.shrouds || 0;
        opt.currentShields = opt.shields || 0;
        if (opt.subOption) resetLives(opt.subOption);
      };
      cloned.forEach(resetLives);
      
      return { ...w, activeOptions: cloned };
    }));
  };

  const saveSettings = (wheelId, name, originalOptions, spinDuration, displayModeOrIsLootbox) => {
    let displayMode = 'wheel';
    if (typeof displayModeOrIsLootbox === 'boolean') {
      displayMode = displayModeOrIsLootbox ? 'lootbox' : 'wheel';
    } else if (typeof displayModeOrIsLootbox === 'string') {
      displayMode = displayModeOrIsLootbox;
    }

    const fingerprintOption = (o) => {
      let fp = `${o.id}:${o.weight}:${o.lives}:${o.shrouds || 0}:${o.shields || 0}`;
      if (o.subOption) fp += `>(${fingerprintOption(o.subOption)})`;
      return fp;
    };
    const optionFingerprint = (opts) => opts.map(fingerprintOption).join('|');

    setWheels(prev => prev.map(w => {
      if (w.id !== wheelId) return w;

      const prevFingerprint = optionFingerprint(w.originalOptions || []);
      const nextFingerprint = optionFingerprint(originalOptions);
      const optionsChanged = prevFingerprint !== nextFingerprint;

      let newActiveOptions;
      if (optionsChanged) {
        const clonedActive = JSON.parse(JSON.stringify(originalOptions));
        const resetLives = (opt) => {
          if (!opt) return;
          opt.currentLives = opt.lives;
          opt.currentShrouds = opt.shrouds || 0;
          opt.currentShields = opt.shields || 0;
          if (opt.subOption) resetLives(opt.subOption);
        };
        clonedActive.forEach(resetLives);
        newActiveOptions = clonedActive;
      } else {
        newActiveOptions = w.activeOptions || JSON.parse(JSON.stringify(originalOptions));
      }

      return {
        ...w,
        name,
        originalOptions,
        activeOptions: newActiveOptions,
        spinDuration: spinDuration || 10,
        isLootbox: displayMode === 'lootbox',
        displayMode: displayMode
      };
    }));
  };

  return (
    <WheelContext.Provider value={{
      wheels,
      setWheels,
      createWheel,
      deleteWheel,
      resetWheel,
      resetAllWheels,
      saveSettings
    }}>
      {children}
    </WheelContext.Provider>
  );
};
