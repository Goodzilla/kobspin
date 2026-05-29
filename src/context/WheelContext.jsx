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

    // Helpers for deep option reconciliation
    const collectOptionIds = (opts) => {
      const ids = new Set();
      const traverse = (o) => {
        if (!o) return;
        ids.add(o.id);
        if (o.subOption) traverse(o.subOption);
      };
      opts.forEach(traverse);
      return ids;
    };

    const collectActiveOptionsMap = (opts) => {
      const map = new Map();
      const traverse = (o) => {
        if (!o) return;
        map.set(o.id, o);
        if (o.subOption) traverse(o.subOption);
      };
      opts.forEach(traverse);
      return map;
    };

    const cloneAndResetOption = (opt) => {
      if (!opt) return null;
      const clone = JSON.parse(JSON.stringify(opt));
      const reset = (o) => {
        if (!o) return;
        o.currentLives = o.lives;
        o.currentShrouds = o.shrouds || 0;
        o.currentShields = o.shields || 0;
        if (o.subOption) reset(o.subOption);
      };
      reset(clone);
      return clone;
    };

    const reconcileOptions = (newOriginals, oldOriginals, oldActives) => {
      const oldOrigIds = collectOptionIds(oldOriginals || []);
      const oldActiveMap = collectActiveOptionsMap(oldActives || []);

      const reconciledList = [];

      for (const newOpt of newOriginals) {
        let matchedActive = null;
        let curr = newOpt;
        while (curr) {
          if (oldActiveMap.has(curr.id)) {
            matchedActive = oldActiveMap.get(curr.id);
            break;
          }
          curr = curr.subOption;
        }

        if (matchedActive) {
          const livesLost = matchedActive.lives === 0 ? 0 : Math.max(0, matchedActive.lives - matchedActive.currentLives);
          const shieldsLost = Math.max(0, (matchedActive.shields || 0) - (matchedActive.currentShields || 0));
          const shroudsLost = Math.max(0, (matchedActive.shrouds || 0) - (matchedActive.currentShrouds || 0));

          const reconciled = {
            ...curr,
            currentLives: curr.lives === 0 ? 0 : Math.max(1, curr.lives - livesLost),
            currentShields: curr.shields === 0 ? 0 : Math.max(0, curr.shields - shieldsLost),
            currentShrouds: curr.shrouds === 0 ? 0 : Math.max(0, curr.shrouds - shroudsLost),
            subOption: cloneAndResetOption(curr.subOption)
          };

          reconciledList.push(reconciled);
        } else {
          if (!oldOrigIds.has(newOpt.id)) {
            reconciledList.push(cloneAndResetOption(newOpt));
          }
        }
      }

      return reconciledList;
    };

    setWheels(prev => prev.map(w => {
      if (w.id !== wheelId) return w;

      const newActiveOptions = reconcileOptions(
        originalOptions,
        w.originalOptions,
        w.activeOptions || []
      );

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
