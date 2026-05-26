import { useState } from 'react';

export default function History({ history, onClearHistory, onBack }) {
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const formatTimestamp = (ts) => {
    try {
      const date = new Date(ts);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const getOutcomeBadgeStyles = (outcome) => {
    switch (outcome) {
      case 'won':
        return {
          backgroundColor: 'rgba(34, 197, 94, 0.15)',
          color: '#4ade80',
          borderColor: 'rgba(34, 197, 94, 0.3)',
          icon: '👑'
        };
      case 'shroud-lost':
      case 'shroud-broken':
        return {
          backgroundColor: 'rgba(168, 85, 247, 0.15)',
          color: '#c084fc',
          borderColor: 'rgba(168, 85, 247, 0.3)',
          icon: '☁️'
        };
      case 'shield-lost':
      case 'shield-broken':
        return {
          backgroundColor: 'rgba(6, 182, 212, 0.15)',
          color: '#22d3ee',
          borderColor: 'rgba(6, 182, 212, 0.3)',
          icon: '🛡️'
        };
      case 'life-lost':
        return {
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          color: '#f87171',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          icon: '💔'
        };
      case 'evolved':
        return {
          backgroundColor: 'rgba(249, 115, 22, 0.15)',
          color: '#fb923c',
          borderColor: 'rgba(249, 115, 22, 0.3)',
          icon: '✨'
        };
      case 'eliminated':
        return {
          backgroundColor: 'rgba(156, 163, 175, 0.12)',
          color: '#9ca3af',
          borderColor: 'rgba(156, 163, 175, 0.25)',
          icon: '💀'
        };
      case 'nested-transition':
        return {
          backgroundColor: 'rgba(234, 179, 8, 0.12)',
          color: '#fde047',
          borderColor: 'rgba(234, 179, 8, 0.25)',
          icon: '🔥'
        };
      default:
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          color: '#fff',
          borderColor: 'rgba(255, 255, 255, 0.15)',
          icon: '🎯'
        };
    }
  };

  return (
    <div className="history-page animate-fade-in" style={{ maxWidth: '850px', margin: '0 auto', padding: '40px 20px', position: 'relative' }}>
      
      {/* Background glow spotlights */}
      <div style={{
        position: 'absolute',
        top: '0',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '700px',
        height: '400px',
        background: 'radial-gradient(ellipse at center, rgba(168, 85, 247, 0.07) 0%, rgba(6, 182, 212, 0.02) 50%, transparent 80%)',
        pointerEvents: 'none',
        zIndex: -1
      }} />

      {/* Top Navbar Header actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <button onClick={onBack} className="btn btn-secondary">
          Back to Home
        </button>

        {history.length > 0 && (
          <div style={{ position: 'relative' }}>
            {!showConfirmClear ? (
              <button 
                onClick={() => setShowConfirmClear(true)} 
                className="btn btn-secondary"
                style={{ 
                  borderColor: 'rgba(239, 68, 68, 0.3)', 
                  color: '#ef4444' 
                }}
              >
                Clear History
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: 'rgba(7, 5, 15, 0.8)', padding: '4px 8px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginRight: '4px' }}>Confirm?</span>
                <button 
                  onClick={() => {
                    onClearHistory();
                    setShowConfirmClear(false);
                  }}
                  className="btn btn-secondary" 
                  style={{ 
                    padding: '4px 10px', 
                    fontSize: '0.8rem', 
                    backgroundColor: '#ef4444', 
                    color: '#fff',
                    border: 'none' 
                  }}
                >
                  Yes
                </button>
                <button 
                  onClick={() => setShowConfirmClear(false)}
                  className="btn btn-secondary" 
                  style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                >
                  No
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #ffffff 40%, #a855f7 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '12px',
          letterSpacing: '-0.03em'
        }}>
          Spin & Open History
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem' }}>
          Real-time rundown of your local spinner results and container openings.
        </p>
      </header>

      {/* Main List */}
      {history.length === 0 ? (
        <div className="glass-panel" style={{
          padding: '60px 40px',
          textAlign: 'center',
          borderColor: 'rgba(255, 255, 255, 0.05)',
          background: 'rgba(255, 255, 255, 0.015)'
        }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>📖</span>
          <h3 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '8px' }}>No History Recorded</h3>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '440px', margin: '0 auto', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Spin any custom wheel or open a container to see outcomes, remaining option lives, and elimination logs.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {history.map((item) => {
            const styles = getOutcomeBadgeStyles(item.outcome);
            return (
              <div 
                key={item.id}
                className="glass-panel"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px',
                  borderColor: 'rgba(255, 255, 255, 0.05)',
                  backgroundColor: 'rgba(15, 12, 28, 0.45)',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}
              >
                {/* Left side: option representation */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '240px' }}>
                  {/* Colored indicator circle */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: item.optionColor || 'var(--color-accent)',
                    boxShadow: `0 0 12px ${item.optionColor || 'var(--color-accent)'}88`,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: '#fff',
                    fontSize: '0.9rem'
                  }}>
                    {item.optionName ? item.optionName.charAt(0).toUpperCase() : '?'}
                  </div>

                  {/* Text details */}
                  <div style={{ minWidth: 0 }}>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#fff', fontWeight: 650, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {item.optionName}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        {item.wheelName}
                      </span>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 750,
                        textTransform: 'uppercase',
                        padding: '1.5px 6px',
                        borderRadius: '4px',
                        letterSpacing: '0.04em',
                        backgroundColor: item.isLootbox ? 'rgba(168, 85, 247, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                        color: item.isLootbox ? '#c084fc' : '#60a5fa',
                        border: `1px solid ${item.isLootbox ? 'rgba(168, 85, 247, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`
                      }}>
                        {item.isLootbox ? 'Lootbox' : 'Wheel'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side: Outcome Badge and Timestamp */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  {/* Outcome tag */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    border: `1px solid ${styles.borderColor}`,
                    backgroundColor: styles.backgroundColor,
                    color: styles.color
                  }}>
                    <span>{styles.icon}</span>
                    <span>{item.eventText}</span>
                  </div>

                  {/* Time stamp */}
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', minWidth: '90px', textAlign: 'right' }}>
                    {formatTimestamp(item.timestamp)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
