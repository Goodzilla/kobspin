
// Generates vibrant, distinct colors using golden ratio hue distribution
const getVibrantColor = (index) => {
  const hue = Math.floor((index * 137.5) % 360);
  return `hsl(${hue}, 85%, 60%)`;
};

// Default template for a newly created wheel to demonstrate the nesting feature
const createDefaultWheel = (id, name) => {
  return {
    id,
    name,
    originalOptions: [
      {
        id: 'opt-1',
        name: 'Coffee Break ☕',
        weight: 25,
        lives: 3,
        currentLives: 3,
        color: getVibrantColor(0),
        subOption: {
          id: 'opt-1-sub',
          name: 'Double Espresso! ☕⚡',
          weight: 15,
          lives: 1,
          currentLives: 1,
          color: getVibrantColor(4),
          subOption: null
        }
      },
      {
        id: 'opt-2',
        name: 'Do 10 Pushups 💪',
        weight: 25,
        lives: 2,
        currentLives: 2,
        color: getVibrantColor(1),
        subOption: {
          id: 'opt-2-sub',
          name: 'Plank for 1 Min 🧘',
          weight: 25,
          lives: 1,
          currentLives: 1,
          color: getVibrantColor(5),
          subOption: null
        }
      },
      {
        id: 'opt-3',
        name: 'Play a Game 🎮',
        weight: 25,
        lives: 1,
        currentLives: 1,
        color: getVibrantColor(2),
        subOption: null
      },
      {
        id: 'opt-4',
        name: 'Read a Book 📖',
        weight: 25,
        lives: 2,
        currentLives: 2,
        color: getVibrantColor(3),
        subOption: {
          id: 'opt-4-sub',
          name: 'Write a Journal ✍️',
          weight: 10,
          lives: 2,
          currentLives: 2,
          color: getVibrantColor(6),
          subOption: null
        }
      }
    ],
    activeOptions: [] // Will be initialized as clone of originalOptions on play
  };
};

export default function Home({ wheels, onSelectWheel, onCreateWheel, onDeleteWheel, onResetToDefaults }) {
  const handleCreateNew = () => {
    const name = prompt('Enter a name for your new wheel:', 'Daily Routine');
    if (!name || name.trim() === '') return;
    
    const newId = 'wheel-' + Date.now();
    const newWheel = createDefaultWheel(newId, name.trim());
    onCreateWheel(newWheel);
  };

  const countTotalOptions = (options) => {
    let count = 0;
    const traverse = (opt) => {
      if (!opt) return;
      count++;
      if (opt.subOption) traverse(opt.subOption);
    };
    options.forEach(traverse);
    return count;
  };

  return (
    <div className="home-container animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px', position: 'relative' }}>
      
      {/* Dynamic Ambient Background Spotlight */}
      <div style={{
        position: 'absolute',
        top: '0',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '800px',
        height: '380px',
        background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.09) 0%, rgba(6, 182, 212, 0.02) 50%, transparent 80%)',
        pointerEvents: 'none',
        zIndex: -1
      }} />

      <header style={{ 
        textAlign: 'center', 
        marginBottom: '50px', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center' 
      }}>
        
        {/* Sleek, Premium Geometrical Logo Mark */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '18px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.08) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 12px 24px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-accent)' }}>
            <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/>
            <path d="M12 2a10 10 0 0 1 10 10" />
            <path d="M12 12L19 5" />
            <circle cx="12" cy="12" r="2.5" fill="currentColor" />
          </svg>
        </div>

        <h1 style={{
          fontSize: '3.2rem',
          fontWeight: 800,
          color: '#ffffff',
          marginBottom: '10px',
          letterSpacing: '-0.04em'
        }}>
          Kob<span style={{ color: 'var(--color-accent)' }}>Spin</span>
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', marginBottom: '20px', maxWidth: '520px', lineHeight: '1.5' }}>
          Create custom wheels with nested, unlockable options and variable weights.
        </p>
        {onResetToDefaults && (
          <button 
            onClick={onResetToDefaults}
            className="btn btn-secondary"
            style={{ 
              fontSize: '0.85rem', 
              padding: '8px 16px', 
              opacity: 0.85,
              borderColor: 'rgba(139, 92, 246, 0.3)'
            }}
          >
            🔄 Reset Wheelspins to Default
          </button>
        )}
      </header>

      <h2 style={{
        fontSize: '1.3rem',
        marginBottom: '20px',
        fontWeight: 650,
        color: '#fff',
        opacity: 0.9,
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        🌀 Select or Create a Spinner Wheel
      </h2>

      <div className="wheels-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '24px'
      }}>
        {/* Create Card */}
        <div 
          onClick={handleCreateNew}
          className="glass-panel create-card" 
          style={{
            minHeight: '200px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            borderStyle: 'dashed',
            borderWidth: '2px',
            gap: '12px'
          }}
        >
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(139, 92, 246, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-accent)',
            boxShadow: 'inset 0 0 10px rgba(139, 92, 246, 0.2)'
          }}>
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: '600', color: 'var(--color-text-primary)' }}>
            Create a New Wheel
          </span>
        </div>

        {/* Existing Wheels */}
        {wheels.map((wheel) => {
          const optCount = countTotalOptions(wheel.originalOptions);
          return (
            <div 
              key={wheel.id} 
              className="glass-panel wheel-card"
              style={{
                minHeight: '200px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '8px', color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {wheel.name}
                </h3>
                <span style={{
                  fontSize: '0.8rem',
                  background: 'rgba(139, 92, 246, 0.15)',
                  color: '#c084fc',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontWeight: '600'
                }}>
                  {optCount} Options Total
                </span>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button 
                  onClick={() => onSelectWheel(wheel.id)}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Play Wheel
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Are you sure you want to delete "${wheel.name}"?`)) {
                      onDeleteWheel(wheel.id);
                    }
                  }}
                  className="btn btn-secondary"
                  style={{
                    padding: '12px',
                    borderColor: 'rgba(239, 68, 68, 0.2)',
                    color: 'var(--color-danger)'
                  }}
                  title="Delete Wheel"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* SEO Explainer Content for PageRank & Visibility */}
      <section style={{
        marginTop: '80px',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        paddingTop: '40px',
        textAlign: 'left'
      }}>
        <h2 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '16px' }}>
          Progressive Spinner Wheel Decider with Nested Unlockable Slices
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6', marginBottom: '24px', fontSize: '0.98rem' }}>
          KobSpin is a free, modern <strong>custom spinner wheel</strong> maker and <strong>random name picker</strong> that introduces progressive gamification. Traditional decision wheels give a single static result. KobSpin allows you to link options, create **nested unlockable layers**, and configure custom slice lives (hearts). When an option runs out of lives, it shatters and unlocks its sub-options dynamically, changing the wheel’s layout and odds in real-time!
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--color-accent)', marginBottom: '8px' }}>
              🎮 Gamified Decision Making
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Use nested options to build fallback rewards, progression paths, or twitch streaming punishment chains (like subathon challenges).
            </p>
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--color-info)', marginBottom: '8px' }}>
              ⚖️ Weighted Probabilities
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Fine-tune the exact percentage odds for each segment by adjusting weight parameters. Perfect for fair raffle picker giveaways or balanced contest wheels.
            </p>
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--color-success)', marginBottom: '8px' }}>
              🔒 Save & Embed Offline
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              All custom spinner configurations are automatically saved to browser localStorage, ensuring your data is persisted securely for your next classroom session or stream.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
