import { useState } from 'react';
import Home from './components/Home';
import WheelSpin from './components/WheelSpin';
import SettingsModal from './components/SettingsModal';
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
        name: 'Drink a full glass of water',
        weight: 40,
        lives: 0,
        currentLives: 0,
        color: getVibrantColor(0),
        subOption: null
      },
      {
        id: '5-opt-2',
        name: 'Timeout a random chatter for 1 minute',
        weight: 20,
        lives: 3,
        currentLives: 3,
        color: getVibrantColor(1),
        subOption: null
      },
      {
        id: '5-opt-3',
        name: 'Sing a chorus of a song chosen by chat',
        weight: 20,
        lives: 2,
        currentLives: 2,
        color: getVibrantColor(2),
        subOption: {
          id: '5-opt-3-sub',
          name: 'Eat a spoonful of hot sauce',
          weight: 15,
          lives: 1,
          currentLives: 1,
          color: getVibrantColor(3),
          subOption: null
        }
      },
      {
        id: '5-opt-4',
        name: 'Do 15 pushups',
        weight: 14,
        lives: 3,
        currentLives: 3,
        color: getVibrantColor(4),
        subOption: {
          id: '5-opt-4-sub',
          name: 'Do 30 pushups',
          weight: 25,
          lives: 1,
          currentLives: 1,
          color: getVibrantColor(5),
          subOption: null
        }
      },
      {
        id: '5-opt-link-10',
        name: 'Link: 10 Gifted Subs Escalation',
        weight: 5,
        lives: 0,
        currentLives: 0,
        color: getVibrantColor(6),
        linkedWheelId: 'sub-10',
        subOption: null
      },
      {
        id: '5-opt-link-20',
        name: 'Link: 20 Gifted Subs Mega Wheel',
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
        name: 'Do 25 squats',
        weight: 32,
        lives: 3,
        currentLives: 3,
        color: getVibrantColor(0),
        subOption: {
          id: '10-opt-1-sub',
          name: 'Do 50 squats',
          weight: 20,
          lives: 1,
          currentLives: 1,
          color: getVibrantColor(1),
          subOption: null
        }
      },
      {
        id: '10-opt-2',
        name: 'No hydration for the next 15 minutes',
        weight: 20,
        lives: 2,
        currentLives: 2,
        color: getVibrantColor(2),
        subOption: null
      },
      {
        id: '10-opt-3',
        name: 'Draft a cringey tweet for chat to post',
        weight: 15,
        lives: 2,
        currentLives: 2,
        color: getVibrantColor(3),
        subOption: null
      },
      {
        id: '10-opt-4',
        name: 'Timeout your head moderator for 2 minutes',
        weight: 15,
        lives: 2,
        currentLives: 2,
        color: getVibrantColor(4),
        subOption: null
      },
      {
        id: '10-opt-5',
        name: 'Call a random contact and explain stream details',
        weight: 10,
        lives: 1,
        currentLives: 1,
        color: getVibrantColor(5),
        subOption: null
      },
      {
        id: '10-opt-link-20',
        name: 'Link: 20 Gifted Subs Mega Wheel',
        weight: 8,
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
        name: 'Eat a whole raw onion',
        weight: 5,
        lives: 1,
        currentLives: 1,
        color: getVibrantColor(0),
        subOption: null
      },
      {
        id: '20-opt-2',
        name: 'Shave a patch of leg or arm hair',
        weight: 10,
        lives: 1,
        currentLives: 1,
        color: getVibrantColor(1),
        subOption: null
      },
      {
        id: '20-opt-3',
        name: 'Gift 5 subs to another active streamer',
        weight: 15,
        lives: 2,
        currentLives: 2,
        color: getVibrantColor(2),
        subOption: null
      },
      {
        id: '20-opt-4',
        name: 'Ice cubes down shirt for 3 minutes',
        weight: 20,
        lives: 2,
        currentLives: 2,
        color: getVibrantColor(3),
        subOption: null
      },
      {
        id: '20-opt-5',
        name: 'Marker drawing on face for rest of stream',
        weight: 20,
        lives: 2,
        currentLives: 2,
        color: getVibrantColor(4),
        subOption: null
      },
      {
        id: '20-opt-6',
        name: 'Play chatter chosen sound on loop for 5 minutes',
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

export default function App() {
  const [wheels, setWheels] = useState(() => {
    const saved = localStorage.getItem('wheelspin_wheels');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved wheels', e);
        return getDefaultWheels();
      }
    } else {
      const defaults = getDefaultWheels();
      localStorage.setItem('wheelspin_wheels', JSON.stringify(defaults));
      return defaults;
    }
  });
  const [activeWheelId, setActiveWheelId] = useState(null);
  const [wheelStack, setWheelStack] = useState([]);
  const [autoSpinActive, setAutoSpinActive] = useState(false);
  const [nestedResult, setNestedResult] = useState(null);
  const [flamesActive, setFlamesActive] = useState(false);
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'wheel'
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('kobspin_onboarded');
  });
  const [onboardingStep, setOnboardingStep] = useState(1);

  // Save to localStorage when wheels change
  const saveWheels = (updatedWheels) => {
    setWheels(updatedWheels);
    localStorage.setItem('wheelspin_wheels', JSON.stringify(updatedWheels));
  };

  const handleCreateWheel = (newWheel) => {
    // Automatically clone originalOptions to activeOptions on creation
    newWheel.activeOptions = JSON.parse(JSON.stringify(newWheel.originalOptions));
    newWheel.spinDuration = newWheel.spinDuration || 10;
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
        // Reset current lives of original tree
        const resetLives = (opt) => {
          if (!opt) return;
          opt.currentLives = opt.lives;
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
        if (opt.subOption) resetLives(opt.subOption);
      };
      cloned.forEach(resetLives);
      
      return { ...w, activeOptions: cloned };
    });
    saveWheels(updated);
  };

  const handleTransitionToWheel = (linkedWheelId, originOption) => {
    console.log('[APP] Transitioning to linked wheel:', linkedWheelId, 'from option:', originOption.name);
    
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

    const updated = wheels.map(w => {
      if (w.id !== activeWheelId) return w;

      const newActive = w.activeOptions.map(opt => {
        if (opt.id === winner.id) {
          console.log('[APP] Found matching opt:', opt);
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
    saveWheels(updated);

    // If we are in a nested wheel run, return to top-level starting wheel
    if (wheelStack.length > 0) {
      const topLevel = wheelStack[0];
      console.log('[APP] Nested run ended. Returning to top-level starting wheel with flames:', topLevel.wheelId);
      
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

  const handleSaveSettings = (name, originalOptions, spinDuration) => {
    const updated = wheels.map(w => {
      if (w.id !== activeWheelId) return w;
      
      // Setting new configuration also resets current game activeOptions
      const clonedActive = JSON.parse(JSON.stringify(originalOptions));
      const resetLives = (opt) => {
        if (!opt) return;
        opt.currentLives = opt.lives;
        if (opt.subOption) resetLives(opt.subOption);
      };
      clonedActive.forEach(resetLives);

      return {
        ...w,
        name,
        originalOptions,
        activeOptions: clonedActive,
        spinDuration: spinDuration || 10
      };
    });

    saveWheels(updated);
    setIsSettingsOpen(false);
  };

  const handleResetToDefaultWheels = () => {
    if (confirm('This will restore the default wheel templates. Your existing wheels will be reset. Proceed?')) {
      const defaults = getDefaultWheels();
      saveWheels(defaults);
      localStorage.setItem('wheelspin_wheels', JSON.stringify(defaults));
    }
  };

  const renderOnboardingModal = () => {
    if (!showOnboarding) return null;

    const handleNext = () => {
      if (onboardingStep < 3) {
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
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(7, 5, 15, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '20px',
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
            {[1, 2, 3].map(step => (
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
              {onboardingStep === 3 ? 'Got it! 🚀' : 'Next Step ➔'}
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
        {Array.from({ length: 24 }).map((_, i) => {
          const isLeft = i % 2 === 0;
          const offset = -40 + Math.random() * 160;
          const delay = Math.random() * 1.0;
          const duration = 0.9 + Math.random() * 0.6;
          const size = 120 + Math.random() * 140;
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
            fontSize: '1.4rem', 
            cursor: 'pointer',
            letterSpacing: '-0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          🌀 <span style={{ background: 'linear-gradient(135deg, #a855f7 0%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            KobSpin
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={() => {
              setOnboardingStep(1);
              setShowOnboarding(true);
            }} 
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '8px 16px', borderColor: 'rgba(139, 92, 246, 0.4)' }}
          >
            ❓ Quick Tour
          </button>
          <button 
            onClick={() => {
              setCurrentView('home');
              setActiveWheelId(null);
            }} 
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '8px 16px' }}
          >
            Dashboard
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
            onResetToDefaults={handleResetToDefaultWheels}
          />
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

      {/* Footer */}
      <footer style={{
        padding: '24px',
        textAlign: 'center',
        borderTop: '1px solid var(--border-glass)',
        color: 'var(--color-text-muted)',
        fontSize: '0.85rem'
      }}>
        KobSpin Wheelspin App © {new Date().getFullYear()} • Custom options & weight chances.
      </footer>

    </div>
  );
}
