import React, { useState } from 'react';
import { MdClose } from 'react-icons/md';

const SuspendListing = ({ listing, onClose, onSuspend }) => {
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('7');

  const handleSuspend = () => {
    onSuspend({
      listingId: listing?.id,
      reason: reason.trim(),
      duration: parseInt(duration),
    });
    setReason('');
    setDuration('7');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-8">
      <div className="w-full max-w-[652px] bg-white rounded-[20px] border border-black shadow-lg overflow-hidden relative flex flex-col justify-between p-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-6 h-6 absolute top-6 right-6 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
        >
          <MdClose className="w-5 h-5 text-black" />
        </button>

        {/* Header Content */}
        <div className="flex flex-col justify-center items-center gap-7 mt-2">
          <h2 className="text-black text-lg font-bold font-aeonik">Suspend Listing</h2>
          <div className="text-center">
            <p className="text-slate-900 text-base font-medium font-aeonik">
              Are you sure you want to suspend this listing,<br />
              ID: {listing?.id || 'LST001'} - {listing?.title || 'Modern Apartment in Manhattan'} - User: {listing?.hostName || 'John Doe'}
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="flex flex-col gap-4 my-4">
          {/* Duration */}
          <div className="flex flex-col gap-2">
            <label className="text-black text-sm font-semibold font-aeonik">Suspension Duration (days)</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="p-3 border-0.5 border-neutral-500 rounded-[10px] text-slate-900 text-sm font-normal font-inter focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
            </select>
          </div>

          {/* Reason */}
          <div className="flex flex-col gap-2">
            <label className="text-black text-sm font-semibold font-aeonik">Reason (Optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Give a reason here..."
              className="h-20 p-4 border-0.5 border-neutral-500 rounded-[10px] text-neutral-500 text-sm font-normal font-inter placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-60 flex gap-4 justify-center mx-auto">
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-3xl border-2 border-red-600 inline-flex justify-center items-center gap-1 hover:bg-red-50 transition-colors"
          >
            <span className="text-red-600 text-base font-bold font-aeonik leading-4">Cancel</span>
          </button>
          <button
            onClick={handleSuspend}
            className="px-5 py-3 bg-slate-900 rounded-3xl inline-flex justify-center items-center gap-1 hover:bg-slate-800 transition-colors"
          >
            <span className="text-white text-base font-bold font-aeonik leading-4">Suspend</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuspendListing;
