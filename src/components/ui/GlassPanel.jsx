import styles from './GlassPanel.module.css';

/**
 * Reusable GlassPanel component implementing the glassmorphism aesthetic.
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child elements
 * @param {string} [props.className] - Optional custom class name
 * @param {Object} [props.style] - Optional custom styles
 * @param {boolean} [props.animate] - Set true to apply the 'animate-scale-in' scale animation
 */
export default function GlassPanel({ children, className = '', style = {}, animate = false, ...props }) {
  const combinedClassName = `${styles.panel} ${animate ? 'animate-scale-in' : ''} ${className}`.trim();
  
  return (
    <div className={combinedClassName} style={style} {...props}>
      {children}
    </div>
  );
}
