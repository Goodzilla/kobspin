import { useNavigation } from '../hooks/useNavigation';
import ModalOverlay from './ui/ModalOverlay';
import GlassPanel from './ui/GlassPanel';

export default function OnboardingModal() {
  const {
    showOnboarding,
    setShowOnboarding,
    onboardingStep,
    setOnboardingStep
  } = useNavigation();

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
    <ModalOverlay onClose={handleSkip} style={{ backgroundColor: 'rgba(7, 5, 15, 0.85)' }}>
      <GlassPanel animate style={{
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
              Customize the Wheels
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
              Click the gear icon (⚙️) on any wheel page to open settings. You can rename the wheel, adjust spin durations, and add options. It's not rocket science.
            </p>
            {/* Visual graphic preview */}
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
              Give options some lives
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
              You can give options a set number of lives (hearts). When an option is landed on, it loses a life. If you want something to stay on the wheel forever, check the <strong>Unlimited</strong> box so it doesn't die.
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
              Chain options together
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
              Click <strong>➕ Add Next Unlock</strong> in settings to attach a backup option. Once the main option runs out of lives and shatters, the next one in line unlocks and takes its place.
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
              Shields & Shrouds
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
              Add a <strong>Shroud</strong> to hide an option behind mystery fog until it's landed on, or add <strong>Shields</strong> to protect it. A shielded option won't lose a life the first few times it gets hit—instead, the glass shield just cracks.
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
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏁</div>
            <h2 style={{ fontSize: '1.6rem', color: '#fff', marginBottom: '12px' }}>
              Three Layouts because I could
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
              I couldn't decide on one way to display it, so I built three layouts that you can swap instantly. Choose the classic <strong>Wheel Spinner</strong>, a CS:GO-style scrolling <strong>Lootbox Container</strong>, or a high-stakes <strong>Horse Race</strong> where your choices sprint to the finish line!
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
              <span style={{ fontSize: '1.2rem' }}>☸️</span>
              <span style={{ color: 'var(--color-text-muted)' }}>|</span>
              <span style={{ fontSize: '1.2rem' }}>📦</span>
              <span style={{ color: 'var(--color-text-muted)' }}>|</span>
              <span style={{ fontSize: '1.2rem' }}>🏇</span>
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

      </GlassPanel>
    </ModalOverlay>
  );
}
