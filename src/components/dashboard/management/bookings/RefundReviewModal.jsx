import React, { useState } from 'react';
import { useNotification } from '../../../ui/NotificationProvider';

const RefundReviewModal = ({ booking, onClose, onApprove }) => {
  const notify = useNotification();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApproveRefund = () => {
    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      onApprove({
        bookingId: booking?.id,
        amount: booking?.amount,
      });
      
      notify.success(
        'Refund Approved!',
        `Booking ID: ${booking?.id} - Refund of ${booking?.amount} has been approved for ${booking?.guestName}.`
      );
      
      setIsProcessing(false);
      onClose();
    }, 500);
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-8">
      <div className="w-96 h-52 relative bg-white rounded-[10px] outline outline-2 outline-offset-[-2px] outline-blue-700 overflow-hidden shadow-lg">
        
        {/* Header Content */}
        <div className="left-[67px] top-[30.50px] absolute inline-flex flex-col justify-center items-center gap-2.5">
          <h3 className="text-slate-900 text-lg font-medium font-aeonik">
            Refund under review!
          </h3>
          <p className="text-center text-slate-900 text-sm font-medium font-aeonik leading-5">
            Process refund for Booking ID: {booking?.id || 'ML94567'}?<br />
            This action cannot be undone.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="left-[53.50px] top-[141px] absolute inline-flex justify-start items-start gap-10">
          
          {/* Approve Refund Button */}
          <button
            onClick={handleApproveRefund}
            disabled={isProcessing}
            className="px-5 py-3 rounded-3xl outline outline-1 outline-offset-[-1px] outline-red-600 flex justify-center items-center gap-1 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-red-600 text-base font-bold font-aeonik leading-4">
              {isProcessing ? 'Processing...' : 'Approve Refund'}
            </span>
          </button>

          {/* Cancel Button */}
          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className="px-5 py-3 bg-slate-900 rounded-3xl flex justify-center items-center gap-1 hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-white text-base font-bold font-aeonik leading-4">
              Cancel
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RefundReviewModal;
