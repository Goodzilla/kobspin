import InfoTooltip from './InfoTooltip';
import styles from './FormInput.module.css';

/**
 * Reusable FormInput component combining a label, optional tooltip, and input field.
 * @param {Object} props
 * @param {string} [props.label] - Optional input label
 * @param {string} [props.tooltip] - Optional tooltip text
 * @param {string} [props.type] - Input type (default 'text')
 * @param {string} [props.className] - Optional custom class name for the group container
 * @param {string} [props.labelClassName] - Optional custom class name for the label
 * @param {string} [props.inputClassName] - Optional custom class name for the input field
 * @param {string} [props.id] - Optional ID for the input field (used for accessibility)
 */
export default function FormInput({ 
  label, 
  tooltip, 
  type = 'text', 
  className = '', 
  labelClassName = '', 
  inputClassName = '',
  id, 
  ...props 
}) {
  return (
    <div className={`${styles.formGroup} ${className}`.trim()}>
      {label && (
        <label htmlFor={id} className={`${styles.formLabel} ${labelClassName}`.trim()}>
          {label}
          {tooltip && <InfoTooltip text={tooltip} />}
        </label>
      )}
      <input 
        id={id}
        type={type} 
        className={`${styles.formInput} ${inputClassName}`.trim()} 
        {...props} 
      />
    </div>
  );
}
