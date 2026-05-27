
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

export default function Home({ wheels, onSelectWheel, onCreateWheel, onDeleteWheel, onResetAllWheels, onOpenImport, onExportWheel }) {
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
          Create custom wheels with option lives, shields, mystery shrouds, nested unlocks, and three layouts you can swap instantly. It's mostly AI-assisted slop, but it actually works.
        </p>
      </header>

      {/* Quick Actions Area */}
      <section style={{ marginBottom: '48px', width: '100%' }}>
        <h2 style={{
          fontSize: '1rem',
          marginBottom: '16px',
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          opacity: 0.8
        }}>
          Quick Actions
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {/* Create Card */}
          <div 
            onClick={handleCreateNew}
            className="glass-panel create-card" 
            style={{
              minHeight: '160px',
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
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(139, 92, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-accent)',
              boxShadow: 'inset 0 0 10px rgba(139, 92, 246, 0.2)'
            }}>
              <svg 
                width="20" 
                height="20" 
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
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: '600', color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>
              Create a New Wheel
            </span>
          </div>

          {/* Import Card */}
          <div 
            onClick={onOpenImport}
            className="glass-panel create-card" 
            style={{
              minHeight: '160px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              borderStyle: 'dashed',
              borderWidth: '2px',
              gap: '12px',
              borderColor: 'rgba(6, 182, 212, 0.4)'
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(6, 182, 212, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-info)',
              boxShadow: 'inset 0 0 10px rgba(6, 182, 212, 0.2)'
            }}>
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: '600', color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>
              Import a Wheel
            </span>
          </div>

          {/* Reset Progress Card */}
          {onResetAllWheels && (
            <div 
              onClick={onResetAllWheels}
              className="glass-panel create-card" 
              style={{
                minHeight: '160px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                borderStyle: 'dashed',
                borderWidth: '2px',
                gap: '12px',
                borderColor: 'rgba(168, 85, 247, 0.4)'
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(168, 85, 247, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-accent)',
                boxShadow: 'inset 0 0 10px rgba(168, 85, 247, 0.2)'
              }}>
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M23 4v6h-6" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
              </div>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: '600', color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>
                Reset All Wheels Progress
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Your Saved Wheels Section */}
      <section style={{ marginBottom: '40px', width: '100%' }}>
        <h2 style={{
          fontSize: '1.4rem',
          marginBottom: '20px',
          fontWeight: 700,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          Your Saved Wheels
        </h2>

        {wheels.length === 0 ? (
          <div className="glass-panel" style={{
            padding: '48px',
            textAlign: 'center',
            color: 'var(--color-text-muted)',
            borderStyle: 'dashed',
            borderWidth: '1px',
            borderRadius: '16px'
          }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '12px' }}>🎡</span>
            <span style={{ fontWeight: '500', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>No saved wheels yet</span>
            <span style={{ fontSize: '0.85rem' }}>Use the actions above to create a new wheel or import an existing configuration JSON!</span>
          </div>
        ) : (
          <div className="wheels-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px'
          }}>
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
                        onExportWheel(wheel);
                      }}
                      className="btn btn-secondary"
                      style={{
                        padding: '12px',
                        borderColor: 'rgba(6, 182, 212, 0.2)',
                        color: 'var(--color-info)'
                      }}
                      title="Export Wheel JSON"
                    >
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                      </svg>
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
                        color: 'var(--color-danger)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Delete Wheel"
                    >
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SEO Explainer Content for PageRank & Visibility */}
      <section style={{
        marginTop: '80px',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        paddingTop: '40px',
        textAlign: 'left'
      }}>
        <h2 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '16px' }}>
          Why did I build this?
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.65', marginBottom: '32px', fontSize: '0.98rem' }}>
          Let's be real: most decision wheels are boring. You spin once, get your result, and you're done. I wanted something more chaotic, so I built this. KobSpin lets you turn simple choices into a weird progressive game. You can give options lives so they don't disappear immediately, wrap them in glassy shields that crack when hit, hide them under shrouds if you want a surprise, or chain them together so a backup option only appears when the main one runs out of lives. Is it totally overengineered? Yeah. Did I let an AI write a bunch of this CSS and React boilerplate because I was too lazy to do it myself? Absolutely, it's AI slop, but it actually works. Use it on streams, for deciding what to eat, or just to waste time.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '28px'
        }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--color-accent)', marginBottom: '8px' }}>
              ☸️ Three Ways to Spin
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Swap layouts instantly: choose the classic <strong>Wheel Spinner</strong>, a CS:GO-style scrolling <strong>Lootbox Container</strong>, or a high-stakes <strong>Horse Race</strong> where your choices sprint to the finish line!
            </p>
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--color-info)', marginBottom: '8px' }}>
              🛡️ Shields & Shrouds
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Put glassy <strong>Shields</strong> on options so they don't lose lives right away, or use a <strong>Shroud</strong> to hide options in mystery fog until they get landed on.
            </p>
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--color-success)', marginBottom: '8px' }}>
              ⛓️ Nested Unlock Chains
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Chain options together. When a main option runs out of lives and shatters, it automatically unlocks its sub-options on the wheel. It's a bit complicated, but it's cool.
            </p>
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--color-accent)', marginBottom: '8px', filter: 'hue-rotate(60deg)' }}>
              ⚖️ Weighted Odds
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Tweak weights to make options super rare or annoyingly common. Everything is saved in your local storage, so reloading the page won't wipe your settings.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
