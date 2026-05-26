import { useState, useEffect } from 'react';
import Home from './components/Home';
import WheelSpin from './components/WheelSpin';
import SettingsModal from './components/SettingsModal';
import Faq from './components/Faq';
import History from './components/History';
import { getVibrantColor } from './utils';
import { audio } from './audio';


// Default list of wheels if none are stored in localStorage
const getDefaultWheels = () => [
  {
    id: 'sub-5',
    name: '5 Gifted Subs',
    spinDuration: 10,
    originalOptions: [
      {
        id: '5-opt-1',
        name: 'Only drink liquids through a tiny coffee stirrer straw for the next 2 hours',
        weight: 40,
        lives: 0,
        currentLives: 0,
        shrouds: 2,
        currentShrouds: 2,
        color: getVibrantColor(0),
        subOption: null
      },
      {
        id: '5-opt-2',
        name: 'Mod a completely random active chatter for 1 hour',
        weight: 20,
        lives: 3,
        currentLives: 3,
        shields: 2,
        currentShields: 2,
        color: getVibrantColor(1),
        subOption: null
      },
      {
        id: '5-opt-3',
        name: 'Sing a dramatic opera song chosen by chat',
        weight: 20,
        lives: 2,
        currentLives: 2,
        color: getVibrantColor(2),
        subOption: {
          id: '5-opt-3-sub',
          name: 'Eat a single raw garlic clove with no water for 3 minutes',
          weight: 15,
          lives: 1,
          currentLives: 1,
          color: getVibrantColor(3),
          subOption: null
        }
      },
      {
        id: '5-opt-4',
        name: 'Do 20 burpees live on camera',
        weight: 14,
        lives: 3,
        currentLives: 3,
        color: getVibrantColor(4),
        subOption: {
          id: '5-opt-4-sub',
          name: 'Do 40 burpees while wearing your shoes on your hands',
          weight: 25,
          lives: 1,
          currentLives: 1,
          color: getVibrantColor(5),
          subOption: null
        }
      },
      {
        id: '5-opt-link-10',
        name: '10 Gifted Subs Escalation',
        weight: 5,
        lives: 0,
        currentLives: 0,
        color: getVibrantColor(6),
        linkedWheelId: 'sub-10',
        subOption: null
      },
      {
        id: '5-opt-link-20',
        name: '20 Gifted Subs Mega Wheel',
        weight: 1,
        lives: 0,
        currentLives: 0,
        color: getVibrantColor(7),
        linkedWheelId: 'sub-20',
        subOption: null
      }
    ],
    activeOptions: []
  },
  {
    id: 'sub-10',
    name: '10 Gifted Subs',
    spinDuration: 10,
    originalOptions: [
      {
        id: '10-opt-1',
        name: 'Do 45 air squats while balancing a book on your head',
        weight: 32,
        lives: 3,
        currentLives: 3,
        shields: 2,
        currentShields: 2,
        color: getVibrantColor(0),
        subOption: {
          id: '10-opt-1-sub',
          name: 'Wear a heavy backpack filled with books for the next 1 hour',
          weight: 20,
          lives: 1,
          currentLives: 1,
          color: getVibrantColor(1),
          subOption: null
        }
      },
      {
        id: '10-opt-2',
        name: 'Only speak in a fake, over-the-top British/French accent for the next 30 minutes',
        weight: 20,
        lives: 2,
        currentLives: 2,
        shrouds: 2,
        currentShrouds: 2,
        color: getVibrantColor(2),
        subOption: null
      },
      {
        id: '10-opt-3',
        name: 'Send a cringey, out-of-context text message to the last person you messaged',
        weight: 15,
        lives: 2,
        currentLives: 2,
        color: getVibrantColor(3),
        subOption: null
      },
      {
        id: '10-opt-4',
        name: 'Mod a random chatter and let them write a tweet for you to post',
        weight: 15,
        lives: 0,
        currentLives: 0,
        color: getVibrantColor(4),
        subOption: null
      },
      {
        id: '10-opt-5',
        name: 'Call a random pizza place and try to order a pizza with fake ingredients for 3 minutes',
        weight: 10,
        lives: 1,
        currentLives: 1,
        color: getVibrantColor(5),
        subOption: null
      },
      {
        id: '10-opt-link-20',
        name: '20 Gifted Subs Mega Wheel',
        weight: 3,
        lives: 0,
        currentLives: 0,
        color: getVibrantColor(6),
        linkedWheelId: 'sub-20',
        subOption: null
      }
    ],
    activeOptions: []
  },
  {
    id: 'sub-20',
    name: '20 Gifted Subs',
    spinDuration: 12,
    originalOptions: [
      {
        id: '20-opt-1',
        name: 'Eat a whole raw lemon (peel included) without making a face',
        weight: 5,
        lives: 1,
        currentLives: 1,
        shrouds: 2,
        currentShrouds: 2,
        color: getVibrantColor(0),
        subOption: null
      },
      {
        id: '20-opt-2',
        name: 'Wax a small patch of arm or leg hair live on camera',
        weight: 10,
        lives: 1,
        currentLives: 1,
        shields: 2,
        currentShields: 2,
        color: getVibrantColor(1),
        subOption: null
      },
      {
        id: '20-opt-3',
        name: 'Gift 5 subs to a random streamer with under 5 viewers',
        weight: 15,
        lives: 2,
        currentLives: 2,
        color: getVibrantColor(2),
        subOption: null
      },
      {
        id: '20-opt-4',
        name: 'Ice cubes down your shirt and pants for 4 minutes while talking normally',
        weight: 20,
        lives: 2,
        currentLives: 2,
        color: getVibrantColor(3),
        subOption: null
      },
      {
        id: '20-opt-5',
        name: 'Marker drawing on your face chosen by chat (must stay for the rest of the stream)',
        weight: 20,
        lives: 0,
        currentLives: 0,
        color: getVibrantColor(4),
        subOption: null
      },
      {
        id: '20-opt-6',
        name: 'Play a YouTube sound chosen by chat on a loop in your headphones for 10 minutes',
        weight: 30,
        lives: 3,
        currentLives: 3,
        color: getVibrantColor(5),
        subOption: null
      }
    ],
    activeOptions: []
  }
];

// Deterministic pseudo-random number generator for render purity (avoids Math.random during render)
const getPseudoRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};



export default function App() {
  const [wheels, setWheels] = useState(() => {
    const saved = localStorage.getItem('wheelspin_wheels');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
        return getDefaultWheels();
      } catch (e) {
        console.error('Failed to parse saved wheels', e);
        return getDefaultWheels();
      }
    } else {
      const defaults = getDefaultWheels();
      return defaults;
    }
  });
  const [activeWheelId, setActiveWheelId] = useState(null);
  const [wheelStack, setWheelStack] = useState([]);
  const [autoSpinActive, setAutoSpinActive] = useState(false);
  const [nestedResult, setNestedResult] = useState(null);
  const [flamesActive, setFlamesActive] = useState(false);
  const [flameCount, setFlameCount] = useState(24);
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'wheel'
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('kobspin_onboarded');
  });
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [allWheelsResetOpen, setAllWheelsResetOpen] = useState(false);
  const [exportWheelData, setExportWheelData] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('kobspin_history') || '[]');
    } catch {
      return [];
    }
  });

  // Dynamic Document Title for SEO and User Experience
  useEffect(() => {
    if (currentView === 'home' || !activeWheelId) {
      if (currentView === 'faq') {
        document.title = "FAQ | KobSpin - Custom Spinner Wheel & Random Name Picker";
      } else if (currentView === 'history') {
        document.title = "Spin History | KobSpin - Custom Spinner Wheel";
      } else {
        document.title = "KobSpin - Custom Spinner Wheel & Random Name Picker (Nested & Weighted)";
      }
    } else {
      const activeWheel = wheels.find(w => w.id === activeWheelId);
      if (activeWheel) {
        document.title = `${activeWheel.name} | Custom Spinner Wheel - KobSpin`;
      }
    }
  }, [currentView, activeWheelId, wheels]);

  // Auto-persist wheels to localStorage on every state change.
  // This is the single source of truth for persistence — ensures durability
  // changes (lives, shields, shrouds) are NEVER lost regardless of which
  // code path updated the wheels state.
  useEffect(() => {
    localStorage.setItem('wheelspin_wheels', JSON.stringify(wheels));
  }, [wheels]);

  // Convenience wrapper: updates wheels state (auto-persisted by the effect above)
  const saveWheels = (updatedWheels) => {
    setWheels(updatedWheels);
  };

  const addHistoryItem = (wheel, winner, eventText, details = {}) => {
    const newItem = {
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 5),
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

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('kobspin_history');
  };

  const handleCreateWheel = (newWheel) => {
    if (!newWheel) return;
    // Ensure required fields exist for imported/new wheels
    newWheel.id = newWheel.id || 'wheel-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    newWheel.name = newWheel.name || 'Unnamed Wheel';
    newWheel.spinDuration = newWheel.spinDuration !== undefined ? newWheel.spinDuration : 10;
    newWheel.displayMode = newWheel.displayMode || (newWheel.isLootbox ? 'lootbox' : 'wheel');
    newWheel.originalOptions = newWheel.originalOptions || [];
    newWheel.activeOptions = newWheel.activeOptions || [];
    const updated = [newWheel, ...wheels];
    saveWheels(updated);
    setActiveWheelId(newWheel.id);
    setCurrentView('wheel');
  };

  const handleDeleteWheel = (id) => {
    const updated = wheels.filter(w => w.id !== id);
    saveWheels(updated);
    if (activeWheelId === id) {
      setActiveWheelId(null);
      setCurrentView('home');
    }
  };

  const handleSelectWheel = (id) => {
    const updated = wheels.map(w => {
      if (w.id !== id) return w;
      // Initialize activeOptions if empty
      if (!w.activeOptions || w.activeOptions.length === 0) {
        const cloned = JSON.parse(JSON.stringify(w.originalOptions));
        // Reset current lives, shrouds, and shields of original tree
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
    });
    
    saveWheels(updated);
    setActiveWheelId(id);
    setCurrentView('wheel');
  };

  const handleResetWheel = () => {
    if (!activeWheelId) return;
    const updated = wheels.map(w => {
      if (w.id !== activeWheelId) return w;
      
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
    });
    saveWheels(updated);
  };

  const handleResetAllExistingWheels = () => {
    const updated = wheels.map(w => {
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
    });
    saveWheels(updated);
  };

  const handleTransitionToWheel = (linkedWheelId, originOption) => {
    console.log('[APP] Transitioning to linked wheel:', linkedWheelId, 'from option:', originOption.name);
    
    const activeWheel = wheels.find(w => w.id === activeWheelId);
    const linkedWheel = wheels.find(w => w.id === linkedWheelId);
    if (activeWheel && linkedWheel) {
      addHistoryItem(activeWheel, originOption, `Unlocked sub-wheel: ${linkedWheel.name}`, {
        outcome: 'nested-transition',
        linkedWheelName: linkedWheel.name
      });
    }
    
    // Double flame count for each nested level (depth starts at 0 for first nested transition)
    const depth = wheelStack.length;
    const count = 24 * Math.pow(2, depth);
    setFlameCount(count);
    
    // Initialize target wheel's activeOptions if empty
    const updated = wheels.map(w => {
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
    });
    saveWheels(updated);

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

  const handleSpinEnd = (winner) => {
    console.log('[APP] handleSpinEnd called with:', winner);
    if (!winner || !activeWheelId) return;

    const activeWheel = wheels.find(w => w.id === activeWheelId);
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
            // Unlimited lives check: lives === 0 means permanent, do not decrement or remove
            if (opt.lives === 0) {
              return opt;
            }
            if (opt.currentLives > 1) {
              // Decrement life
              return { ...opt, currentLives: opt.currentLives - 1 };
            }
            // Out of lives: replace with sub-option
            if (opt.subOption) {
              const nextOpt = { ...opt.subOption };
              nextOpt.currentLives = nextOpt.lives; // Reset child's live counter
              nextOpt.currentShrouds = nextOpt.shrouds || 0; // Reset child's shroud counter
              nextOpt.currentShields = nextOpt.shields || 0; // Reset child's shield counter
              console.log('[APP] Replacing with subOption:', nextOpt);
              return nextOpt;
            }
            // Depleted completely: remove
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
      
      // Match the flame excitement level of the depth we returned from
      const depth = wheelStack.length;
      const count = 24 * Math.pow(2, depth);
      setFlameCount(count);
      
      audio.playFlameWhoosh();
      setFlamesActive(true);

      // Compile the nesting rundown chain
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

  const handleSaveSettings = (name, originalOptions, spinDuration, displayModeOrIsLootbox) => {
    const savedOptions = originalOptions;

    // Detect if we were passed a boolean (legacy/import) or string (displayMode)
    let displayMode = 'wheel';
    if (typeof displayModeOrIsLootbox === 'boolean') {
      displayMode = displayModeOrIsLootbox ? 'lootbox' : 'wheel';
    } else if (typeof displayModeOrIsLootbox === 'string') {
      displayMode = displayModeOrIsLootbox;
    }

    // Fingerprint options recursively (including sub-options) to detect structural changes
    const fingerprintOption = (o) => {
      let fp = `${o.id}:${o.weight}:${o.lives}:${o.shrouds || 0}:${o.shields || 0}`;
      if (o.subOption) fp += `>(${fingerprintOption(o.subOption)})`;
      return fp;
    };
    const optionFingerprint = (opts) => opts.map(fingerprintOption).join('|');

    const updated = wheels.map(w => {
      if (w.id !== activeWheelId) return w;

      // Check if the options themselves changed structurally
      const prevFingerprint = optionFingerprint(w.originalOptions || []);
      const nextFingerprint = optionFingerprint(savedOptions);
      const optionsChanged = prevFingerprint !== nextFingerprint;

      let newActiveOptions;
      if (optionsChanged) {
        // Options actually changed: rebuild activeOptions from scratch and reset lives
        const clonedActive = JSON.parse(JSON.stringify(savedOptions));
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
        // Only cosmetic/display settings changed (name, spinDuration, isLootbox, etc.)
        // Preserve existing activeOptions to keep current lives/shrouds/shields state
        newActiveOptions = w.activeOptions || JSON.parse(JSON.stringify(savedOptions));
      }

      return {
        ...w,
        name,
        originalOptions: savedOptions,
        activeOptions: newActiveOptions,
        spinDuration: spinDuration || 10,
        isLootbox: displayMode === 'lootbox',
        displayMode: displayMode
      };
    });

    saveWheels(updated);
    setIsSettingsOpen(false);
  };


  const renderOnboardingModal = () => {
    if (!showOnboarding) return null;

    const handleNext = () => {
      if (onboardingStep < 5) {
        setOnboardingStep(onboardingStep + 1);
      } else {
        localStorage.setItem('kobspin_onboarded', 'true');
        setShowOnboarding(false);
      }
    };

    const handleSkip = () => {
      localStorage.setItem('kobspin_onboarded', 'true');
      setShowOnboarding(false);
    };

    const handlePrev = () => {
      if (onboardingStep > 1) {
        setOnboardingStep(onboardingStep - 1);
      }
    };

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100dvh',
        backgroundColor: 'rgba(7, 5, 15, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '20px',
        overflowY: 'auto',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)'
      }} className="animate-overlay">
        <div className="glass-panel animate-scale-in" style={{
          maxWidth: '520px',
          width: '100%',
          padding: '40px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          background: 'rgba(13, 10, 24, 0.98)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.75), 0 0 35px rgba(139, 92, 246, 0.25)',
          textAlign: 'center'
        }}>
          
          {/* Header Progress Dots */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            {[1, 2, 3, 4, 5].map(step => (
              <div 
                key={step} 
                style={{
                  width: step === onboardingStep ? '32px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  backgroundColor: step === onboardingStep ? 'var(--color-accent)' : 'rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            ))}
          </div>

          {/* Step Contents */}
          {onboardingStep === 1 && (
            <div className="animate-fade-in" style={{ width: '100%' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚙️</div>
              <h2 style={{ fontSize: '1.6rem', color: '#fff', marginBottom: '12px' }}>
                Customize Your Wheels
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
                Open the option configuration menu by clicking the gear icon (⚙️) on any wheel page. Adjust spin duration up to 60s, rename your wheels, and build your custom options list!
              </p>
              {/* Visual graphic */}
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-glass)',
                padding: '20px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Toolbar preview:</span>
                <span className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem', cursor: 'default' }}>🔄 Reset</span>
                <span className="btn-icon" style={{ width: '36px', height: '36px', animation: 'pulse-glow 2s infinite', fontSize: '1.1rem', cursor: 'default' }}>⚙️</span>
              </div>
            </div>
          )}

          {onboardingStep === 2 && (
            <div className="animate-fade-in" style={{ width: '100%' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>❤️</div>
              <h2 style={{ fontSize: '1.6rem', color: '#fff', marginBottom: '12px' }}>
                Option Lives & Unlimited Mode
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
                Set max lives (hearts) for your slices. Once a slice is landed on, it loses a life. Or, check the <strong>Unlimited</strong> box to make a permanent slice that never runs out!
              </p>
              {/* Visual graphic */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '30px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-glass)',
                padding: '20px',
                borderRadius: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Limited Slices</span>
                  <span style={{ fontSize: '1.25rem', color: 'var(--color-danger)' }}>❤️ ❤️ ❤️</span>
                </div>
                <div style={{ width: '1px', backgroundColor: 'var(--border-glass)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Unlimited Slices</span>
                  <span style={{ fontSize: '1.25rem', color: 'var(--color-success)', fontWeight: 'bold' }}>🛡️ Permanent (∞)</span>
                </div>
              </div>
            </div>
          )}

          {onboardingStep === 3 && (
            <div className="animate-fade-in" style={{ width: '100%' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⛓️</div>
              <h2 style={{ fontSize: '1.6rem', color: '#fff', marginBottom: '12px' }}>
                Nested Unlock Chains
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
                Create fallback progressions! Click <strong>➕ Add Next Unlock</strong> inside settings to attach a sub-option. When the parent option runs out of lives, the sub-option unlocks on the wheel!
              </p>
              {/* Visual graphic */}
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-glass)',
                padding: '16px 20px',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}>Step 1:</span>
                  <span>Work / Study 💻 (3 Hearts)</span>
                </div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>↓ 💔 (out of lives)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--color-info)', fontWeight: 'bold' }}>Step 2:</span>
                  <span>Social Media Scroll 📱 (1 Heart)</span>
                </div>
              </div>
            </div>
          )}

          {onboardingStep === 4 && (
            <div className="animate-fade-in" style={{ width: '100%' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🌫️</div>
              <h2 style={{ fontSize: '1.6rem', color: '#fff', marginBottom: '12px' }}>
                Shrouds & Shields
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
                Create mystery options or extra protection!
                <br /><br />
                <strong>Shrouds</strong> hide option labels under a dark fog until pierced. <strong>Shields</strong> wrap options in a glassy surface that cracks as it takes hits!
              </p>
              {/* Visual graphic */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '24px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-glass)',
                padding: '16px 20px',
                borderRadius: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Shrouded</span>
                  <span style={{ fontSize: '0.9rem', color: '#a855f7', fontWeight: 600 }}>🌫️ Hidden option</span>
                </div>
                <div style={{ width: '1px', backgroundColor: 'var(--border-glass)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Shielded</span>
                  <span style={{ fontSize: '0.9rem', color: '#06b6d4', fontWeight: 600 }}>🛡️ Glass Overlay</span>
                </div>
              </div>
            </div>
          )}

          {onboardingStep === 5 && (
            <div className="animate-fade-in" style={{ width: '100%' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📦</div>
              <h2 style={{ fontSize: '1.6rem', color: '#fff', marginBottom: '12px' }}>
                Lootbox Case Opening
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
                Try the alternative <strong>Lootbox Variant</strong>! Enable it in the wheel configuration. Instead of a wheel, your options are shown in a container case that rolls horizontally to pick a winner!
              </p>
              {/* Visual graphic */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-glass)',
                padding: '14px 20px',
                borderRadius: '16px',
                marginBottom: '16px'
              }}>
                <div style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(139, 92, 246, 0.15)',
                  border: '1px solid var(--color-accent)',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  color: '#fff'
                }}>
                  📦 Container Mode
                </div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>➔</div>
                <div style={{
                  display: 'flex',
                  gap: '4px',
                  padding: '4px',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div style={{ width: '14px', height: '14px', backgroundColor: '#8b5cf6', borderRadius: '2px' }} />
                  <div style={{ width: '14px', height: '14px', backgroundColor: '#0ea5e9', borderRadius: '2px' }} />
                  <div style={{ width: '14px', height: '14px', backgroundColor: '#f43f5e', borderRadius: '2px', border: '1px solid #fff' }} />
                  <div style={{ width: '14px', height: '14px', backgroundColor: '#10b981', borderRadius: '2px' }} />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: '24px',
            gap: '12px'
          }}>
            {onboardingStep > 1 ? (
              <button 
                onClick={handlePrev} 
                className="btn btn-secondary"
                style={{ flex: 1, padding: '10px' }}
              >
                Back
              </button>
            ) : (
              <button 
                onClick={handleSkip} 
                className="btn btn-secondary"
                style={{ flex: 1, padding: '10px', color: 'var(--color-text-muted)' }}
              >
                Skip Tour
              </button>
            )}

            <button 
              onClick={handleNext} 
              className="btn btn-primary"
              style={{ flex: onboardingStep > 1 ? 1 : 1.5, padding: '10px' }}
            >
              {onboardingStep === 5 ? 'Got it! 🚀' : 'Next Step ➔'}
            </button>
          </div>

        </div>
      </div>
    );
  };

  const activeWheel = wheels.find(w => w.id === activeWheelId);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Fullscreen Symmetrical Flames transition overlay */}
      <div className={`flames-container ${flamesActive ? 'active' : ''}`}>
        {Array.from({ length: flameCount }).map((_, i) => {
          const isLeft = i % 2 === 0;
          const r1 = getPseudoRandom(i * 1.5 + 0.1);
          const r2 = getPseudoRandom(i * 2.8 + 0.2);
          const r3 = getPseudoRandom(i * 3.1 + 0.3);
          const r4 = getPseudoRandom(i * 4.4 + 0.4);
          const offset = -40 + r1 * 160;
          const delay = r2 * 1.0;
          const duration = 0.9 + r3 * 0.6;
          const size = 120 + r4 * 140;
          return (
            <div 
              key={i} 
              className="flame-particle" 
              style={{
                left: isLeft ? `${offset}px` : 'auto',
                right: !isLeft ? `${offset}px` : 'auto',
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
                width: `${size}px`,
                height: `${size}px`
              }}
            />
          );
        })}
      </div>
      
      {/* Navbar header */}
      <nav style={{
        padding: '16px 30px',
        borderBottom: '1px solid var(--border-glass)',
        backgroundColor: 'rgba(7, 5, 15, 0.4)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div 
          onClick={() => setCurrentView('home')}
          style={{ 
            fontFamily: 'var(--font-heading)', 
            fontWeight: 800, 
            fontSize: '1.3rem', 
            cursor: 'pointer',
            letterSpacing: '-0.03em',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-accent)' }}>
            <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/>
            <path d="M12 2a10 10 0 0 1 10 10" />
            <path d="M12 12L19 5" />
            <circle cx="12" cy="12" r="2.5" fill="currentColor" />
          </svg>
          <span style={{ color: '#ffffff' }}>
            Kob<span style={{ color: 'var(--color-accent)' }}>Spin</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={() => {
              setCurrentView('faq');
              setActiveWheelId(null);
            }} 
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '8px 16px', borderColor: currentView === 'faq' ? 'var(--color-accent)' : 'var(--border-glass)' }}
          >
            FAQ
          </button>
          <button 
            onClick={() => {
              setCurrentView('history');
              setActiveWheelId(null);
              setWheelStack([]);
              setNestedResult(null);
            }} 
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '8px 16px', borderColor: currentView === 'history' ? 'var(--color-accent)' : 'var(--border-glass)' }}
          >
            History
          </button>
          <button 
            onClick={() => {
              setOnboardingStep(1);
              setShowOnboarding(true);
            }} 
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '8px 16px', borderColor: 'rgba(139, 92, 246, 0.4)' }}
          >
            Quick Tour
          </button>
          <button 
            onClick={() => {
              setCurrentView('home');
              setActiveWheelId(null);
            }} 
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '8px 16px' }}
          >
            Home
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {currentView === 'home' ? (
          <Home 
            wheels={wheels} 
            onSelectWheel={handleSelectWheel} 
            onCreateWheel={handleCreateWheel} 
            onDeleteWheel={handleDeleteWheel} 
            onResetAllWheels={() => setAllWheelsResetOpen(true)}
            onOpenImport={() => setImportModalOpen(true)}
            onExportWheel={(w) => setExportWheelData(w)}
          />
        ) : currentView === 'faq' ? (
          <Faq onBack={() => setCurrentView('home')} />
        ) : currentView === 'history' ? (
          <History history={history} onClearHistory={handleClearHistory} onBack={() => setCurrentView('home')} />
        ) : (
          activeWheel && (
            <WheelSpin 
              key={activeWheelId}
              wheel={activeWheel} 
              wheels={wheels}
              autoSpin={autoSpinActive}
              onClearAutoSpin={() => setAutoSpinActive(false)}
              onTransitionToWheel={handleTransitionToWheel}
              nestedResult={nestedResult}
              onClearNestedResult={() => setNestedResult(null)}
              wheelStack={wheelStack}
              onSpinEnd={handleSpinEnd} 
              onOpenSettings={() => setIsSettingsOpen(true)} 
              onBackHome={() => {
                setCurrentView('home');
                setActiveWheelId(null);
                setWheelStack([]);
                setNestedResult(null);
              }} 
              onResetWheel={handleResetWheel}
              onExportWheel={(w) => setExportWheelData(w)}
            />
          )
        )}
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && activeWheel && (
        <SettingsModal 
          wheel={activeWheel} 
          wheels={wheels}
          onSave={handleSaveSettings} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      )}

      {/* Onboarding Modal */}
      {renderOnboardingModal()}


      {/* Reset All Existing Wheels Modal */}
      {allWheelsResetOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100dvh',
          backgroundColor: 'rgba(7, 5, 15, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          padding: '20px',
          overflowY: 'auto',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)'
        }} className="animate-overlay">
          <div className="glass-panel animate-scale-in" style={{
            maxWidth: '440px',
            width: '100%',
            padding: '48px 36px',
            textAlign: 'center',
            borderColor: 'rgba(139, 92, 246, 0.3)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), var(--shadow-neon)'
          }}>
            <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '16px' }}>Reset All Wheel Progress?</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.92rem', marginBottom: '32px', lineHeight: '1.5' }}>
              Are you sure you want to reset the current progress of <strong>all existing wheels</strong>?
              <br /><br />
              This restores all options to their original max lives (hearts) and locks sub-options again, but <strong>preserves your custom wheels</strong> and configurations.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setAllWheelsResetOpen(false)} 
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '10px' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setAllWheelsResetOpen(false);
                  handleResetAllExistingWheels();
                }} 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '10px', backgroundColor: 'var(--color-accent)' }}
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Wheel Modal */}
      {exportWheelData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100dvh',
          backgroundColor: 'rgba(7, 5, 15, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          padding: '20px',
          overflowY: 'auto',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)'
        }} className="animate-overlay">
          <div className="glass-panel animate-scale-in" style={{
            maxWidth: '500px',
            width: '100%',
            padding: '36px 28px',
            borderColor: 'rgba(6, 182, 212, 0.3)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(6, 182, 212, 0.15)'
          }}>
            <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '12px', textAlign: 'center' }}>Export Wheel Configuration</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.5', textAlign: 'center' }}>
              Copy the configuration JSON below. You can share this with others so they can import it.
            </p>
            
            <textarea 
              readOnly
              value={(() => {
                const cleanWheel = {
                  name: exportWheelData.name,
                  spinDuration: exportWheelData.spinDuration,
                  originalOptions: exportWheelData.originalOptions
                };
                return JSON.stringify(cleanWheel, null, 2);
              })()}
              style={{
                width: '100%',
                height: '180px',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border-glass)',
                borderRadius: '8px',
                padding: '12px',
                fontFamily: 'monospace',
                fontSize: '0.82rem',
                color: '#8be9fd',
                resize: 'none',
                marginBottom: '20px',
                outline: 'none'
              }}
              onClick={(e) => e.target.select()}
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setExportWheelData(null)} 
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '10px' }}
              >
                Close
              </button>
              <button 
                onClick={() => {
                  const cleanWheel = {
                    name: exportWheelData.name,
                    spinDuration: exportWheelData.spinDuration,
                    originalOptions: exportWheelData.originalOptions
                  };
                  navigator.clipboard.writeText(JSON.stringify(cleanWheel, null, 2));
                  alert('Configuration copied to clipboard!');
                }} 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '10px', backgroundColor: 'var(--color-info)', boxShadow: '0 4px 15px rgba(6, 182, 212, 0.3)' }}
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Wheel Modal */}
      {importModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100dvh',
          backgroundColor: 'rgba(7, 5, 15, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          padding: '20px',
          overflowY: 'auto',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)'
        }} className="animate-overlay">
          <div className="glass-panel animate-scale-in" style={{
            maxWidth: '500px',
            width: '100%',
            padding: '36px 28px',
            borderColor: 'rgba(139, 92, 246, 0.3)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), var(--shadow-neon)'
          }}>
            <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '12px', textAlign: 'center' }}>Import Wheel Configuration</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.5', textAlign: 'center' }}>
              Paste the configuration JSON text below to import the wheel.
            </p>
            
            <textarea 
              placeholder='Paste JSON here (e.g. { "name": "...", "originalOptions": [...] })'
              id="import-textarea"
              style={{
                width: '100%',
                height: '180px',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border-glass)',
                borderRadius: '8px',
                padding: '12px',
                fontFamily: 'monospace',
                fontSize: '0.82rem',
                color: '#fff',
                resize: 'none',
                marginBottom: '20px',
                outline: 'none'
              }}
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setImportModalOpen(false)} 
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '10px' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  const text = document.getElementById('import-textarea')?.value;
                  if (!text || text.trim() === '') {
                    alert('Please paste valid JSON text first.');
                    return;
                  }
                  try {
                    const parsed = JSON.parse(text);
                    if (!parsed.name || typeof parsed.name !== 'string') {
                      alert('Invalid config: "name" property must be a string.');
                      return;
                    }
                    if (!parsed.originalOptions || !Array.isArray(parsed.originalOptions)) {
                      alert('Invalid config: "originalOptions" property must be an array.');
                      return;
                    }
                    
                    const importedWheel = {
                      id: 'wheel-' + Date.now(),
                      name: parsed.name.trim(),
                      spinDuration: parsed.spinDuration || 10,
                      originalOptions: parsed.originalOptions
                    };
                    
                    handleCreateWheel(importedWheel);
                    setImportModalOpen(false);
                    alert(`"${importedWheel.name}" has been successfully imported!`);
                  } catch (e) {
                    alert('Failed to parse JSON. Please make sure you copied the correct text structure.\n\nError: ' + e.message);
                  }
                }} 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '10px', backgroundColor: 'var(--color-accent)' }}
              >
                Import Wheel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        padding: '24px',
        textAlign: 'center',
        borderTop: '1px solid var(--border-glass)',
        color: 'var(--color-text-muted)',
        fontSize: '0.85rem'
      }}>
        KobSpin © {new Date().getFullYear()} • AI Slop'd by yours truly • Heikob @twitch
      </footer>

    </div>
  );
}
