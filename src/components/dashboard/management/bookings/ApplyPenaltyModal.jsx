import React, { useState } from 'react';
import { MdClose } from 'react-icons/md';
import { useNotification } from '../../../ui/NotificationProvider';

const ApplyPenaltyModal = ({ booking, onClose, onApplyPenalty }) => {
  const notify = useNotification();
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApplyPenalty = () => {
    setIsProcessing(true);

    // Simulate API call
    setTimeout(() => {
      onApplyPenalty({
        bookingId: booking?.id,
        reason: reason.trim(),
      });

      notify.warning(
        'Host Penalized!',
        `Booking ID: ${booking?.id} - Host ${booking?.hostName} has been penalized.`
      );

      setReason('');
      setIsProcessing(false);
      onClose();
    }, 500);
  };

  const handleCancel = () => {
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-8">
      <div className="w-[652px] h-96 relative bg-white rounded-[20px] outline outline-1 outline-offset-[-1px] outline-black overflow-hidden shadow-lg">
        
        {/* Close Button */}
        <button
          onClick={handleCancel}
          className="w-6 h-6 left-[610px] top-[21px] absolute overflow-hidden flex items-center justify-center hover:bg-gray-100 rounded transition-colors cursor-pointer"
        >
          <MdClose className="w-3.5 h-3.5 text-black" />
        </button>

        {/* Header Content */}
        <div className="left-[99.50px] top-[26px] absolute inline-flex flex-col justify-center items-center gap-7">
          <h2 className="text-black text-lg font-bold font-aeonik">
            Apply Penalty
          </h2>
          <p className="w-[453px] text-center text-slate-900 text-base font-medium font-aeonik leading-5">
            Apply penalty for booking {booking?.id || 'MN94567'}?
          </p>
        </div>

        {/* Reason Input */}
        <div className="w-[602px] h-28 left-[24px] top-[143px] absolute">
          <label className="left-[1px] top-0 absolute text-black text-sm font-semibold font-aeonik">
            Reason (Optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Give a reason here..."
            className="w-[602px] h-20 left-0 top-[31px] absolute rounded-[10px] border-[0.50px] border-neutral-500 p-4 text-neutral-500 text-sm font-normal font-inter placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="w-80 left-[158px] top-[298px] absolute inline-flex justify-between items-start gap-4">
          
          {/* Cancel Button */}
          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className="px-5 py-3 rounded-3xl outline outline-1 outline-offset-[-1px] outline-red-600 flex justify-center items-center gap-1 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-red-600 text-base font-bold font-aeonik leading-4">
              Cancel
            </span>
          </button>

          {/* Apply Penalty Button */}
          <button
            onClick={handleApplyPenalty}
            disabled={isProcessing}
            className="w-36 px-2.5 py-3 bg-slate-900 rounded-3xl flex justify-center items-center gap-1 hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-white text-base font-bold font-aeonik leading-4">
              {isProcessing ? 'Processing...' : 'Apply Penalty'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplyPenaltyModal;
