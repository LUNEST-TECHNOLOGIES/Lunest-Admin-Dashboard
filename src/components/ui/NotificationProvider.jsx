import React, { createContext, useContext, useState, useCallback } from 'react';
import NotificationPopup from '../dashboard/management/shared/NotificationPopup';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      title: notification.title || 'Notification',
      message: notification.message || '',
      type: notification.type || 'info',
      duration: notification.duration !== undefined ? notification.duration : 4000,
      position: notification.position || 'bottom-right',
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove if duration is set
    if (newNotification.duration) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const notify = {
    success: (title, message, options = {}) =>
      addNotification({ title, message, type: 'success', ...options }),
    error: (title, message, options = {}) =>
      addNotification({ title, message, type: 'error', ...options }),
    warning: (title, message, options = {}) =>
      addNotification({ title, message, type: 'warning', ...options }),
    info: (title, message, options = {}) =>
      addNotification({ title, message, type: 'info', ...options }),
  };

  return (
    <NotificationContext.Provider value={{ notify, addNotification, removeNotification }}>
      {children}
      {/* Render all active notifications */}
      {notifications.map(notif => (
        <NotificationPopup
          key={notif.id}
          title={notif.title}
          message={notif.message}
          type={notif.type}
          duration={notif.duration}
          position={notif.position}
          onClose={() => removeNotification(notif.id)}
        />
      ))}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context.notify;
};

export default NotificationContext;
