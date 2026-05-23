import { useState } from 'react';
import { getVibrantColor, generateId } from '../utils';

export default function SettingsModal({ wheel, wheels = [], onSave, onClose }) {
  const [wheelName, setWheelName] = useState(wheel.name);
  const [spinDuration, setSpinDuration] = useState(wheel.spinDuration || 10);
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
    onSave(wheelName.trim(), options, spinDuration);
  };

  // Render a single option block and its children recursively
  const renderOptionNode = (opt, depth = 0) => {
    return (
      <div key={opt.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div 
          className="glass-panel" 
          style={{
            padding: '16px 20px',
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
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '12px',
            alignItems: 'center'
          }}>
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
                fontWeight: 600, 
                fontSize: '0.85rem',
                color: 'var(--color-text-secondary)',
                textTransform: 'uppercase'
              }}>
                {depth === 0 ? 'Top-Level Option' : `Unlock Option Level ${depth}`}
              </span>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <input
                type="text"
                value={opt.name}
                onChange={(e) => updateOption(opt.id, { name: e.target.value })}
                className="form-input"
                placeholder="Option Label (e.g. Pizza 🍕)"
                style={{ width: '100%' }}
              />
            </div>

            {/* Option Type and Target Wheel Selection */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Option Type</label>
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
                        name: opt.name.startsWith('Option') && defaultTarget ? `Link: ${defaultTarget.name}` : opt.name
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
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Target Wheel</label>
                  <select
                    value={opt.linkedWheelId}
                    onChange={(e) => {
                      const targetId = e.target.value;
                      const targetWheel = wheels.find(w => w.id === targetId);
                      updateOption(opt.id, {
                        linkedWheelId: targetId,
                        name: targetWheel ? `Link: ${targetWheel.name}` : opt.name
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

            <div className="form-row" style={{ gap: '12px', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ marginBottom: 0, flex: 2 }}>
                <label className="form-label">Weight (Chance)</label>
                <input
                  type="number"
                  min="1"
                  value={opt.weight}
                  onChange={(e) => updateOption(opt.id, { weight: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="form-input"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0, flex: 2 }}>
                <label className="form-label">Lives (Hearts)</label>
                <input
                  type="number"
                  min="1"
                  value={opt.lives === 0 ? '' : opt.lives}
                  disabled={opt.lives === 0}
                  placeholder="∞"
                  onChange={(e) => updateOption(opt.id, { lives: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="form-input"
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '42px', paddingBottom: '8px' }}>
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

            {/* Actions for this specific node */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginTop: '8px', 
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              paddingTop: '10px',
              alignItems: 'center'
            }}>
              {opt.lives === 0 ? (
                <span style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: 600 }}>
                  🛡️ Permanent option (unlimited lives)
                </span>
              ) : !opt.subOption ? (
                <button
                  onClick={() => addSubOption(opt.id)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '6px 12px', borderColor: 'rgba(168, 85, 247, 0.2)' }}
                >
                  ➕ Add Next Unlock
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
                🗑️ Delete
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
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(7, 5, 15, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
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
          {/* Wheel Name & Spin Duration */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Wheel Name</label>
              <input
                type="text"
                value={wheelName}
                onChange={(e) => setWheelName(e.target.value)}
                className="form-input"
                placeholder="e.g. My Custom Wheel"
                style={{ fontSize: '1.1rem', fontWeight: 600 }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Spin duration (sec)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={spinDuration}
                onChange={(e) => setSpinDuration(Math.max(1, Math.min(60, parseInt(e.target.value) || 1)))}
                className="form-input"
                style={{ fontSize: '1.1rem', fontWeight: 600 }}
              />
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
              ➕ Add New Top-Level Slice
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
