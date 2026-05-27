import { useEffect } from 'react';
import { useWheels } from '../hooks/useWheels';
import { useNavigation } from '../hooks/useNavigation';
import { useHistory } from '../hooks/useHistory';
import { useActiveWheel } from '../hooks/useActiveWheel';
import { getPseudoRandom } from '../utils/math';
import Home from './Home';
import WheelSpin from './WheelSpin';
import SettingsModal from './SettingsModal';
import Faq from './Faq';
import History from './History';
import OnboardingModal from './OnboardingModal';
import ModalOverlay from './ui/ModalOverlay';
import GlassPanel from './ui/GlassPanel';

export default function AppLayout() {
  const {
    wheels,
    createWheel,
    deleteWheel,
    resetAllWheels
  } = useWheels();

  const {
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
    flameCount,
    isSettingsOpen,
    setIsSettingsOpen,
    setShowOnboarding,
    setOnboardingStep,
    allWheelsResetOpen,
    setAllWheelsResetOpen,
    exportWheelData,
    setExportWheelData,
    importModalOpen,
    setImportModalOpen
  } = useNavigation();

  const {
    history,
    clearHistory
  } = useHistory();

  const {
    activeWheel,
    handleSelectWheel,
    handleSpinEnd,
    handleTransitionToWheel,
    handleResetWheel,
    handleSaveSettings
  } = useActiveWheel();

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
      if (activeWheel) {
        document.title = `${activeWheel.name} | Custom Spinner Wheel - KobSpin`;
      }
    }
  }, [currentView, activeWheelId, activeWheel]);

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
          onClick={() => {
            setCurrentView('home');
            setActiveWheelId(null);
            setWheelStack([]);
            setNestedResult(null);
          }}
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
            onCreateWheel={createWheel} 
            onDeleteWheel={deleteWheel} 
            onResetAllWheels={() => setAllWheelsResetOpen(true)}
            onOpenImport={() => setImportModalOpen(true)}
            onExportWheel={(w) => setExportWheelData(w)}
          />
        ) : currentView === 'faq' ? (
          <Faq onBack={() => setCurrentView('home')} />
        ) : currentView === 'history' ? (
          <History history={history} onClearHistory={clearHistory} onBack={() => setCurrentView('home')} />
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
      <OnboardingModal />

      {/* Reset All Existing Wheels Modal */}
      {allWheelsResetOpen && (
        <ModalOverlay onClose={() => setAllWheelsResetOpen(false)} style={{ backgroundColor: 'rgba(7, 5, 15, 0.85)' }}>
          <GlassPanel animate style={{
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
                  resetAllWheels();
                }} 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '10px', backgroundColor: 'var(--color-accent)' }}
              >
                Confirm Reset
              </button>
            </div>
          </GlassPanel>
        </ModalOverlay>
      )}

      {/* Export Wheel Modal */}
      {exportWheelData && (
        <ModalOverlay onClose={() => setExportWheelData(null)} style={{ backgroundColor: 'rgba(7, 5, 15, 0.85)' }}>
          <GlassPanel animate style={{
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
          </GlassPanel>
        </ModalOverlay>
      )}

      {/* Import Wheel Modal */}
      {importModalOpen && (
        <ModalOverlay onClose={() => setImportModalOpen(false)} style={{ backgroundColor: 'rgba(7, 5, 15, 0.85)' }}>
          <GlassPanel animate style={{
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
                    
                    createWheel(importedWheel);
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
          </GlassPanel>
        </ModalOverlay>
      )}

      {/* Footer */}
      <footer style={{
        padding: '24px',
        textAlign: 'center',
        borderTop: '1px solid var(--border-glass)',
        color: 'var(--color-text-muted)',
        fontSize: '0.85rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div>
          KobSpin © {new Date().getFullYear()} • AI Slop'd by yours truly • Heikob @twitch
        </div>
        <a 
          href="https://github.com/Goodzilla/kobspin" 
          target="_blank" 
          rel="noopener noreferrer"
          className="footer-link"
          style={{
            color: 'var(--color-text-secondary)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            opacity: 0.8
          }}
        >
          <svg 
            height="14" 
            width="14" 
            viewBox="0 0 16 16" 
            fill="currentColor"
            style={{ display: 'inline-block', verticalAlign: 'middle' }}
          >
            <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.9.82 1.13.16.45.68 1.35 3.12.9.01.64.01 1.11.01 1.27 0 .21-.15.46-.55.38A8.013 8.013 0 0 1 0 8c0-4.42 3.58-8 8-8z"/>
          </svg>
          View source on GitHub
        </a>
      </footer>

    </div>
  );
}
