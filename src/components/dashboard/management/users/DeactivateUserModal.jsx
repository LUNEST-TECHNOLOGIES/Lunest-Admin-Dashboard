import React, { useState } from 'react';
import { useNotification } from '../../../ui/NotificationProvider';
import { toggleUserStatus } from '../../../../services/adminService';

const DeactivateUserModal = ({ isOpen, onClose, user, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const notify = useNotification();

  if (!isOpen) return null;

  const isActive = user?.status === 'Active';

  const handleToggleStatus = async () => {
    if (!isActive && !reason.trim()) {
      // Reason not required for activation
    }
    
    if (isActive && !reason.trim()) {
      notify.warning('Validation Error', 'Please provide a reason for deactivating this user');
      return;
    }

    // Validate user id exists
    if (!user?.id) {
      console.error('User ID is missing:', user);
      notify.error('Error', 'User ID is missing. Please refresh and try again.');
      return;
    }

    console.log('Toggling user status:', { userId: user.id, active: !isActive, reason });

    setIsProcessing(true);
    try {
      await toggleUserStatus(user.id, !isActive, reason);
      
      const action = isActive ? 'deactivated' : 'activated';
      notify.success(
        `User ${isActive ? 'Deactivated' : 'Activated'}`, 
        `${user.name} has been successfully ${action}`
      );
      setReason('');
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error toggling user status:', error);
      notify.error(
        `${isActive ? 'Deactivation' : 'Activation'} Failed`, 
        error.message || `Failed to ${isActive ? 'deactivate' : 'activate'} user. Please try again.`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="w-[652px] relative bg-white rounded-[20px] outline outline-1 outline-offset-[-1px] outline-black overflow-hidden p-6">
        {/* Close Button */}
        <button
          onClick={handleCancel}
          className="absolute right-5 top-5 w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity flex items-center justify-center z-10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            {isActive ? (
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
          </div>
          <h2 className="text-lg font-bold font-aeonik text-black">
            {isActive ? 'Deactivate User' : 'Activate User'}
          </h2>
          <p className="text-base font-medium font-aeonik text-slate-900 mt-2">
            User: <span className="font-semibold">{user?.name}</span> (ID: {user?.walletId})
          </p>
        </div>

        {/* Warning Message */}
        <div className={`p-4 rounded-lg mb-4 ${isActive ? 'bg-red-50' : 'bg-green-50'}`}>
          <div className="flex items-start gap-3">
            <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isActive ? 'text-red-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              {isActive ? (
                <>
                  <p className="text-sm font-medium text-red-800">This will immediately:</p>
                  <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                    <li>Prevent the user from logging in</li>
                    <li>Pause all their active listings</li>
                    <li>Disable their ability to make bookings</li>
                  </ul>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-green-800">This will immediately:</p>
                  <ul className="text-sm text-green-700 mt-1 list-disc list-inside">
                    <li>Allow the user to log in again</li>
                    <li>Restore their listings (if any)</li>
                    <li>Enable their ability to make bookings</li>
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Reason Input (only for deactivation) */}
        {isActive && (
          <div className="mb-6">
            <label className="block text-sm font-semibold font-aeonik text-black mb-2">
              Reason for Deactivation <span className="text-red-600">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a reason for deactivating this account (e.g., policy violation, fraud, etc.)..."
              disabled={isProcessing}
              className="w-full h-24 rounded-[10px] border-[0.50px] border-neutral-500 px-4 py-3 focus:outline-none focus:border-slate-900 resize-none font-inter text-sm placeholder-neutral-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className="px-6 py-3 rounded-3xl outline outline-1 outline-offset-[-1px] outline-gray-400 flex justify-center items-center cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-gray-700 text-base font-bold font-aeonik">Cancel</span>
          </button>
          <button
            onClick={handleToggleStatus}
            disabled={isProcessing}
            className={`min-w-[140px] px-6 py-3 rounded-3xl flex justify-center items-center cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isActive 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            <span className="text-white text-base font-bold font-aeonik">
              {isProcessing 
                ? (isActive ? 'Deactivating...' : 'Activating...') 
                : (isActive ? 'Deactivate' : 'Activate')
              }
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeactivateUserModal;
