import React, { useState, useEffect } from 'react';
import { getAdminNotifications, markNotificationRead, markAllNotificationsRead } from '../../services/adminService';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Initial fetch for unread count
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      // Don't fetch if not logged in
      return;
    }
    
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await getAdminNotifications({ limit: 10 });
      if (response?.body) {
        setNotifications(response.body.notifications || []);
        setUnreadCount(response.body.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Fall back to empty notifications
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-600';
      case 'medium': return 'bg-orange-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'USER_REGISTERED': return '👤';
      case 'HOST_APPLICATION': return '🏠';
      case 'NEW_LISTING': return '📍';
      case 'NEW_BOOKING': return '📅';
      case 'BOOKING_CANCELLED': return '❌';
      case 'KYC_SUBMITTED': return '📋';
      case 'PAYOUT_REQUEST': return '💰';
      case 'DISPUTE_OPENED': return '⚠️';
      default: return '🔔';
    }
  };

  const formatTimestamp = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Notification Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex w-10 h-10 items-center justify-center flex-shrink-0 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors cursor-pointer relative"
      >
        <div className="w-5 h-5 text-slate-400">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        {/* Notification Badge - shows count if > 0 */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-600 rounded-full border-2 border-white flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
          </div>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-[10px] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.30)] z-50 overflow-hidden">
          {/* Header */}
          <div className="px-5 py-2 bg-white border-b-[0.50px] border-slate-200 flex justify-between items-center">
            <div className="text-slate-900 text-sm font-semibold font-aeonik">
              Notifications {unreadCount > 0 && <span className="text-indigo-600">({unreadCount})</span>}
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List - Scrollable */}
          <div className="h-64 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <span className="text-3xl mb-2">🔔</span>
                <span className="text-sm">No notifications yet</span>
              </div>
            ) : (
              <div className="py-2">
                {notifications.map((notification) => (
                  <div 
                    key={notification._id} 
                    onClick={() => !notification.read && handleMarkAsRead(notification._id)}
                    className={`w-full px-5 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-slate-100 last:border-b-0 ${
                      notification.read ? 'opacity-60' : 'bg-indigo-50/30'
                    }`}
                  >
                    {/* Icon */}
                    <span className="text-lg flex-shrink-0">{getNotificationIcon(notification.type)}</span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityColor(notification.priority)}`} />
                        <div className="text-slate-900 text-sm font-medium font-aeonik truncate">
                          {notification.title}
                        </div>
                      </div>
                      <div className="text-slate-500 text-xs font-aeonik mt-1 line-clamp-2">
                        {notification.message}
                      </div>
                      <div className="text-slate-400 text-xs font-aeonik mt-1">
                        {formatTimestamp(notification.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-gray-50 border-t border-slate-200">
            <button className="w-full text-center text-slate-900 text-sm font-semibold font-aeonik hover:text-indigo-600 transition-colors cursor-pointer">
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
