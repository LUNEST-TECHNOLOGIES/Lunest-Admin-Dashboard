import React from 'react';
import { MdClose, MdCheckCircle, MdError } from 'react-icons/md';

const KYCResultModal = ({ isOpen, onClose, type = 'success', message, title }) => {
  if (!isOpen) return null;

  const isSuccess = type === 'success';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-8 z-10 animate-in fade-in zoom-in duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <MdClose className="w-6 h-6" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isSuccess ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {isSuccess ? (
              <MdCheckCircle className="w-14 h-14" />
            ) : (
              <MdError className="w-14 h-14" />
            )}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2 font-aeonik">
          {title || (isSuccess ? 'Action Successful' : 'Action Failed')}
        </h2>

        {/* Message */}
        <p className="text-center text-gray-600 mb-8 font-aeonik">
          {message}
        </p>

        {/* Button */}
        <button
          onClick={onClose}
          className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg ${isSuccess ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}`}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default KYCResultModal;
