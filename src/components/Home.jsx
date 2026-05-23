
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

      <header style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{
          fontSize: '3.7rem',
          background: 'linear-gradient(135deg, #ffffff 30%, #c084fc 80%, #8b5cf6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '12px',
          letterSpacing: '-0.03em'
        }}>
          KOB<span style={{ color: 'var(--color-accent)', textShadow: '0 0 25px rgba(139, 92, 246, 0.45)' }}>SPIN</span>
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', marginBottom: '20px' }}>
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
    </div>
  );
}
