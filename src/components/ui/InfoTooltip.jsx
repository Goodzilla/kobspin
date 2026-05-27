import styles from './InfoTooltip.module.css';

/**
 * Reusable InfoTooltip component displaying contextual help on hover.
 * @param {Object} props
 * @param {string} props.text - Tooltip text content
 * @param {'top'|'bottom-left'} [props.position] - Tooltip position modifier
 */
export default function InfoTooltip({ text, position = 'top' }) {
  const isBottomLeft = position === 'bottom-left';
  const combinedClassName = `${styles.tooltip} ${isBottomLeft ? styles.tooltipBottomLeft : ''}`.trim();
  
  return (
    <span 
      className={combinedClassName} 
      data-tooltip={text}
    >
      ?
    </span>
  );
}
