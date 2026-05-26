

import { createPortal } from 'react-dom';

export default function WinnerModal({
  isOpen,
  winner,
  isWinnerLegendary,
  nestedResult = null,
  wheels = [],
  onConfirm
}) {
  if (!isOpen || !winner) return null;

  const isShrouded = !nestedResult && winner.currentShrouds > 1;
  const isShroudBreaking = !nestedResult && winner.currentShrouds === 1;
  const isShielded = !nestedResult && !isShrouded && !isShroudBreaking && winner.currentShields > 1;
  const isShieldBreaking = !nestedResult && !isShrouded && !isShroudBreaking && winner.currentShields === 1;

  const displayColor = nestedResult ? nestedResult.color : winner.color;
  let glowColor = isWinnerLegendary ? '#ffd700' : displayColor;
  if (isShrouded) glowColor = '#a855f7';
  if (isShielded) glowColor = '#06b6d4';

  const borderColor = isWinnerLegendary ? 'rgba(255, 215, 0, 0.45)' : `${glowColor}66`;
  const shadowColor = isWinnerLegendary ? 'rgba(255, 215, 0, 0.3)' : `${glowColor}33`;

  const linkedWheel = winner.linkedWheelId ? wheels.find(w => w.id === winner.linkedWheelId) : null;
  const linkedWheelName = linkedWheel ? linkedWheel.name : 'Sub Wheel';

  // Precompute lives stagger heart arrays
  const activeCount = Math.max(0, winner.currentLives - 1);
  const inactiveCount = Math.max(0, winner.lives - activeCount);
  const heartArray = [];
  for (let i = 0; i < activeCount; i++) heartArray.push({ id: `active-${i}`, char: '❤️' });
  for (let i = 0; i < inactiveCount; i++) heartArray.push({ id: `inactive-${i}`, char: '🖤' });

  // Precompute shroud and shield active counts
  const activeShrouds = Math.max(0, winner.currentShrouds - 1);
  const activeShields = Math.max(0, winner.currentShields - 1);

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100dvh',
      backgroundColor: 'rgba(5, 3, 10, 0.82)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px',
      overflowY: 'auto',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)'
    }} className="animate-overlay">
      
      {/* Soft breathing background halo */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `radial-gradient(circle at center, ${glowColor}25 0%, transparent 60%)`,
        pointerEvents: 'none',
        zIndex: 99,
        animation: 'modalGlowPulse 6s ease-in-out infinite'
      }} />

      <div className="glass-panel animate-scale-in" style={{
        maxWidth: '480px',
        width: '100%',
        padding: '44px 32px',
        textAlign: 'center',
        borderColor: borderColor,
        boxShadow: `0 24px 60px rgba(0, 0, 0, 0.75), 0 0 45px ${shadowColor}`,
        position: 'relative',
        overflow: 'hidden',
        zIndex: 100
      }}>
        
        {/* Glowing gradient mesh backdrop inside card */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: `radial-gradient(circle, ${glowColor}0d 0%, transparent 60%)`,
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {nestedResult && (
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.8rem',
              fontWeight: 800,
              color: 'var(--color-info)',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              marginBottom: '16px',
              textShadow: '0 0 10px rgba(6, 182, 212, 0.6)'
            }}>
              🌀 Nested Wheel Result! 🌀
            </div>
          )}
          {isWinnerLegendary && (
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.8rem',
              fontWeight: 800,
              color: '#ffd700',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              marginBottom: '16px',
              textShadow: '0 0 10px rgba(255, 215, 0, 0.6)'
            }}>
              👑 Rare Option! 👑
            </div>
          )}

          {/* Floating trophy badge with spin-slow outer ring */}
          <div className="animate-float" style={{
            position: 'relative',
            width: '96px',
            height: '96px',
            margin: '0 auto 24px auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Outer spin-slow outline */}
            <div className="animate-spin-slow" style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: '50%',
              border: `1.5px dashed ${glowColor}`,
              opacity: 0.65
            }} />
            {/* Inner gold/winner colored badge */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${glowColor}33 0%, transparent 75%)`,
              border: `2.5px solid ${glowColor}`,
              boxShadow: `0 0 25px ${glowColor}55`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1
            }}>
              <span style={{ fontSize: '2.8rem', transform: 'translateY(-2px)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {isShrouded ? '🌫️' : isShielded ? '🛡️' : (isWinnerLegendary ? '👑' : '🏆')}
              </span>
            </div>
          </div>

          <p style={{
            color: 'var(--color-text-secondary)',
            fontSize: '0.85rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '2.5px',
            marginBottom: '10px'
          }}>
            {isShrouded ? 'Shroud Encountered' : isShielded ? 'Shield Engaged' : 'Landed On!'}
          </p>

          {/* Pill Badge Container with dynamic borders */}
          <div style={{
            display: 'inline-block',
            padding: '10px 32px',
            borderRadius: '30px',
            border: `1.5px solid ${borderColor}`,
            background: `linear-gradient(135deg, ${glowColor}1c 0%, rgba(255, 255, 255, 0.04) 100%)`,
            boxShadow: `inset 0 0 16px ${glowColor}1a`,
            marginBottom: '32px'
          }}>
            {/* Premium gradient text with drop shadow wrapper */}
            <div style={{ filter: `drop-shadow(0 4px 12px ${glowColor}33)` }}>
              <h2 style={{
                fontSize: '2.2rem',
                fontWeight: 850,
                background: `linear-gradient(to bottom, #ffffff 40%, ${isWinnerLegendary ? '#ffd700' : glowColor} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0,
                lineHeight: '1.2'
              }}>
                {nestedResult ? nestedResult.optionName : (isShrouded ? 'Hidden option' : winner.name)}
              </h2>
            </div>
          </div>

          {/* Lives status frosted glass slab */}
          <div style={{
            backgroundColor: 'rgba(10, 7, 22, 0.6)',
            padding: '22px 18px',
            borderRadius: '18px',
            marginBottom: '32px',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            borderTop: `1.2px solid ${glowColor}33`,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.55)'
          }}>
            {nestedResult ? (
              <div>
                <p style={{ fontSize: '1.05rem', color: 'var(--color-success)', fontWeight: 600, marginBottom: '6px' }}>
                  🎁 Nested Reward Earned!
                </p>
                <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.4, marginBottom: '12px' }}>
                  You got: <strong>{nestedResult.optionName}</strong>! This cost a life of the origin slice <strong>{winner.name}</strong>.
                </p>
                {winner.lives > 0 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', margin: '8px 0', alignItems: 'center' }}>
                      {winner.lives <= 5 ? (
                        heartArray.map((heart, idx) => (
                          <span 
                            key={heart.id} 
                            className="heart-pop"
                            style={{
                              fontSize: '1.5rem',
                              animationDelay: `${idx * 0.1}s`,
                              filter: heart.char === '❤️' 
                                ? 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.8))'
                                : 'none'
                            }}
                          >
                            {heart.char}
                          </span>
                        ))
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.1rem', color: 'var(--color-text-primary)', fontWeight: 700 }}>
                          <span style={{ color: 'var(--color-danger)', fontSize: '1.4rem', textShadow: '0 0 10px rgba(239, 68, 68, 0.8)' }}>❤️</span>
                          <span>{activeCount} / {winner.lives}</span>
                        </div>
                      )}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                      ({activeCount} lives left)
                    </p>
                  </div>
                )}

                {/* Vertical Nesting Rundown Timeline */}
                {nestedResult.rundown && (
                  <div style={{
                    marginTop: '20px',
                    textAlign: 'left',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: 'var(--color-text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '4px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                      paddingBottom: '8px'
                    }}>
                      📜 Nesting Rundown
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
                      {/* Vertical connecting line */}
                      <div style={{
                        position: 'absolute',
                        left: '9px',
                        top: '10px',
                        bottom: '10px',
                        width: '2px',
                        background: 'linear-gradient(to bottom, var(--color-accent) 0%, var(--color-info) 100%)',
                        opacity: 0.5
                      }} />
                      {nestedResult.rundown.map((step, idx) => {
                        const isLast = idx === nestedResult.rundown.length - 1;
                        return (
                          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', zIndex: 1 }}>
                            <div style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              backgroundColor: isLast ? 'var(--color-success)' : 'var(--color-accent)',
                              border: '2px solid var(--bg-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              color: '#fff',
                              marginTop: '2px',
                              boxShadow: isLast ? '0 0 8px var(--color-success)' : 'none'
                            }}>
                              {idx + 1}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                                {step.wheelName}
                              </div>
                              <div style={{ fontSize: '0.88rem', color: isLast ? 'var(--color-success)' : '#fff', fontWeight: isLast ? 700 : 500 }}>
                                {step.optionName}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : winner.linkedWheelId ? (
              <div>
                <p style={{ fontSize: '1.05rem', color: 'var(--color-warning)', fontWeight: 600, marginBottom: '8px' }}>
                  🌀 Nested Wheel Transition!
                </p>
                <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                  Confirming this will trigger an exciting transition and load the linked wheel: <strong>{linkedWheelName}</strong>!
                </p>
              </div>
            ) : isShrouded ? (
              <div>
                <p style={{ fontSize: '1.05rem', color: '#a855f7', fontWeight: 600, marginBottom: '8px' }}>
                  🌫️ Shrouded in Mist
                </p>
                <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', marginBottom: '14px', lineHeight: 1.4 }}>
                  The shadows veil this option. Pierce the shroud {winner.currentShrouds - 1} more times to unveil the hidden path.
                </p>
                
                {/* Shroud icons */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', margin: '14px 0', alignItems: 'center' }}>
                  {winner.shrouds <= 3 ? (
                    Array.from({ length: winner.shrouds }).map((_, idx) => (
                      <span 
                        key={`shroud-pop-${idx}`} 
                        className="heart-pop"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          color: idx < activeShrouds ? '#a855f7' : 'var(--color-text-muted)',
                          fontSize: '1.8rem',
                          animationDelay: `${idx * 0.12}s`,
                          filter: idx < activeShrouds 
                            ? 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.8))'
                            : 'none'
                        }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.36 10.04a6 6 0 0 0-11.32-2.24 4.5 4.5 0 0 0-.28 8.92h11.6a4 4 0 0 0 0-8z" />
                        </svg>
                      </span>
                    ))
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', color: 'var(--color-text-primary)', fontWeight: 700 }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#a855f7', filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.8))' }}>
                        <path d="M19.36 10.04a6 6 0 0 0-11.32-2.24 4.5 4.5 0 0 0-.28 8.92h11.6a4 4 0 0 0 0-8z" />
                      </svg>
                      <span>{activeShrouds} / {winner.shrouds}</span>
                    </div>
                  )}
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                  ({activeShrouds} shrouds remaining)
                </p>
              </div>
            ) : isShroudBreaking ? (
              <div>
                <p style={{ fontSize: '1.05rem', color: 'var(--color-success)', fontWeight: 600, marginBottom: '8px' }}>
                  ✨ Shroud Dissipated!
                </p>
                <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', marginBottom: '14px', lineHeight: 1.4 }}>
                  The dark mist breaks, revealing the hidden path: <strong>{winner.name}</strong>!
                </p>
                
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '14px', marginTop: '14px' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                    REVEALED OPTION LIVES:
                  </p>
                  {winner.lives === 0 ? (
                    <span style={{ color: 'var(--color-success)', fontSize: '1.25rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', lineHeight: 1 }}>♾️ <span style={{ fontSize: '0.95rem', fontWeight: 650 }}>Infinite Lives</span></span>
                  ) : winner.lives <= 3 ? (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                      {Array.from({ length: winner.lives }).map((_, idx) => (
                        <span 
                          key={`reveal-heart-${idx}`}
                          className="heart-pop"
                          style={{
                            fontSize: '1.5rem',
                            animationDelay: `${idx * 0.1}s`,
                            filter: idx < winner.currentLives
                              ? 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.8))'
                              : 'none'
                          }}
                        >
                          {idx < winner.currentLives ? '❤️' : '🖤'}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '1rem', color: 'var(--color-text-primary)', fontWeight: 650 }}>
                      <span style={{ color: 'var(--color-danger)', fontSize: '1.3rem' }}>❤️</span>
                      <span>{winner.currentLives} / {winner.lives}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : isShielded ? (
              <div>
                <p style={{ fontSize: '1.05rem', color: '#06b6d4', fontWeight: 600, marginBottom: '8px' }}>
                  🛡️ Shield Active
                </p>
                <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', marginBottom: '14px', lineHeight: 1.4 }}>
                  This option is protected by an energy shield. Strike the defense {winner.currentShields - 1} more times to shatter it.
                </p>

                {/* Shield icons */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', margin: '14px 0', alignItems: 'center' }}>
                  {winner.shields <= 3 ? (
                    Array.from({ length: winner.shields }).map((_, idx) => (
                      <span 
                        key={`shield-pop-${idx}`} 
                        className="heart-pop"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          color: idx < activeShields ? '#06b6d4' : 'var(--color-text-muted)',
                          fontSize: '1.8rem',
                          animationDelay: `${idx * 0.12}s`,
                          filter: idx < activeShields 
                            ? 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.8))'
                            : 'none'
                        }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                      </span>
                    ))
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', color: 'var(--color-text-primary)', fontWeight: 700 }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#06b6d4', filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.8))' }}>
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      <span>{activeShields} / {winner.shields}</span>
                    </div>
                  )}
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                  ({activeShields} shields remaining)
                </p>
              </div>
            ) : isShieldBreaking ? (
              <div>
                <p style={{ fontSize: '1.05rem', color: 'var(--color-success)', fontWeight: 600, marginBottom: '8px' }}>
                  💥 Shield Shattered!
                </p>
                <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', marginBottom: '14px', lineHeight: 1.4 }}>
                  The glassy defense shatters, leaving the option vulnerable!
                </p>
                
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '14px', marginTop: '14px' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                    OPTION LIVES:
                  </p>
                  {winner.lives === 0 ? (
                    <span style={{ color: 'var(--color-success)', fontSize: '1.25rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', lineHeight: 1 }}>♾️ <span style={{ fontSize: '0.95rem', fontWeight: 650 }}>Infinite Lives</span></span>
                  ) : winner.lives <= 3 ? (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                      {Array.from({ length: winner.lives }).map((_, idx) => (
                        <span 
                          key={`reveal-heart-${idx}`}
                          className="heart-pop"
                          style={{
                            fontSize: '1.5rem',
                            animationDelay: `${idx * 0.1}s`,
                            filter: idx < winner.currentLives
                              ? 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.8))'
                              : 'none'
                          }}
                        >
                          {idx < winner.currentLives ? '❤️' : '🖤'}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '1rem', color: 'var(--color-text-primary)', fontWeight: 650 }}>
                      <span style={{ color: 'var(--color-danger)', fontSize: '1.3rem' }}>❤️</span>
                      <span>{winner.currentLives} / {winner.lives}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : winner.lives === 0 ? (
              <div>
                <p style={{ fontSize: '1.05rem', color: 'var(--color-success)', fontWeight: 600, marginBottom: '6px' }}>
                  ✨ Unlimited option, it's here to stay!
                </p>
                <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                  This option has unlimited lives and stays on the wheel forever!
                </p>
              </div>
            ) : winner.currentLives > 1 ? (
              <div>
                <p style={{ fontSize: '1rem', color: 'var(--color-text-primary)', fontWeight: 500, marginBottom: '6px' }}>
                  💔 That cost a life!
                </p>
                
                {/* Bouncy staggered popping hearts */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '10px',
                  margin: '14px 0',
                  alignItems: 'center'
                }}>
                  {winner.lives <= 3 ? (
                    heartArray.map((heart, idx) => (
                      <span 
                        key={heart.id} 
                        className="heart-pop"
                        style={{
                          fontSize: '1.8rem',
                          animationDelay: `${idx * 0.12}s`,
                          filter: heart.char === '❤️' 
                            ? 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.8))'
                            : 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.15))'
                        }}
                      >
                        {heart.char}
                      </span>
                    ))
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', color: 'var(--color-text-primary)', fontWeight: 700 }}>
                      <span style={{ color: 'var(--color-danger)', textShadow: '0 0 10px rgba(239, 68, 68, 0.8)', fontSize: '1.8rem' }}>❤️</span>
                      <span>{activeCount} / {winner.lives}</span>
                    </div>
                  )}
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                  ({activeCount} lives left)
                </p>
              </div>
            ) : winner.subOption ? (
              <div>
                <p style={{ fontSize: '1.05rem', color: 'var(--color-warning)', fontWeight: 600, marginBottom: '8px' }}>
                  💥 Out of Lives!
                </p>
                <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', marginBottom: '12px', lineHeight: 1.4 }}>
                  "{winner.name}" has shattered and vanished from the wheel...
                </p>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-success)', fontWeight: 600 }}>
                  🔓 A hidden unlock is about to be revealed!
                </p>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '1.05rem', color: 'var(--color-danger)', fontWeight: 600, marginBottom: '6px' }}>
                  🚫 Out of Lives!
                </p>
                <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                  "{winner.name}" has shattered and completely vanished from the wheel!
                </p>
              </div>
            )}
          </div>

          {/* Glare Sheen Shiny CTA Button */}
          <button 
            onClick={onConfirm} 
            className="btn btn-primary btn-sheen-container" 
            style={{ 
              width: '100%', 
              padding: '16px',
              fontSize: '1.1rem',
              borderRadius: '14px',
              background: isWinnerLegendary 
                ? 'linear-gradient(135deg, #ffd700 0%, #f97316 100%)' 
                : `linear-gradient(135deg, ${glowColor} 0%, #6366f1 100%)`,
              boxShadow: `0 6px 24px ${glowColor}44`,
              border: '1px solid rgba(255,255,255,0.2)',
              fontWeight: 750,
              letterSpacing: '0.5px',
              transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
            }}
          >
            Confirm & Continue
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
