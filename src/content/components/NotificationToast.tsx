import React, { useEffect } from 'react';

interface NotificationToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  message,
  type,
  duration = 3000,
  onClose
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  const getClassName = () => {
    return `gitbookmark-notification gitbookmark-notification--${type}`;
  };

  return (
    <div className={getClassName()}>
      <span className="gitbookmark-notification__icon">{getIcon()}</span>
      <span className="gitbookmark-notification__message">{message}</span>
      <button
        className="gitbookmark-notification__close"
        onClick={onClose}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
};
