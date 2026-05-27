import { useWheels } from './useWheels';
import { useNavigation } from './useNavigation';
import { useHistory } from './useHistory';
import { audio } from '../audio';

export const useActiveWheel = () => {
  const { wheels, setWheels, resetWheel, saveSettings } = useWheels();
  const {
    activeWheelId,
    setActiveWheelId,
    wheelStack,
    setWheelStack,
    setNestedResult,
    setFlamesActive,
    setFlameCount,
    setAutoSpinActive,
    setCurrentView,
    setIsSettingsOpen
  } = useNavigation();
  const { addHistoryItem } = useHistory();

  const activeWheel = wheels.find(w => w.id === activeWheelId) || null;

  const handleSelectWheel = (id) => {
    // Initialize activeOptions if empty
    setWheels(prev => prev.map(w => {
      if (w.id !== id) return w;
      if (!w.activeOptions || w.activeOptions.length === 0) {
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
      }
      return w;
    }));
    
    setActiveWheelId(id);
    setCurrentView('wheel');
  };

  const handleSpinEnd = (winner) => {
    console.log('[APP] handleSpinEnd called with:', winner);
    if (!winner || !activeWheelId) return;

    if (activeWheel) {
      let eventText;
      let historyDetails = {
        outcome: 'won',
        shroudsRemaining: 0,
        shieldsRemaining: 0,
        livesRemaining: 0
      };

      if (winner.currentShrouds > 0) {
        const nextShrouds = winner.currentShrouds - 1;
        if (winner.currentShrouds === 1) {
          eventText = "Shroud broke! Option revealed.";
          historyDetails.outcome = 'shroud-broken';
        } else {
          eventText = `Lost 1 Shroud (${nextShrouds} left)`;
          historyDetails.outcome = 'shroud-lost';
          historyDetails.shroudsRemaining = nextShrouds;
        }
      } else if (winner.currentShields > 0) {
        const nextShields = winner.currentShields - 1;
        if (winner.currentShields === 1) {
          eventText = "Shield broke! Protection lost.";
          historyDetails.outcome = 'shield-broken';
        } else {
          eventText = `Shield absorbed hit (${nextShields} left)`;
          historyDetails.outcome = 'shield-lost';
          historyDetails.shieldsRemaining = nextShields;
        }
      } else if (winner.lives === 0) {
        eventText = "Won! (Infinite Lives)";
        historyDetails.outcome = 'won';
        historyDetails.isInfinite = true;
      } else if (winner.currentLives > 1) {
        const nextLives = winner.currentLives - 1;
        eventText = `Lost 1 Life (${nextLives} left)`;
        historyDetails.outcome = 'life-lost';
        historyDetails.livesRemaining = nextLives;
      } else {
        if (winner.subOption) {
          eventText = `Evolved to: ${winner.subOption.name}`;
          historyDetails.outcome = 'evolved';
          historyDetails.evolvedTo = winner.subOption.name;
        } else {
          eventText = "Eliminated completely!";
          historyDetails.outcome = 'eliminated';
        }
      }

      addHistoryItem(activeWheel, winner, eventText, historyDetails);
    }

    setWheels(prevWheels => {
      const updated = prevWheels.map(w => {
        if (w.id !== activeWheelId) return w;

        const newActive = w.activeOptions.map(opt => {
          if (opt.id === winner.id) {
            console.log('[APP] Found matching opt:', opt);
            // Shrouds decrement first
            if (opt.currentShrouds > 0) {
              return { ...opt, currentShrouds: opt.currentShrouds - 1 };
            }
            // Shields decrement second
            if (opt.currentShields > 0) {
              return { ...opt, currentShields: opt.currentShields - 1 };
            }
            // Unlimited lives check: lives === 0 means permanent
            if (opt.lives === 0) {
              return opt;
            }
            if (opt.currentLives > 1) {
              return { ...opt, currentLives: opt.currentLives - 1 };
            }
            // Out of lives: replace with sub-option
            if (opt.subOption) {
              const nextOpt = { ...opt.subOption };
              nextOpt.currentLives = nextOpt.lives;
              nextOpt.currentShrouds = nextOpt.shrouds || 0;
              nextOpt.currentShields = nextOpt.shields || 0;
              console.log('[APP] Replacing with subOption:', nextOpt);
              return nextOpt;
            }
            // Depleted completely
            console.log('[APP] Depleted completely, removing');
            return null;
          }
          return opt;
        }).filter(Boolean);

        return { ...w, activeOptions: newActive };
      });

      console.log('[APP] Updated wheels activeOptions:', updated.find(w => w.id === activeWheelId)?.activeOptions);
      return updated;
    });

    // If we are in a nested wheel run, return to top-level starting wheel
    if (wheelStack.length > 0) {
      const topLevel = wheelStack[0];
      console.log('[APP] Nested run ended. Returning to top-level starting wheel with flames:', topLevel.wheelId);
      
      const depth = wheelStack.length;
      const count = 24 * Math.pow(2, depth);
      setFlameCount(count);
      
      audio.playFlameWhoosh();
      setFlamesActive(true);

      const currentWheelName = wheels.find(w => w.id === activeWheelId)?.name || 'Sub Wheel';
      const rundown = [
        ...wheelStack.map(item => ({
          wheelName: wheels.find(w => w.id === item.wheelId)?.name || 'Wheel',
          optionName: item.originOptionName
        })),
        {
          wheelName: currentWheelName,
          optionName: winner.name
        }
      ];

      setTimeout(() => {
        setNestedResult({
          optionName: winner.name,
          color: winner.color,
          originOptionId: topLevel.originOptionId,
          rundown
        });
        setActiveWheelId(topLevel.wheelId);
        setWheelStack([]);
      }, 1200);

      setTimeout(() => {
        setFlamesActive(false);
      }, 2400);
    }
  };

  const handleTransitionToWheel = (linkedWheelId, originOption) => {
    console.log('[APP] Transitioning to linked wheel:', linkedWheelId, 'from option:', originOption.name);
    
    const linkedWheel = wheels.find(w => w.id === linkedWheelId);
    if (activeWheel && linkedWheel) {
      addHistoryItem(activeWheel, originOption, `Unlocked sub-wheel: ${linkedWheel.name}`, {
        outcome: 'nested-transition',
        linkedWheelName: linkedWheel.name
      });
    }
    
    const depth = wheelStack.length;
    const count = 24 * Math.pow(2, depth);
    setFlameCount(count);
    
    // Initialize target wheel's activeOptions if empty
    setWheels(prev => prev.map(w => {
      if (w.id !== linkedWheelId) return w;
      if (!w.activeOptions || w.activeOptions.length === 0) {
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
      }
      return w;
    }));

    audio.playFlameWhoosh();
    setFlamesActive(true);

    setTimeout(() => {
      setWheelStack(prev => [...prev, { 
        wheelId: activeWheelId, 
        originOptionId: originOption.id,
        originOptionName: originOption.name 
      }]);
      setActiveWheelId(linkedWheelId);
      setAutoSpinActive(true);
    }, 1200);

    setTimeout(() => {
      setFlamesActive(false);
    }, 2400);
  };

  const handleResetActiveWheel = () => {
    if (activeWheelId) {
      resetWheel(activeWheelId);
    }
  };

  const handleSaveActiveWheelSettings = (name, originalOptions, spinDuration, displayModeOrIsLootbox) => {
    if (activeWheelId) {
      saveSettings(activeWheelId, name, originalOptions, spinDuration, displayModeOrIsLootbox);
      setIsSettingsOpen(false);
    }
  };

  return {
    activeWheel,
    activeWheelId,
    handleSelectWheel,
    handleSpinEnd,
    handleTransitionToWheel,
    handleResetWheel: handleResetActiveWheel,
    handleSaveSettings: handleSaveActiveWheelSettings
  };
};
