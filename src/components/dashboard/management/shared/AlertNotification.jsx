import React, { useEffect } from 'react';
import { MdCheckCircle, MdError, MdInfo, MdClose } from 'react-icons/md';

const AlertNotification = ({ 
  message, 
  type = 'success', 
  onClose, 
  duration = 3000,
  position = 'top-right'
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

  const bgColor = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-yellow-50 border-yellow-200',
  };

  const textColor = {
    success: 'text-green-800',
    error: 'text-red-800',
    info: 'text-blue-800',
    warning: 'text-yellow-800',
  };

  const iconColor = {
    success: 'text-green-600',
    error: 'text-red-600',
    info: 'text-blue-600',
    warning: 'text-yellow-600',
  };

  const Icon = {
    success: MdCheckCircle,
    error: MdError,
    info: MdInfo,
    warning: MdError,
  }[type];

  return (
    <div className={`fixed ${positionClasses[position]} z-[10000] animate-in fade-in slide-in-from-top-2 duration-300`}>
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border border-1 shadow-lg ${bgColor[type]}`}>
        <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor[type]}`} />
        <p className={`text-sm font-medium font-aeonik ${textColor[type]}`}>
          {message}
        </p>
        <button
          onClick={onClose}
          className="ml-2 flex-shrink-0 hover:bg-black/10 p-1 rounded transition-colors"
        >
          <MdClose className={`w-4 h-4 ${textColor[type]}`} />
        </button>
      </div>
    </div>
  );
};

export default AlertNotification;
