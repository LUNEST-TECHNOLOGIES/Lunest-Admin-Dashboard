import React, { useEffect } from 'react';
import { MdClose, MdCheckCircle, MdError, MdInfo, MdWarning } from 'react-icons/md';

const NotificationPopup = ({ 
  title, 
  message, 
  type = 'success', // 'success', 'error', 'info', 'warning'
  onClose, 
  duration = 4000,
  position = 'top-right' // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
}) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const positionClasses = {
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
  };

  const typeStyles = {
    success: {
      bg: 'bg-white',
      border: 'outline-green-200',
      textColor: 'text-green-600',
      titleColor: 'text-green-600',
      icon: <MdCheckCircle className="w-6 h-6 text-green-600" />,
    },
    error: {
      bg: 'bg-white',
      border: 'outline-red-200',
      textColor: 'text-red-600',
      titleColor: 'text-red-600',
      icon: <MdError className="w-6 h-6 text-red-600" />,
    },
    warning: {
      bg: 'bg-white',
      border: 'outline-yellow-200',
      textColor: 'text-yellow-600',
      titleColor: 'text-yellow-600',
      icon: <MdWarning className="w-6 h-6 text-yellow-600" />,
    },
    info: {
      bg: 'bg-white',
      border: 'outline-blue-200',
      textColor: 'text-blue-600',
      titleColor: 'text-blue-600',
      icon: <MdInfo className="w-6 h-6 text-blue-600" />,
    },
  };

  const style = typeStyles[type] || typeStyles.success;

  return (
    <div className={`fixed ${positionClasses[position]} z-[10000] animate-in fade-in slide-in-from-top-2 duration-300`}>
      <div className={`w-96 min-h-24 ${style.bg} outline outline-1 outline-offset-[-1px] ${style.border} rounded-lg overflow-hidden shadow-lg flex items-start gap-4 p-4`}>
        {/* Icon */}
        <div className="flex-shrink-0 pt-1">
          {style.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-medium font-aeonik ${style.titleColor} mb-1`}>
            {title}
          </h3>
          <p className={`text-sm font-normal font-aeonik ${style.textColor} break-words`}>
            {message}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors pt-1"
        >
          <MdClose className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default NotificationPopup;
