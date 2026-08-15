import React, { useState } from 'react';
import { MdClose } from 'react-icons/md';

const UnlistListing = ({ listing, onClose, onConfirm, isRelist = false, isLoading = false }) => {
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    onConfirm(reason);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-8">
      <div className="w-full max-w-[652px] min-h-[240px] bg-white rounded-[20px] border border-black shadow-lg overflow-hidden relative flex flex-col justify-between p-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="w-6 h-6 absolute top-6 right-6 flex items-center justify-center hover:bg-gray-100 rounded transition-colors disabled:opacity-50 cursor-pointer"
        >
          <MdClose className="w-5 h-5 text-black" />
        </button>

        {/* Content */}
        <div className="flex flex-col justify-center items-center gap-4 mt-2">
          <h2 className="text-black text-lg font-bold font-aeonik">
            {isRelist ? 'Relist Property' : 'Unlist Property'}
          </h2>
          <div className="text-center px-4">
            <p className="text-slate-900 text-base font-medium font-aeonik">
              ID: {listing?.id || 'LST001'} - {listing?.title || 'Property'} - Host: {listing?.hostName || listing?.host?.fullName || 'Host'}
            </p>
            <p className="text-sm text-slate-500 font-aeonik mt-2">
              {isRelist
                ? 'This property will be restored to active status and made visible on guest explore and searches.'
                : 'This property will be hidden from guest explore feeds and searches, but will remain accessible in the admin dashboard.'}
            </p>
          </div>

          {!isRelist && (
            <div className="w-full max-w-[500px] mt-1">
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for unlisting (optional)"
                disabled={isLoading}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-aeonik focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-all"
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mx-auto mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-3xl border-2 border-slate-300 inline-flex justify-center items-center gap-1 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <span className="text-slate-700 text-sm font-bold font-aeonik">Cancel</span>
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`px-6 py-2.5 rounded-3xl inline-flex justify-center items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
              isRelist
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="text-white text-sm font-bold font-aeonik">Processing...</span>
              </>
            ) : (
              <span className="text-white text-sm font-bold font-aeonik">
                {isRelist ? 'Confirm Relist' : 'Confirm Unlist'}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnlistListing;
