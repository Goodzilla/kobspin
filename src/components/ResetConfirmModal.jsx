

import { createPortal } from 'react-dom';

export default function ResetConfirmModal({
  isOpen,
  onClose,
  onConfirm
}) {
  if (!isOpen) return null;

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100dvh',
      backgroundColor: 'rgba(7, 5, 15, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 110,
      padding: '20px',
      overflowY: 'auto'
    }} className="animate-overlay">
      <div className="glass-panel animate-scale-in" style={{
        maxWidth: '400px',
        width: '100%',
        padding: '30px 24px',
        textAlign: 'center',
        borderColor: 'rgba(168, 85, 247, 0.3)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), var(--shadow-neon)'
      }}>
        <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}>🔄</span>
        <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '10px' }}>Reset Wheel?</h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.4' }}>
          Are you sure you want to reset this wheel? All options will restore to their starting lives, and any unlocked options will be reset.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={onClose} 
            className="btn btn-secondary" 
            style={{ flex: 1, padding: '10px' }}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="btn btn-primary" 
            style={{ flex: 1, padding: '10px', backgroundColor: 'var(--color-accent)' }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
