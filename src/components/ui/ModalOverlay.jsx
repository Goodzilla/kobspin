import { useEffect } from 'react';
import styles from './ModalOverlay.module.css';

/**
 * Reusable ModalOverlay component with blur backdrop and body scroll lock.
 * @param {Object} props
 * @param {React.ReactNode} props.children - Modal content
 * @param {Function} [props.onClose] - Optional callback triggered when backdrop is clicked
 * @param {string} [props.className] - Optional custom overlay class name
 * @param {Object} [props.style] - Optional custom overlay style
 */
export default function ModalOverlay({ children, onClose, className = '', style = {}, ...props }) {
  // Lock body scroll while modal is active
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  const combinedClassName = `${styles.overlay} animate-overlay ${className}`.trim();

  return (
    <div 
      className={combinedClassName} 
      style={style} 
      onClick={handleBackdropClick}
      {...props}
    >
      {children}
    </div>
  );
}
