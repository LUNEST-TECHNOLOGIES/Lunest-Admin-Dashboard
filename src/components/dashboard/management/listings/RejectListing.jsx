import React, { useState } from 'react';
import { MdClose } from 'react-icons/md';

const RejectListing = ({ listing, onClose, onReject, isLoading = false }) => {
  const [reason, setReason] = useState('');

  const handleReject = () => {
    onReject({
      listingId: listing?.id,
      reason: reason.trim(),
    });
    setReason('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-8">
      <div className="w-full max-w-[652px] h-96 bg-white rounded-[20px] border border-black shadow-lg overflow-hidden relative flex flex-col justify-between p-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="w-6 h-6 absolute top-6 right-6 flex items-center justify-center hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
        >
          <MdClose className="w-5 h-5 text-black" />
        </button>

        {/* Header Content */}
        <div className="flex flex-col justify-center items-center gap-7 mt-2">
          <h2 className="text-black text-lg font-bold font-aeonik">Reject Listing</h2>
          <div className="text-center">
            <p className="text-slate-900 text-base font-medium font-aeonik">
              Are you sure you want to reject this listing,<br />
              ID: {listing?.id || 'LST001'} - {listing?.title || 'Modern Apartment in Manhattan'} - User: {listing?.hostName || 'John Doe'}
            </p>
          </div>
        </div>

        {/* Reason Input */}
        <div className="flex-1 flex flex-col gap-2 my-4">
          <label className="text-black text-sm font-semibold font-aeonik">Rejection Reason Note <span className="text-red-500">*</span></label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isLoading}
            placeholder="Explain why this listing is being rejected (e.g., Incomplete photos, invalid address, etc.). This note will be sent to the host's email."
            className="flex-1 p-4 border-2 border-neutral-200 rounded-[10px] text-slate-700 text-sm font-normal font-inter placeholder-neutral-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Action Buttons */}
        <div className="w-60 flex gap-4 justify-center mx-auto">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-3 rounded-3xl border-2 border-slate-300 inline-flex justify-center items-center gap-1 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-slate-600 text-base font-bold font-aeonik leading-4">Cancel</span>
          </button>
          <button
            onClick={handleReject}
            disabled={isLoading || !reason.trim()}
            className="px-5 py-3 bg-red-600 rounded-3xl inline-flex justify-center items-center gap-1 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="text-white text-base font-bold font-aeonik leading-4">Processing...</span>
              </>
            ) : (
              <span className="text-white text-base font-bold font-aeonik leading-4">Reject</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectListing;
