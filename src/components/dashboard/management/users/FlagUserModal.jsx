import React, { useState } from 'react';
import { useNotification } from '../../../ui/NotificationProvider';

const FlagUserModal = ({ isOpen, onClose, user }) => {
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const notify = useNotification();

  if (!isOpen) return null;

  const handleFlagUser = async () => {
    if (!reason.trim()) {
      notify.warning('Validation Error', 'Please provide a reason for flagging this user');
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      notify.success('User Flagged', `${user.name} has been flagged for review`);
      setReason('');
      onClose();
    } catch (error) {
      notify.error('Flag Failed', 'Failed to flag user. Please try again.');
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
      <div className="w-[652px] h-96 relative bg-white rounded-[20px] outline outline-1 outline-offset-[-1px] outline-black overflow-hidden">
        {/* Close Button */}
        <button
          onClick={handleCancel}
          className="w-6 h-6 left-[610px] top-[21px] absolute overflow-hidden cursor-pointer hover:opacity-70 transition-opacity flex items-center justify-center z-10"
        >
          <img src="/assets/icons/action-menu/close-x.svg" alt="Close" className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="absolute left-[99.50px] top-[26px] inline-flex flex-col justify-center items-center gap-7">
          <div className="justify-start text-black text-lg font-bold font-aeonik">Flag User</div>
          <div className="w-[453px] text-center justify-start text-slate-900 text-base font-medium font-aeonik leading-5">
            User: {user.name} with ID: {user.walletId}
          </div>
        </div>

        {/* Reason Input */}
        <div className="w-[602px] h-28 left-[24px] top-[143px] absolute">
          <label className="left-[1px] top-0 absolute justify-start text-black text-sm font-semibold font-aeonik">
            Reason
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Give a reason here..."
            disabled={isProcessing}
            className="w-[602px] h-20 left-0 top-[31px] absolute rounded-[10px] border-[0.50px] border-neutral-500 px-4 py-3 focus:outline-none focus:border-slate-900 resize-none font-inter text-sm placeholder-neutral-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Action Buttons */}
        <div className="w-80 left-[159px] top-[298px] absolute inline-flex justify-between items-start gap-4">
          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className="px-5 py-3 rounded-3xl outline outline-1 outline-offset-[-1px] outline-red-600 flex justify-center items-center gap-1 cursor-pointer hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="justify-start text-red-600 text-base font-bold font-aeonik leading-4">Cancel</div>
          </button>
          <button
            onClick={handleFlagUser}
            disabled={isProcessing}
            className="w-36 px-2.5 py-3 bg-slate-900 rounded-3xl flex justify-center items-center gap-1 cursor-pointer hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="justify-start text-white text-base font-bold font-aeonik leading-4">
              {isProcessing ? 'Flagging...' : 'Flag User'}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlagUserModal;
