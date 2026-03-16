import { InputHTMLAttributes, forwardRef } from "react";
import styles from "./Input.module.css";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  fullWidth?: boolean;
}

/**
 * Reusable Input component
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helpText,
      fullWidth = false,
      className = "",
      disabled = false,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        className={`${styles.container} ${fullWidth ? styles.fullWidth : ""}`}
      >
        {label && <label className={styles.label}>{label}</label>}
        <input
          ref={ref}
          className={`${styles.input} ${error ? styles.error : ""} ${className}`}
          disabled={disabled}
          {...props}
        />
        {error && <span className={styles.errorText}>{error}</span>}
        {helpText && !error && (
          <span className={styles.helpText}>{helpText}</span>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
