import { useEffect } from "react";
import styles from "./Toast.module.css";

interface ToastProps {
  message: string;
  host?: string;
  onClose: () => void;
  duration?: number;
}

export const Toast = ({ message, host, onClose, duration = 5000 }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, onClose, duration]);

  return (
    <div className={styles.toast} role="alert">
      <span className={styles.message}>
        {message}
        {host && <span className={styles.host}>{host}</span>}
      </span>
      <button className={styles.close} onClick={onClose} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
};
