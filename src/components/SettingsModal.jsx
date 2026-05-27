import { useState } from 'react';
import { getVibrantColor } from '../utils/colors';
import { generateId } from '../utils/ids';

export default function SettingsModal({ wheel, wheels = [], onSave, onClose }) {
  const [wheelName, setWheelName] = useState(wheel.name);
  const [spinDuration, setSpinDuration] = useState(wheel.spinDuration || 10);
  const [displayMode, setDisplayMode] = useState(wheel.displayMode || (wheel.isLootbox ? 'lootbox' : 'wheel'));
  const [options, setOptions] = useState(
    JSON.parse(JSON.stringify(wheel.originalOptions))
  );

  // Helper: Recursive update of fields
  const updateOption = (id, fields) => {
    const recurse = (list) => {
      return list.map((opt) => {
        if (opt.id === id) {
          const updated = { ...opt, ...fields };
          // Keep currentLives synchronized with max lives when editing config
          if (fields.lives !== undefined) {
            updated.currentLives = fields.lives;
          }
          if (fields.shrouds !== undefined) {
            updated.currentShrouds = fields.shrouds;
          }
          if (fields.shields !== undefined) {
            updated.currentShields = fields.shields;
          }
          return updated;
        }
        if (opt.subOption) {
          return { ...opt, subOption: recurse([opt.subOption])[0] };
        }
        return opt;
      });
    };
    setOptions(recurse(options));
  };

  // Helper: Recursive add sub-option
  const addSubOption = (parentId) => {
    const recurse = (list) => {
      return list.map((opt) => {
        if (opt.id === parentId) {
          const depth = countChainDepth(opt);
          return {
            ...opt,
            subOption: {
              id: generateId(),
              name: `Next Unlock ➔`,
              weight: Math.round(opt.weight * 0.8), // Default to 80% of parent weight
              lives: 2,
              currentLives: 2,
              shrouds: 0,
              currentShrouds: 0,
              shields: 0,
              currentShields: 0,
              color: getVibrantColor(options.length + depth + 1),
              subOption: null
            }
          };
        }
        if (opt.subOption) {
          return { ...opt, subOption: recurse([opt.subOption])[0] };
        }
        return opt;
      });
    };
    setOptions(recurse(options));
  };

  // Helper: Recursive deletion (Promotes subOption's child if deleted in the middle)
  const deleteOption = (id) => {
    // If it's a top-level option
    if (options.some((o) => o.id === id)) {
      setOptions(options.filter((o) => o.id !== id));
      return;
    }

    const recurse = (list) => {
      return list.map((opt) => {
        if (opt.subOption && opt.subOption.id === id) {
          // Promote grandchild: A -> B -> C, delete B -> A -> C
          return { ...opt, subOption: opt.subOption.subOption };
        }
        if (opt.subOption) {
          return { ...opt, subOption: recurse([opt.subOption])[0] };
        }
        return opt;
      });
    };
    setOptions(recurse(options));
  };

  const addTopLevelOption = () => {
    const newIndex = options.length;
    const newOpt = {
      id: generateId(),
      name: `Option ${newIndex + 1}`,
      weight: 25,
      lives: 3,
      currentLives: 3,
      shrouds: 0,
      currentShrouds: 0,
      shields: 0,
      currentShields: 0,
      color: getVibrantColor(newIndex),
      subOption: null
    };
    setOptions([...options, newOpt]);
  };

  const countChainDepth = (opt) => {
    let depth = 0;
    let curr = opt;
    while (curr.subOption) {
      depth++;
      curr = curr.subOption;
    }
    return depth;
  };

  const handleSave = () => {
    if (!wheelName.trim()) {
      alert('Please enter a wheel name');
      return;
    }
    if (options.length === 0) {
      alert('Please add at least one option');
      return;
    }
    onSave(wheelName.trim(), options, spinDuration, displayMode);
  };

  // Render a single option block and its children recursively
  const renderOptionNode = (opt, depth = 0) => {
    return (
      <div key={opt.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div 
          className="glass-panel" 
          style={{
            padding: '20px 24px',
            marginLeft: `${depth * 24}px`,
            width: '620px',
            flexShrink: 0,
            position: 'relative',
            borderLeft: depth > 0 ? `4px solid ${opt.color}` : '1px solid var(--border-glass)',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            marginBottom: '4px'
          }}
        >
          {depth > 0 && (
            <div style={{
              position: 'absolute',
              left: '-16px',
              top: '20px',
              color: opt.color,
              fontSize: '1rem',
              fontWeight: 'bold'
            }}>
              ↳
            </div>
          )}

          {/* Form Fields */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            {/* Header / Title */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%' }}>
              <div 
                style={{ 
                  width: '16px', 
                  height: '16px', 
                  borderRadius: '50%', 
                  backgroundColor: opt.color,
                  boxShadow: `0 0 8px ${opt.color}`
                }} 
              />
              <span style={{ 
                fontFamily: 'var(--font-heading)', 
                fontWeight: 700, 
                fontSize: '0.85rem',
                color: 'var(--color-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                {depth === 0 ? 'Top-Level Option' : `Unlock Option Level ${depth}`}
              </span>
            </div>

            {/* Label input */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                Option Label
                <span className="info-tooltip" data-tooltip="The text that is displayed on the wheel slice or container loot card.">?</span>
              </label>
              <input
                type="text"
                value={opt.name}
                onChange={(e) => updateOption(opt.id, { name: e.target.value })}
                className="form-input"
                placeholder="Option Label (e.g. Pizza 🍕)"
                style={{ width: '100%', fontSize: '1rem', padding: '10px 14px' }}
              />
            </div>

            {/* Content layout splitting: Left column (Weight & Type), Right column (Durability & Overlays) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.1fr 1.3fr',
              gap: '24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              paddingTop: '14px'
            }}>
              
              {/* Left Column: Core Settings */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Core Settings
                </h4>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Weight
                    <span className="info-tooltip" data-tooltip="Determines slice size and probability of landing on this option. Higher weights mean a higher chance of landing.">?</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={opt.weight}
                    onChange={(e) => updateOption(opt.id, { weight: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Option Type</label>
                  <select
                    value={opt.linkedWheelId ? 'link' : 'standard'}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'standard') {
                        updateOption(opt.id, { linkedWheelId: null });
                      } else {
                        const otherWheels = wheels.filter(w => w.id !== wheel.id);
                        const defaultTarget = otherWheels[0];
                        updateOption(opt.id, {
                          linkedWheelId: defaultTarget ? defaultTarget.id : '',
                          name: opt.name.startsWith('Option') && defaultTarget ? defaultTarget.name : opt.name
                        });
                      }
                    }}
                    className="form-input"
                    style={{ background: 'var(--bg-secondary)', color: '#fff', cursor: 'pointer', width: '100%' }}
                  >
                    <option value="standard">Standard Option</option>
                    <option value="link">Link to Another Wheel 🌀</option>
                  </select>
                </div>

                {opt.linkedWheelId !== undefined && opt.linkedWheelId !== null && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Target Wheel</label>
                    <select
                      value={opt.linkedWheelId}
                      onChange={(e) => {
                        const targetId = e.target.value;
                        const targetWheel = wheels.find(w => w.id === targetId);
                        updateOption(opt.id, {
                          linkedWheelId: targetId,
                          name: targetWheel ? targetWheel.name : opt.name
                        });
                      }}
                      className="form-input"
                      style={{ background: 'var(--bg-secondary)', color: '#fff', cursor: 'pointer', width: '100%' }}
                    >
                      <option value="" disabled>-- Select Wheel --</option>
                      {wheels.filter(w => w.id !== wheel.id).length === 0 ? (
                        <option disabled>No other wheels created</option>
                      ) : (
                        wheels
                          .filter(w => w.id !== wheel.id)
                          .map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))
                      )}
                    </select>
                  </div>
                )}
              </div>

              {/* Right Column: Durability & Overlays */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderLeft: '1px solid rgba(255, 255, 255, 0.05)', paddingLeft: '20px' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Durability & Overlays
                </h4>

                {/* Durability / Lives Group */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                    Durability (Lives)
                    <span className="info-tooltip" data-tooltip="How many times the wheel can land on this option before it shatters and is removed. Turn on 'Unlimited' to keep it forever.">?</span>
                  </label>
                  
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <input
                        type="number"
                        min="1"
                        value={opt.lives === 0 ? '' : opt.lives}
                        disabled={opt.lives === 0}
                        placeholder={opt.lives === 0 ? '∞' : 'Number of lives'}
                        onChange={(e) => updateOption(opt.id, { lives: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="form-input"
                        style={{ width: '100%' }}
                      />
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <input
                        type="checkbox"
                        id={`unlimited-${opt.id}`}
                        checked={opt.lives === 0}
                        onChange={(e) => {
                          const isUnlimited = e.target.checked;
                          updateOption(opt.id, {
                            lives: isUnlimited ? 0 : 3,
                            currentLives: isUnlimited ? 0 : 3
                          });
                        }}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <label 
                        htmlFor={`unlimited-${opt.id}`} 
                        style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', cursor: 'pointer', userSelect: 'none' }}
                      >
                        Unlimited
                      </label>
                    </div>
                  </div>
                </div>

                {/* Overlays Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Shrouds
                      <span className="info-tooltip" data-tooltip="Hides this option under a dark mist on the wheel. Each spin that lands on it removes one shroud layer until revealed.">?</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={opt.shrouds || 0}
                      onChange={(e) => updateOption(opt.id, { shrouds: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="form-input"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Shields
                      <span className="info-tooltip" data-tooltip="Encloses this option in a glassy shield. The option is visible, but the shield must be shattered (by landing on it) before it can lose lives.">?</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={opt.shields || 0}
                      onChange={(e) => updateOption(opt.id, { shields: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="form-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Actions for this specific node */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginTop: '8px', 
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              paddingTop: '12px',
              alignItems: 'center'
            }}>
              {opt.lives === 0 ? (
                <span style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  ♾️ Permanent option (unlimited lives)
                </span>
              ) : !opt.subOption ? (
                <button
                  onClick={() => addSubOption(opt.id)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '6px 12px', borderColor: 'rgba(168, 85, 247, 0.2)' }}
                >
                  Add Next Unlock
                </button>
              ) : (
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center' }}>
                  🔒 Option chain configured
                </span>
              )}
              
              <button
                onClick={() => deleteOption(opt.id)}
                className="btn btn-secondary"
                style={{ 
                  fontSize: '0.8rem', 
                  padding: '6px 12px', 
                  color: 'var(--color-danger)', 
                  borderColor: 'rgba(239, 68, 68, 0.1)' 
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Recurse to Sub-Option */}
        {opt.subOption && renderOptionNode(opt.subOption, depth + 1)}
      </div>
    );
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
      zIndex: 100,
      padding: '20px',
      overflowY: 'auto'
    }} className="animate-overlay">
      <div 
        className="glass-panel animate-scale-in" 
        style={{
          width: '95vw',
          maxWidth: '1000px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderColor: 'rgba(255, 255, 255, 0.15)',
          overflow: 'hidden',
          background: 'rgba(13, 10, 24, 0.98)'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '24px 30px',
          borderBottom: '1px solid var(--border-glass)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '1.6rem', color: '#fff' }}>Wheel Configuration</h2>
          <button 
            onClick={onClose} 
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-secondary)',
              fontSize: '1.5rem',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div style={{
          padding: '30px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            marginBottom: '10px'
          }}>
            {/* Top row: Name & Duration */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: '20px',
              alignItems: 'start',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              padding: '24px',
            }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                  Wheel Name
                </label>
                <input
                  type="text"
                  value={wheelName}
                  onChange={(e) => setWheelName(e.target.value)}
                  className="form-input"
                  placeholder="e.g. My Custom Wheel"
                  style={{ fontSize: '1rem', padding: '12px 16px', borderRadius: '10px' }}
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                  Spin Duration (sec)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={spinDuration}
                  onChange={(e) => setSpinDuration(Math.max(1, Math.min(60, parseInt(e.target.value) || 1)))}
                  className="form-input"
                  style={{ fontSize: '1rem', padding: '12px 16px', borderRadius: '10px' }}
                />
              </div>
            </div>

            {/* Presentation Display Mode Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Display Presentation Mode
                <span className="info-tooltip tooltip-bottom-left" data-tooltip="Switch between standard circular spinner wheel, CS:GO-style horizontal container opening ticker, or 2D Horse Race.">?</span>
              </span>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
                width: '100%'
              }}>
                {/* 1. Wheel Spinner Mode */}
                <div 
                  onClick={() => setDisplayMode('wheel')}
                  className="glass-panel"
                  style={{
                    padding: '16px 20px',
                    cursor: 'pointer',
                    borderRadius: '14px',
                    border: displayMode === 'wheel' ? '2px solid var(--color-accent)' : '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: displayMode === 'wheel' ? 'rgba(168, 85, 247, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    boxShadow: displayMode === 'wheel' ? '0 0 16px rgba(168, 85, 247, 0.2)' : 'none',
                    transition: 'all 0.25s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (displayMode !== 'wheel') {
                      e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.3)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (displayMode !== 'wheel') {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.3rem' }}>🎡</span>
                    <span style={{ fontSize: '1.02rem', fontWeight: 700, color: '#fff' }}>Wheel Spinner</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    Standard circular rotating wheel spinner with pointer ticks and sector color slices.
                  </p>
                </div>

                {/* 2. Lootbox Opener Mode */}
                <div 
                  onClick={() => setDisplayMode('lootbox')}
                  className="glass-panel"
                  style={{
                    padding: '16px 20px',
                    cursor: 'pointer',
                    borderRadius: '14px',
                    border: displayMode === 'lootbox' ? '2px solid #eab308' : '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: displayMode === 'lootbox' ? 'rgba(234, 179, 8, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    boxShadow: displayMode === 'lootbox' ? '0 0 16px rgba(234, 179, 8, 0.2)' : 'none',
                    transition: 'all 0.25s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (displayMode !== 'lootbox') {
                      e.currentTarget.style.borderColor = 'rgba(234, 179, 8, 0.3)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (displayMode !== 'lootbox') {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.3rem' }}>📦</span>
                    <span style={{ fontSize: '1.02rem', fontWeight: 700, color: '#fff' }}>Lootbox Opener</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    Counter-Strike style horizontal case openings with crate shake animations and card highlights.
                  </p>
                </div>

                {/* 3. Horse Race Mode */}
                <div 
                  onClick={() => setDisplayMode('race')}
                  className="glass-panel"
                  style={{
                    padding: '16px 20px',
                    cursor: 'pointer',
                    borderRadius: '14px',
                    border: displayMode === 'race' ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: displayMode === 'race' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    boxShadow: displayMode === 'race' ? '0 0 16px rgba(16, 185, 129, 0.2)' : 'none',
                    transition: 'all 0.25s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (displayMode !== 'race') {
                      e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (displayMode !== 'race') {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.3rem' }}>🐎</span>
                    <span style={{ fontSize: '1.02rem', fontWeight: 700, color: '#fff' }}>Horse Race</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    2D horizontal horse race! Each option runs matching their weighted odds. First to cross wins.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Options Tree */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>Wheel Slices & Options</h3>
            
            <div className="settings-options-scroll">
              <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '16px', minWidth: '100%', width: 'max-content', paddingRight: '20px' }}>
                {options.map((opt) => renderOptionNode(opt))}
              </div>
            </div>

            <button
              onClick={addTopLevelOption}
              className="btn btn-secondary"
              style={{
                marginTop: '12px',
                borderStyle: 'dashed',
                borderWidth: '2px',
                borderColor: 'var(--color-accent)',
                color: 'var(--color-accent)',
                padding: '12px'
              }}
            >
              Add New Top-Level Slice
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '20px 30px',
          borderTop: '1px solid var(--border-glass)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          backgroundColor: 'rgba(0, 0, 0, 0.45)'
        }}>
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="btn btn-primary">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
